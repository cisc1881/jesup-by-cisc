DROP POLICY products_public ON public.event_products;
CREATE POLICY products_public ON public.event_products FOR SELECT TO anon,authenticated USING(is_active AND EXISTS(SELECT 1 FROM public.events WHERE id=event_id AND status='published' AND is_active AND metadata->>'catalog_enabled'='true' AND metadata->'sections'->>'tickets'='true'));
CREATE POLICY products_issued_owner ON public.event_products FOR SELECT TO authenticated USING(EXISTS(SELECT 1 FROM public.event_entitlements e JOIN public.event_registrations r ON r.id=e.registration_id WHERE e.product_id=event_products.id AND r.user_id=auth.uid()));
CREATE FUNCTION public.guard_event_staff_account() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM auth.users WHERE id=NEW.user_id) THEN RAISE EXCEPTION 'Staff account not found'; END IF;
 RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.guard_event_staff_account() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER guard_event_staff_account BEFORE INSERT OR UPDATE ON public.event_staff_assignments FOR EACH ROW EXECUTE FUNCTION public.guard_event_staff_account();
CREATE FUNCTION public.audit_event_entitlement_change() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Revoke credentials instead of deleting audit history'; END IF;
 RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.audit_event_entitlement_change() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER preserve_event_entitlement_history BEFORE DELETE ON public.event_entitlements FOR EACH ROW EXECUTE FUNCTION public.audit_event_entitlement_change();
COMMENT ON FUNCTION public.operate_event_credential(uuid,text,text,uuid,uuid) IS 'Authorized, request-idempotent scanner entry point. Existing legacy admission and meal RPCs remain for compatibility; all require explicit event operations enablement.';