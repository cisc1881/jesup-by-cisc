CREATE OR REPLACE FUNCTION public.issue_mapped_entitlements(p_event_id uuid, p_request_id uuid, p_dry_run boolean, p_allow_unpriced boolean DEFAULT false)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE r record; v_prior jsonb; v_issue int := 0; v_skip int := 0; v_regs int := 0; v_inactive int := 0; v_unpriced int := 0; v_guest int := 0; v_result jsonb;
BEGIN
 IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Administrator required'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('mapped-issue:'||p_event_id::text,0));
 IF NOT p_dry_run THEN
  SELECT result INTO v_prior FROM public.event_operation_audit WHERE event_id=p_event_id AND request_id=p_request_id AND operation='mapped_issue';
  IF v_prior IS NOT NULL THEN RETURN v_prior || jsonb_build_object('replayed',true); END IF;
 END IF;
 SELECT count(DISTINCT er.id) INTO v_regs FROM public.event_registrations er JOIN public.event_ticket_mappings m ON m.event_id=er.event_id AND m.ticket_class=er.eventbrite_ticket_class
  WHERE er.event_id=p_event_id AND er.status='registered';
 FOR r IN SELECT er.id reg_id, m.id map_id, m.product_id, m.quantity, p.is_active, p.price_cents, p.beneficiary,
   EXISTS (SELECT 1 FROM public.event_entitlements e WHERE e.registration_id=er.id AND e.external_reference='ticket_mapping:'||m.id::text) already
  FROM public.event_registrations er
  JOIN public.event_ticket_mappings m ON m.event_id=er.event_id AND m.ticket_class=er.eventbrite_ticket_class
  JOIN public.event_products p ON p.id=m.product_id
  WHERE er.event_id=p_event_id AND er.status='registered' ORDER BY er.id FOR UPDATE OF er
 LOOP
  IF r.already THEN v_skip := v_skip+1;
  ELSIF NOT r.is_active THEN v_inactive := v_inactive+1;
  ELSIF r.beneficiary IN ('guest','company') THEN v_guest := v_guest+1;
  ELSIF r.price_cents IS NULL AND NOT p_allow_unpriced THEN v_unpriced := v_unpriced+1;
  ELSE
   v_issue := v_issue+1;
   IF NOT p_dry_run THEN
    INSERT INTO public.event_entitlements(event_id,product_id,registration_id,quantity,status,source,external_reference)
    VALUES(p_event_id,r.product_id,r.reg_id,r.quantity,'active','admin','ticket_mapping:'||r.map_id::text);
   END IF;
  END IF;
 END LOOP;
 v_result := jsonb_build_object('registrations',v_regs,'issue',v_issue,'already_issued',v_skip,'inactive_product',v_inactive,'needs_guest_name',v_guest,'needs_unpriced_approval',v_unpriced,'dry_run',p_dry_run);
 IF NOT p_dry_run THEN
  INSERT INTO public.event_operation_audit(event_id,actor_id,operation,request_id,result) VALUES(p_event_id,auth.uid(),'mapped_issue',p_request_id,v_result);
 END IF;
 RETURN v_result;
END $$;
REVOKE ALL ON FUNCTION public.issue_mapped_entitlements(uuid,uuid,boolean,boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.issue_mapped_entitlements(uuid,uuid,boolean,boolean) TO authenticated;