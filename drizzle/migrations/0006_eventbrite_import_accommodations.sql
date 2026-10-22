CREATE OR REPLACE FUNCTION public.import_eventbrite_registrations(p_event_id uuid, p_request_id uuid, p_rows jsonb, p_dry_run boolean, p_file_sha256 text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
 v_row jsonb; v_line int; v_ext text; v_email text; v_name text; v_barcode text; v_status public.event_registration_record_status;
 v_existing public.event_registrations; v_other uuid; v_outcome text; v_reason text;
 v_consent boolean; v_diet text; v_allergy text; v_access text; v_has_acc boolean;
 n_diet text; n_allergy text; n_access text; n_consent boolean; v_acc_changed boolean; v_claimed boolean;
 v_counts jsonb := jsonb_build_object('new',0,'update',0,'duplicate',0,'conflict',0,'cancelled',0,'invalid',0);
 v_lines jsonb := '[]'::jsonb; v_prior jsonb; v_result jsonb;
BEGIN
 IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Administrator required'; END IF;
 IF NOT EXISTS (SELECT 1 FROM public.events WHERE id=p_event_id) THEN RAISE EXCEPTION 'Event not found'; END IF;
 IF jsonb_typeof(p_rows)<>'array' OR jsonb_array_length(p_rows)>5000 THEN RAISE EXCEPTION 'Import must contain at most 5000 rows'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('eventbrite-import:'||p_event_id::text,0));
 IF NOT p_dry_run THEN
  SELECT result INTO v_prior FROM public.event_operation_audit WHERE event_id=p_event_id AND request_id=p_request_id AND operation='eventbrite_csv_import';
  IF v_prior IS NOT NULL THEN RETURN v_prior || jsonb_build_object('replayed',true); END IF;
 END IF;

 FOR v_row IN SELECT * FROM jsonb_array_elements(p_rows) LOOP
  v_line := (v_row->>'line')::int;
  v_ext := nullif(btrim(v_row->>'external_id'),'');
  v_email := lower(nullif(btrim(v_row->>'email'),''));
  v_name := left(coalesce(nullif(btrim(v_row->>'name'),''),'Eventbrite attendee'),200);
  v_barcode := nullif(btrim(v_row->>'barcode'),'');
  -- Accommodation answers are only accepted with an explicit JSON boolean true consent signal.
  v_consent := jsonb_typeof(v_row->'accommodation_consent')='boolean' AND (v_row->>'accommodation_consent')::boolean;
  v_diet := CASE WHEN v_consent THEN left(nullif(btrim(v_row->>'dietary_restrictions'),''),1000) END;
  v_allergy := CASE WHEN v_consent THEN left(nullif(btrim(v_row->>'food_allergies'),''),1000) END;
  v_access := CASE WHEN v_consent THEN left(nullif(btrim(v_row->>'accessibility_accommodations'),''),1000) END;
  v_has_acc := v_diet IS NOT NULL OR v_allergy IS NOT NULL OR v_access IS NOT NULL;
  v_outcome := NULL; v_reason := NULL;
  IF v_ext IS NULL OR length(v_ext)>100 OR v_email IS NULL OR v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' OR v_barcode IS NULL OR length(v_barcode)<6 OR length(v_barcode)>256 OR (v_row->>'status') NOT IN ('registered','cancelled') THEN
   v_outcome := 'invalid'; v_reason := 'Missing or invalid attendee ID, email, barcode or status';
  ELSE
   v_status := (v_row->>'status')::public.event_registration_record_status;
   SELECT * INTO v_existing FROM public.event_registrations WHERE registration_source='eventbrite' AND external_registration_id=v_ext FOR UPDATE;
   IF FOUND AND v_existing.event_id<>p_event_id THEN
    v_outcome := 'conflict'; v_reason := 'Attendee ID is already linked to a different event';
   ELSE
    SELECT id INTO v_other FROM public.event_registrations WHERE event_id=p_event_id AND external_barcode=v_barcode AND (v_existing.id IS NULL OR id<>v_existing.id) LIMIT 1;
    IF v_other IS NOT NULL THEN
     v_outcome := 'conflict'; v_reason := 'Barcode already belongs to another registration for this event';
    ELSIF v_existing.id IS NULL THEN
     IF v_status='cancelled' THEN v_outcome := 'cancelled'; v_reason := 'Cancelled attendee not imported';
     ELSE
      v_outcome := 'new';
      IF NOT p_dry_run THEN
       INSERT INTO public.event_registrations(event_id,user_id,attendee_name,attendee_email,registration_source,external_registration_id,external_barcode,status,dietary_restrictions,food_allergies,accessibility_accommodations,accommodation_consent)
       VALUES (p_event_id,NULL,v_name,v_email,'eventbrite',v_ext,v_barcode,'registered',v_diet,v_allergy,v_access,v_has_acc);
      END IF;
     END IF;
    ELSE
     v_claimed := v_existing.user_id IS NOT NULL OR v_existing.claimed_at IS NOT NULL;
     -- Never blank existing values; claimed attendees' own answers take precedence over provider answers.
     IF v_claimed THEN
      n_diet := coalesce(v_existing.dietary_restrictions,v_diet); n_allergy := coalesce(v_existing.food_allergies,v_allergy); n_access := coalesce(v_existing.accessibility_accommodations,v_access);
     ELSE
      n_diet := coalesce(v_diet,v_existing.dietary_restrictions); n_allergy := coalesce(v_allergy,v_existing.food_allergies); n_access := coalesce(v_access,v_existing.accessibility_accommodations);
     END IF;
     n_consent := v_existing.accommodation_consent OR v_has_acc;
     v_acc_changed := n_diet IS DISTINCT FROM v_existing.dietary_restrictions OR n_allergy IS DISTINCT FROM v_existing.food_allergies OR n_access IS DISTINCT FROM v_existing.accessibility_accommodations OR n_consent IS DISTINCT FROM v_existing.accommodation_consent;
     IF v_claimed AND (lower(btrim(coalesce(v_existing.attendee_email,'')))<>v_email OR coalesce(v_existing.external_barcode,'')<>v_barcode) THEN
      v_outcome := 'conflict'; v_reason := 'Registration is claimed by an account; email/barcode changes need manual review';
     ELSIF v_status='cancelled' AND v_existing.status<>'cancelled' AND (v_existing.checked_in_at IS NOT NULL OR EXISTS (SELECT 1 FROM public.event_entitlements e WHERE e.registration_id=v_existing.id AND e.status<>'revoked')) THEN
      v_outcome := 'conflict'; v_reason := 'Cancellation skipped: attendee is checked in or holds issued credentials';
     ELSIF v_existing.status=v_status AND coalesce(v_existing.attendee_name,'')=v_name AND lower(btrim(coalesce(v_existing.attendee_email,'')))=v_email AND coalesce(v_existing.external_barcode,'')=v_barcode AND NOT v_acc_changed THEN
      v_outcome := 'duplicate'; v_reason := 'Already imported with identical details';
     ELSE
      v_outcome := CASE WHEN v_status='cancelled' AND v_existing.status<>'cancelled' THEN 'cancelled' ELSE 'update' END;
      IF NOT p_dry_run THEN
       IF v_claimed THEN
        UPDATE public.event_registrations SET attendee_name=v_name, status=v_status, dietary_restrictions=n_diet, food_allergies=n_allergy, accessibility_accommodations=n_access, accommodation_consent=n_consent WHERE id=v_existing.id;
       ELSE
        UPDATE public.event_registrations SET attendee_name=v_name, attendee_email=v_email, external_barcode=v_barcode, status=v_status, dietary_restrictions=n_diet, food_allergies=n_allergy, accessibility_accommodations=n_access, accommodation_consent=n_consent WHERE id=v_existing.id;
       END IF;
      END IF;
     END IF;
    END IF;
   END IF;
  END IF;
  v_existing := NULL; v_other := NULL;
  v_counts := jsonb_set(v_counts,ARRAY[v_outcome],to_jsonb((v_counts->>v_outcome)::int+1));
  IF v_outcome NOT IN ('new','update','duplicate') THEN
   v_lines := v_lines || jsonb_build_object('line',v_line,'outcome',v_outcome,'reason',v_reason);
  END IF;
 END LOOP;

 v_result := jsonb_build_object('dryRun',p_dry_run,'rows',jsonb_array_length(p_rows),'counts',v_counts,'issues',v_lines,'replayed',false);
 IF NOT p_dry_run THEN
  INSERT INTO public.event_operation_audit(event_id,actor_id,operation,request_id,result)
  VALUES (p_event_id,auth.uid(),'eventbrite_csv_import',p_request_id,jsonb_build_object('rows',jsonb_array_length(p_rows),'counts',v_counts,'file_sha256',left(coalesce(p_file_sha256,''),64)));
 END IF;
 RETURN v_result;
END; $function$;

REVOKE ALL ON FUNCTION public.import_eventbrite_registrations(uuid,uuid,jsonb,boolean,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.import_eventbrite_registrations(uuid,uuid,jsonb,boolean,text) TO authenticated;