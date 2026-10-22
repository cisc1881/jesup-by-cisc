CREATE TABLE public.event_operation_audit (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), event_id uuid NOT NULL REFERENCES public.events(id), actor_id uuid NOT NULL,
 operation text NOT NULL, request_id uuid NOT NULL, registration_id uuid, entitlement_id uuid,
 result jsonb NOT NULL DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(event_id,request_id)
);
GRANT SELECT ON public.event_operation_audit TO authenticated;
GRANT ALL ON public.event_operation_audit TO service_role;
ALTER TABLE public.event_operation_audit ENABLE ROW LEVEL SECURITY;
CREATE POLICY operation_audit_admin ON public.event_operation_audit FOR SELECT TO authenticated USING(public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.can_operate_event(p_event_id uuid,p_operation text) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT auth.uid() IS NOT NULL AND p_operation IN ('checkin','redemption','badge','manager')
 AND EXISTS(SELECT 1 FROM public.events WHERE id=p_event_id AND is_active AND metadata->>'staff_operations_enabled'='true')
 AND (public.has_role(auth.uid(),'admin') OR EXISTS(SELECT 1 FROM public.event_staff_assignments WHERE event_id=p_event_id AND user_id=auth.uid() AND is_active AND staff_role IN (p_operation,'manager')));
$$;
REVOKE ALL ON FUNCTION public.can_operate_event(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.can_operate_event(uuid,text) TO authenticated;

REVOKE ALL ON FUNCTION public.claim_eventbrite_registration(uuid) FROM PUBLIC,anon,authenticated;
COMMENT ON FUNCTION public.claim_eventbrite_registration(uuid) IS 'DEPRECATED: replaced by verified email plus one-time barcode claim overload.';
CREATE FUNCTION public.claim_eventbrite_registration(p_event_id uuid,p_credential text) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_email text; v_r public.event_registrations; v_id uuid;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.events WHERE id=p_event_id AND is_active AND status='published' AND metadata->>'eventbrite_claim_enabled'='true') THEN RAISE EXCEPTION 'Ticket claiming is not enabled'; END IF;
 SELECT lower(btrim(email)) INTO v_email FROM auth.users WHERE id=auth.uid() AND email_confirmed_at IS NOT NULL;
 IF v_email IS NULL THEN RAISE EXCEPTION 'Verified email required'; END IF;
 IF length(btrim(p_credential))<6 OR length(p_credential)>256 THEN RAISE EXCEPTION 'Credential could not be claimed'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(p_event_id::text||auth.uid()::text,0));
 IF EXISTS(SELECT 1 FROM public.event_registrations WHERE event_id=p_event_id AND user_id=auth.uid()) THEN RAISE EXCEPTION 'An event registration is already linked to your account'; END IF;
 IF (SELECT count(*) FROM public.event_registrations WHERE event_id=p_event_id AND registration_source='eventbrite' AND lower(btrim(attendee_email))=v_email AND external_barcode=btrim(p_credential) AND status='registered' AND user_id IS NULL AND claimed_at IS NULL AND claimed_by IS NULL)<>1 THEN RAISE EXCEPTION 'Credential could not be claimed'; END IF;
 SELECT * INTO v_r FROM public.event_registrations WHERE event_id=p_event_id AND registration_source='eventbrite' AND lower(btrim(attendee_email))=v_email AND external_barcode=btrim(p_credential) AND status='registered' AND user_id IS NULL AND claimed_at IS NULL AND claimed_by IS NULL FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Credential could not be claimed'; END IF;
 UPDATE public.event_registrations SET user_id=auth.uid(),claimed_by=auth.uid(),claimed_at=now() WHERE id=v_r.id RETURNING id INTO v_id;
 INSERT INTO public.event_operation_audit(event_id,actor_id,operation,request_id,registration_id) VALUES(p_event_id,auth.uid(),'claim',gen_random_uuid(),v_id);
 RETURN v_id;
END; $$;
REVOKE ALL ON FUNCTION public.claim_eventbrite_registration(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.claim_eventbrite_registration(uuid,text) TO authenticated;

CREATE FUNCTION public.guard_event_registration_identity() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF auth.role()='service_role' OR public.has_role(auth.uid(),'admin') THEN RETURN NEW; END IF;
 IF TG_OP='INSERT' AND (NEW.registration_source<>'jesup' OR NEW.external_registration_id IS NOT NULL OR NEW.external_barcode IS NOT NULL OR NEW.claimed_at IS NOT NULL OR NEW.claimed_by IS NOT NULL OR NEW.checked_in_at IS NOT NULL) THEN RAISE EXCEPTION 'Imported credentials require administrator import'; END IF;
 RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.guard_event_registration_identity() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER guard_event_registration_identity BEFORE INSERT ON public.event_registrations FOR EACH ROW EXECUTE FUNCTION public.guard_event_registration_identity();

CREATE FUNCTION public.guard_event_entitlement() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_p public.event_products; v_total bigint;
BEGIN
 IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Administrator issuance required'; END IF;
 SELECT * INTO v_p FROM public.event_products WHERE id=NEW.product_id AND event_id=NEW.event_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Product not found in event'; END IF;
 IF NEW.source<>'admin' THEN RAISE EXCEPTION 'Checkout and automated issuance are disabled'; END IF;
 IF NEW.valid_from IS NOT NULL AND NEW.valid_until IS NOT NULL AND NEW.valid_until<=NEW.valid_from THEN RAISE EXCEPTION 'Invalid credential validity period'; END IF;
 IF NEW.status='active' THEN
  IF NOT v_p.is_active THEN RAISE EXCEPTION 'Activate the product before issuing credentials'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.event_registrations WHERE id=NEW.registration_id AND event_id=NEW.event_id AND status='registered') THEN RAISE EXCEPTION 'Active event registration required'; END IF;
  IF v_p.beneficiary IN ('guest','company') AND nullif(btrim(NEW.beneficiary_name),'') IS NULL THEN RAISE EXCEPTION 'Guest or company name required'; END IF;
  SELECT coalesce(sum(quantity),0) INTO v_total FROM public.event_entitlements WHERE product_id=NEW.product_id AND status='active' AND id<>NEW.id;
  IF v_p.capacity IS NOT NULL AND v_total+NEW.quantity>v_p.capacity THEN RAISE EXCEPTION 'Product capacity exceeded'; END IF;
 END IF;
 IF TG_OP='UPDATE' AND (NEW.registration_id<>OLD.registration_id OR NEW.event_id<>OLD.event_id OR NEW.product_id<>OLD.product_id OR NEW.credential_code<>OLD.credential_code OR NEW.quantity<>OLD.quantity) THEN RAISE EXCEPTION 'Issued credential identity cannot be changed'; END IF;
 RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.guard_event_entitlement() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER guard_event_entitlement BEFORE INSERT OR UPDATE ON public.event_entitlements FOR EACH ROW EXECUTE FUNCTION public.guard_event_entitlement();
REVOKE INSERT,UPDATE,DELETE ON public.event_entitlements FROM authenticated;
CREATE FUNCTION public.issue_event_entitlement(p_event_id uuid,p_product_id uuid,p_registration_id uuid,p_quantity integer,p_beneficiary_name text,p_request_id uuid,p_allow_unpriced boolean DEFAULT false) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_id uuid; v_existing public.event_operation_audit; v_price integer;
BEGIN
 IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Administrator issuance required'; END IF;
 IF p_quantity<1 OR p_quantity>1000 THEN RAISE EXCEPTION 'Quantity must be between 1 and 1000'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(p_event_id::text||p_request_id::text,0));
 SELECT * INTO v_existing FROM public.event_operation_audit WHERE event_id=p_event_id AND request_id=p_request_id;
 IF FOUND THEN
  IF v_existing.actor_id<>auth.uid() OR v_existing.operation<>'issue' THEN RAISE EXCEPTION 'Request already used'; END IF;
  RETURN v_existing.entitlement_id;
 END IF;
 SELECT price_cents INTO v_price FROM public.event_products WHERE id=p_product_id AND event_id=p_event_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Product not found'; END IF;
 IF v_price IS NULL AND NOT p_allow_unpriced THEN RAISE EXCEPTION 'Explicit administrator approval required for unpriced issuance'; END IF;
 INSERT INTO public.event_entitlements(event_id,product_id,registration_id,quantity,beneficiary_name,status,source) VALUES(p_event_id,p_product_id,p_registration_id,p_quantity,nullif(btrim(p_beneficiary_name),''),'active','admin') RETURNING id INTO v_id;
 INSERT INTO public.event_operation_audit(event_id,actor_id,operation,request_id,registration_id,entitlement_id,result) VALUES(p_event_id,auth.uid(),'issue',p_request_id,p_registration_id,v_id,jsonb_build_object('unpriced_approved',v_price IS NULL));
 RETURN v_id;
END; $$;
REVOKE ALL ON FUNCTION public.issue_event_entitlement(uuid,uuid,uuid,integer,text,uuid,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.issue_event_entitlement(uuid,uuid,uuid,integer,text,uuid,boolean) TO authenticated;
CREATE FUNCTION public.revoke_event_entitlement(p_id uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_e public.event_entitlements;
BEGIN
 IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Administrator required'; END IF;
 UPDATE public.event_entitlements SET status='revoked' WHERE id=p_id RETURNING * INTO v_e;
 IF NOT FOUND THEN RAISE EXCEPTION 'Credential not found'; END IF;
 INSERT INTO public.event_operation_audit(event_id,actor_id,operation,request_id,registration_id,entitlement_id) VALUES(v_e.event_id,auth.uid(),'revoke',gen_random_uuid(),v_e.registration_id,v_e.id);
END; $$;
REVOKE ALL ON FUNCTION public.revoke_event_entitlement(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.revoke_event_entitlement(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.record_event_badge_issue(uuid,uuid) FROM PUBLIC,anon,authenticated;
CREATE FUNCTION public.operate_event_credential(p_event_id uuid,p_operation text,p_code text,p_request_id uuid,p_meal_day_id uuid DEFAULT NULL) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_a public.event_operation_audit; v_r public.event_registrations; v_result jsonb; v_row record; v_badge uuid; v_ent uuid;
BEGIN
 IF p_operation NOT IN ('checkin','redemption','badge','meal') OR NOT public.can_operate_event(p_event_id,CASE WHEN p_operation='meal' THEN 'redemption' ELSE p_operation END) THEN RAISE EXCEPTION 'Event staff permission required'; END IF;
 IF length(btrim(p_code))<6 OR length(p_code)>256 THEN RAISE EXCEPTION 'Credential unavailable'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(p_event_id::text||p_request_id::text,0));
 SELECT * INTO v_a FROM public.event_operation_audit WHERE event_id=p_event_id AND request_id=p_request_id;
 IF FOUND THEN
  IF v_a.actor_id<>auth.uid() OR v_a.operation<>p_operation THEN RAISE EXCEPTION 'Request already used'; END IF;
  RETURN v_a.result;
 END IF;
 IF p_operation='redemption' THEN
  SELECT * INTO v_row FROM public.redeem_event_entitlement(p_event_id,p_code);
  v_ent:=v_row.entitlement_id;
  v_result:=jsonb_build_object('entitlement_id',v_ent,'used_count',v_row.used_count,'remaining',v_row.remaining);
 ELSIF p_operation='meal' THEN
  IF NOT EXISTS(SELECT 1 FROM public.event_meal_days WHERE id=p_meal_day_id AND event_id=p_event_id) THEN RAISE EXCEPTION 'Meal service unavailable'; END IF;
  SELECT * INTO v_row FROM public.redeem_event_meal_ticket(p_meal_day_id,p_code);
  v_result:=to_jsonb(v_row);
 ELSIF p_operation='checkin' THEN
  IF (SELECT count(*) FROM public.event_registrations WHERE event_id=p_event_id AND (upper(ticket_code)=upper(btrim(p_code)) OR external_barcode=btrim(p_code)))<>1 THEN RAISE EXCEPTION 'Credential unavailable'; END IF;
  SELECT * INTO v_row FROM public.scan_event_admission(p_event_id,p_code);
  v_result:=to_jsonb(v_row);
  SELECT * INTO v_r FROM public.event_registrations WHERE id=v_row.registration_id;
 ELSE
  IF (SELECT count(*) FROM public.event_registrations WHERE event_id=p_event_id AND (upper(ticket_code)=upper(btrim(p_code)) OR external_barcode=btrim(p_code)))<>1 THEN RAISE EXCEPTION 'Credential unavailable'; END IF;
  SELECT * INTO v_r FROM public.event_registrations WHERE event_id=p_event_id AND (upper(ticket_code)=upper(btrim(p_code)) OR external_barcode=btrim(p_code)) FOR UPDATE;
  IF NOT FOUND OR v_r.status<>'registered' THEN RAISE EXCEPTION 'Active registration required'; END IF;
  IF EXISTS(SELECT 1 FROM public.event_badge_issues WHERE registration_id=v_r.id AND status='issued') THEN RAISE EXCEPTION 'Badge already issued; administrator must revoke it before reissue'; END IF;
  v_badge:=public.record_event_badge_issue(p_event_id,v_r.id);
  v_result:=jsonb_build_object('badge_id',v_badge,'attendee_name',coalesce(v_r.attendee_name,(SELECT full_name FROM public.profiles WHERE id=v_r.user_id),'Attendee'),'ticket_code',v_r.ticket_code);
 END IF;
 INSERT INTO public.event_operation_audit(event_id,actor_id,operation,request_id,registration_id,entitlement_id,result) VALUES(p_event_id,auth.uid(),p_operation,p_request_id,v_r.id,v_ent,v_result);
 RETURN v_result;
END; $$;
REVOKE ALL ON FUNCTION public.operate_event_credential(uuid,text,text,uuid,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.operate_event_credential(uuid,text,text,uuid,uuid) TO authenticated;
COMMENT ON TABLE public.event_operation_audit IS 'Credential issuance, claims and staff operation audit. Request IDs prevent retry double-spend. No payment processing.';