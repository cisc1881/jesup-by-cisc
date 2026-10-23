ALTER TABLE public.event_registrations ADD COLUMN IF NOT EXISTS eventbrite_ticket_class text;

CREATE TABLE public.event_ticket_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  ticket_class text NOT NULL CHECK (length(btrim(ticket_class)) BETWEEN 1 AND 200),
  product_id uuid NOT NULL REFERENCES public.event_products(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity BETWEEN 1 AND 20),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, ticket_class, product_id)
);
GRANT SELECT ON public.event_ticket_mappings TO authenticated;
GRANT ALL ON public.event_ticket_mappings TO service_role;
ALTER TABLE public.event_ticket_mappings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins and event staff read ticket mappings" ON public.event_ticket_mappings FOR SELECT TO authenticated
 USING (public.has_role(auth.uid(),'admin') OR EXISTS (SELECT 1 FROM public.event_staff_assignments s WHERE s.event_id=event_ticket_mappings.event_id AND s.user_id=auth.uid() AND s.is_active));

-- Admin-only: record ticket class for already-imported Eventbrite rows (matched by event + attendee ID). Changes nothing else.
CREATE OR REPLACE FUNCTION public.set_eventbrite_ticket_classes(p_event_id uuid, p_rows jsonb)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_row jsonb; v_n int := 0; v_c int;
BEGIN
 IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Administrator required'; END IF;
 IF jsonb_typeof(p_rows)<>'array' OR jsonb_array_length(p_rows)>5000 THEN RAISE EXCEPTION 'At most 5000 rows'; END IF;
 FOR v_row IN SELECT * FROM jsonb_array_elements(p_rows) LOOP
  UPDATE public.event_registrations SET eventbrite_ticket_class=left(nullif(btrim(v_row->>'ticket_class'),''),200)
   WHERE event_id=p_event_id AND registration_source='eventbrite' AND external_registration_id=btrim(v_row->>'external_id')
     AND nullif(btrim(v_row->>'ticket_class'),'') IS NOT NULL
     AND eventbrite_ticket_class IS DISTINCT FROM left(btrim(v_row->>'ticket_class'),200);
  GET DIAGNOSTICS v_c = ROW_COUNT; v_n := v_n + v_c;
 END LOOP;
 RETURN v_n;
END $$;

CREATE OR REPLACE FUNCTION public.save_event_ticket_mapping(p_event_id uuid, p_ticket_class text, p_product_id uuid, p_quantity integer, p_remove boolean DEFAULT false)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
 IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Administrator required'; END IF;
 IF NOT EXISTS (SELECT 1 FROM public.event_products WHERE id=p_product_id AND event_id=p_event_id) THEN RAISE EXCEPTION 'Product not found for this event'; END IF;
 IF p_remove THEN DELETE FROM public.event_ticket_mappings WHERE event_id=p_event_id AND ticket_class=btrim(p_ticket_class) AND product_id=p_product_id; RETURN; END IF;
 INSERT INTO public.event_ticket_mappings(event_id,ticket_class,product_id,quantity) VALUES(p_event_id,btrim(p_ticket_class),p_product_id,p_quantity)
 ON CONFLICT (event_id,ticket_class,product_id) DO UPDATE SET quantity=excluded.quantity;
END $$;

-- Admin-only dry-run/commit issuance from mappings. Counts only; idempotent; inactive products refused; unpriced requires approval.
CREATE OR REPLACE FUNCTION public.issue_mapped_entitlements(p_event_id uuid, p_request_id uuid, p_dry_run boolean, p_allow_unpriced boolean DEFAULT false)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE r record; v_prior jsonb; v_issue int := 0; v_skip int := 0; v_regs int := 0; v_inactive int := 0; v_unpriced int := 0; v_result jsonb;
BEGIN
 IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Administrator required'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('mapped-issue:'||p_event_id::text,0));
 IF NOT p_dry_run THEN
  SELECT result INTO v_prior FROM public.event_operation_audit WHERE event_id=p_event_id AND request_id=p_request_id AND operation='mapped_issue';
  IF v_prior IS NOT NULL THEN RETURN v_prior || jsonb_build_object('replayed',true); END IF;
 END IF;
 SELECT count(DISTINCT er.id) INTO v_regs FROM public.event_registrations er JOIN public.event_ticket_mappings m ON m.event_id=er.event_id AND m.ticket_class=er.eventbrite_ticket_class
  WHERE er.event_id=p_event_id AND er.status='registered';
 FOR r IN SELECT er.id reg_id, m.product_id, m.quantity, p.is_active, p.price_cents,
   EXISTS (SELECT 1 FROM public.event_entitlements e WHERE e.registration_id=er.id AND e.product_id=m.product_id AND e.source='eventbrite_mapping') already
  FROM public.event_registrations er
  JOIN public.event_ticket_mappings m ON m.event_id=er.event_id AND m.ticket_class=er.eventbrite_ticket_class
  JOIN public.event_products p ON p.id=m.product_id
  WHERE er.event_id=p_event_id AND er.status='registered' FOR UPDATE OF er
 LOOP
  IF r.already THEN v_skip := v_skip+1;
  ELSIF NOT r.is_active THEN v_inactive := v_inactive+1;
  ELSIF r.price_cents IS NULL AND NOT p_allow_unpriced THEN v_unpriced := v_unpriced+1;
  ELSE
   v_issue := v_issue+1;
   IF NOT p_dry_run THEN
    INSERT INTO public.event_entitlements(event_id,product_id,registration_id,quantity,status,source) VALUES(p_event_id,r.product_id,r.reg_id,r.quantity,'active','eventbrite_mapping');
   END IF;
  END IF;
 END LOOP;
 v_result := jsonb_build_object('registrations',v_regs,'issue',v_issue,'already_issued',v_skip,'inactive_product',v_inactive,'needs_unpriced_approval',v_unpriced,'dry_run',p_dry_run);
 IF NOT p_dry_run THEN
  INSERT INTO public.event_operation_audit(event_id,actor_id,operation,request_id,result) VALUES(p_event_id,auth.uid(),'mapped_issue',p_request_id,v_result);
 END IF;
 RETURN v_result;
END $$;

REVOKE ALL ON FUNCTION public.set_eventbrite_ticket_classes(uuid,jsonb) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.save_event_ticket_mapping(uuid,text,uuid,integer,boolean) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.issue_mapped_entitlements(uuid,uuid,boolean,boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_eventbrite_ticket_classes(uuid,jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.save_event_ticket_mapping(uuid,text,uuid,integer,boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.issue_mapped_entitlements(uuid,uuid,boolean,boolean) TO authenticated;