ALTER TABLE public.event_registrations ADD COLUMN IF NOT EXISTS claimed_at timestamptz;
ALTER TABLE public.event_registrations ADD COLUMN IF NOT EXISTS claimed_by uuid;

CREATE TABLE public.event_staff_assignments (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), event_id uuid NOT NULL REFERENCES public.events(id), user_id uuid NOT NULL,
 staff_role text NOT NULL CHECK (staff_role IN ('checkin','redemption','badge','manager')), is_active boolean NOT NULL DEFAULT true,
 created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(event_id,user_id,staff_role)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_staff_assignments TO authenticated;
GRANT ALL ON public.event_staff_assignments TO service_role;
ALTER TABLE public.event_staff_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY staff_admin ON public.event_staff_assignments FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY staff_read_self ON public.event_staff_assignments FOR SELECT TO authenticated USING (user_id=auth.uid());

CREATE FUNCTION public.can_operate_event(p_event_id uuid,p_operation text) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT auth.uid() IS NOT NULL AND (public.has_role(auth.uid(),'admin') OR EXISTS(SELECT 1 FROM public.event_staff_assignments WHERE event_id=p_event_id AND user_id=auth.uid() AND is_active AND staff_role IN (p_operation,'manager')));
$$;
REVOKE ALL ON FUNCTION public.can_operate_event(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.can_operate_event(uuid,text) TO authenticated;

CREATE TABLE public.event_products (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), event_id uuid NOT NULL REFERENCES public.events(id), name text NOT NULL,
 kind text NOT NULL CHECK(kind IN ('ticket','meal','activity','parking','sponsor_package','company_package')),
 beneficiary text NOT NULL DEFAULT 'self' CHECK(beneficiary IN ('self','guest','company')), description text,
 price_cents integer CHECK(price_cents>=0), currency text NOT NULL DEFAULT 'USD', capacity integer CHECK(capacity>=0),
 is_active boolean NOT NULL DEFAULT false, sort_order integer NOT NULL DEFAULT 0, configuration jsonb NOT NULL DEFAULT '{}',
 created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(id,event_id)
);
GRANT SELECT ON public.event_products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_products TO authenticated;
GRANT ALL ON public.event_products TO service_role;
ALTER TABLE public.event_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY products_admin ON public.event_products FOR ALL TO authenticated USING(public.has_role(auth.uid(),'admin')) WITH CHECK(public.has_role(auth.uid(),'admin'));
CREATE POLICY products_public ON public.event_products FOR SELECT TO anon,authenticated USING(is_active AND EXISTS(SELECT 1 FROM public.events WHERE id=event_id AND status='published' AND is_active));

ALTER TABLE public.event_registrations ADD CONSTRAINT fc135_registration_event_unique UNIQUE(id,event_id);
CREATE TABLE public.event_entitlements (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), event_id uuid NOT NULL REFERENCES public.events(id), registration_id uuid NOT NULL,
 product_id uuid NOT NULL, beneficiary_name text, quantity integer NOT NULL DEFAULT 1 CHECK(quantity>0),
 status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','active','revoked')),
 credential_code text NOT NULL DEFAULT encode(gen_random_bytes(24),'hex') UNIQUE,
 valid_from timestamptz, valid_until timestamptz, source text NOT NULL DEFAULT 'admin' CHECK(source IN ('admin','eventbrite','square')),
 external_reference text, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(id,event_id),
 FOREIGN KEY(registration_id,event_id) REFERENCES public.event_registrations(id,event_id),
 FOREIGN KEY(product_id,event_id) REFERENCES public.event_products(id,event_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_entitlements TO authenticated;
GRANT ALL ON public.event_entitlements TO service_role;
ALTER TABLE public.event_entitlements ENABLE ROW LEVEL SECURITY;
CREATE POLICY entitlements_admin ON public.event_entitlements FOR ALL TO authenticated USING(public.has_role(auth.uid(),'admin')) WITH CHECK(public.has_role(auth.uid(),'admin'));
CREATE POLICY entitlements_owner ON public.event_entitlements FOR SELECT TO authenticated USING(EXISTS(SELECT 1 FROM public.event_registrations WHERE id=registration_id AND user_id=auth.uid()));

CREATE TABLE public.event_entitlement_redemptions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), event_id uuid NOT NULL REFERENCES public.events(id), entitlement_id uuid NOT NULL,
 redemption_number integer NOT NULL CHECK(redemption_number>0), redeemed_by uuid NOT NULL, redeemed_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(entitlement_id,event_id) REFERENCES public.event_entitlements(id,event_id), UNIQUE(entitlement_id,redemption_number)
);
GRANT SELECT ON public.event_entitlement_redemptions TO authenticated;
GRANT ALL ON public.event_entitlement_redemptions TO service_role;
ALTER TABLE public.event_entitlement_redemptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY redemption_read ON public.event_entitlement_redemptions FOR SELECT TO authenticated USING(public.can_operate_event(event_id,'redemption') OR EXISTS(SELECT 1 FROM public.event_entitlements e JOIN public.event_registrations r ON r.id=e.registration_id WHERE e.id=entitlement_id AND r.user_id=auth.uid()));

CREATE TABLE public.event_badge_issues (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), event_id uuid NOT NULL REFERENCES public.events(id), registration_id uuid NOT NULL,
 issued_by uuid NOT NULL, issued_at timestamptz NOT NULL DEFAULT now(), status text NOT NULL DEFAULT 'issued' CHECK(status IN ('issued','revoked')),
 FOREIGN KEY(registration_id,event_id) REFERENCES public.event_registrations(id,event_id)
);
GRANT SELECT ON public.event_badge_issues TO authenticated;
GRANT ALL ON public.event_badge_issues TO service_role;
ALTER TABLE public.event_badge_issues ENABLE ROW LEVEL SECURITY;
CREATE POLICY badge_read ON public.event_badge_issues FOR SELECT TO authenticated USING(public.can_operate_event(event_id,'badge') OR EXISTS(SELECT 1 FROM public.event_registrations WHERE id=registration_id AND user_id=auth.uid()));

CREATE TABLE public.event_seller_connections (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), event_id uuid NOT NULL REFERENCES public.events(id) UNIQUE,
 provider text NOT NULL DEFAULT 'square' CHECK(provider='square'), environment text NOT NULL DEFAULT 'sandbox' CHECK(environment IN ('sandbox','production')),
 merchant_id text, location_id text, application_id text, application_fee_bps integer CHECK(application_fee_bps BETWEEN 0 AND 10000),
 application_fee_cents integer CHECK(application_fee_cents>=0), status text NOT NULL DEFAULT 'unconfigured' CHECK(status IN ('unconfigured','configured','disabled')),
 live_payments_enabled boolean NOT NULL DEFAULT false CHECK(live_payments_enabled=false), created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_seller_connections TO authenticated;
GRANT ALL ON public.event_seller_connections TO service_role;
ALTER TABLE public.event_seller_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY seller_admin ON public.event_seller_connections FOR ALL TO authenticated USING(public.has_role(auth.uid(),'admin')) WITH CHECK(public.has_role(auth.uid(),'admin'));
COMMENT ON TABLE public.event_seller_connections IS 'Configuration only. No secrets or payments. OAuth, fee approval and payment processing require a later reviewed implementation.';

CREATE FUNCTION public.claim_eventbrite_registration(p_event_id uuid) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_email text; v_id uuid;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
 SELECT lower(email) INTO v_email FROM auth.users WHERE id=auth.uid() AND email_confirmed_at IS NOT NULL;
 IF v_email IS NULL THEN RAISE EXCEPTION 'Verified email required'; END IF;
 IF EXISTS(SELECT 1 FROM public.event_registrations WHERE event_id=p_event_id AND user_id=auth.uid()) THEN RAISE EXCEPTION 'An event registration is already linked to your account'; END IF;
 IF (SELECT count(*) FROM public.event_registrations WHERE event_id=p_event_id AND registration_source='eventbrite' AND user_id IS NULL AND lower(attendee_email)=v_email AND status='registered') <> 1 THEN RAISE EXCEPTION 'No unique unclaimed ticket matches your verified email; contact the event team'; END IF;
 SELECT id INTO v_id FROM public.event_registrations WHERE event_id=p_event_id AND registration_source='eventbrite' AND user_id IS NULL AND lower(attendee_email)=v_email AND status='registered' FOR UPDATE;
 IF v_id IS NULL THEN RAISE EXCEPTION 'Ticket already claimed'; END IF;
 UPDATE public.event_registrations SET user_id=auth.uid(),claimed_by=auth.uid(),claimed_at=now() WHERE id=v_id;
 RETURN v_id;
END; $$;
REVOKE ALL ON FUNCTION public.claim_eventbrite_registration(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.claim_eventbrite_registration(uuid) TO authenticated;

CREATE FUNCTION public.redeem_event_entitlement(p_event_id uuid,p_code text) RETURNS TABLE(entitlement_id uuid,used_count integer,remaining integer) LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_e public.event_entitlements; v_used integer;
BEGIN
 IF NOT public.can_operate_event(p_event_id,'redemption') THEN RAISE EXCEPTION 'Event redemption staff required'; END IF;
 SELECT * INTO v_e FROM public.event_entitlements WHERE event_id=p_event_id AND credential_code=btrim(p_code) FOR UPDATE;
 IF NOT FOUND OR v_e.status<>'active' THEN RAISE EXCEPTION 'Credential unavailable'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.event_registrations WHERE id=v_e.registration_id AND status='registered') THEN RAISE EXCEPTION 'Registration is not active'; END IF;
 IF (v_e.valid_from IS NOT NULL AND now()<v_e.valid_from) OR (v_e.valid_until IS NOT NULL AND now()>=v_e.valid_until) THEN RAISE EXCEPTION 'Credential outside service period'; END IF;
 SELECT count(*) INTO v_used FROM public.event_entitlement_redemptions WHERE event_entitlement_redemptions.entitlement_id=v_e.id;
 IF v_used>=v_e.quantity THEN RAISE EXCEPTION 'Entitlement already used'; END IF;
 INSERT INTO public.event_entitlement_redemptions(event_id,entitlement_id,redemption_number,redeemed_by) VALUES(p_event_id,v_e.id,v_used+1,auth.uid());
 RETURN QUERY SELECT v_e.id,v_used+1,v_e.quantity-v_used-1;
END; $$;
REVOKE ALL ON FUNCTION public.redeem_event_entitlement(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.redeem_event_entitlement(uuid,text) TO authenticated;

CREATE FUNCTION public.scan_event_admission(p_event_id uuid,p_code text) RETURNS TABLE(registration_id uuid,attendee_name text,already_checked_in boolean) LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_r public.event_registrations; v_name text;
BEGIN
 IF NOT public.can_operate_event(p_event_id,'checkin') THEN RAISE EXCEPTION 'Event check-in staff required'; END IF;
 SELECT * INTO v_r FROM public.event_registrations WHERE event_id=p_event_id AND (upper(ticket_code)=upper(btrim(p_code)) OR external_barcode=btrim(p_code)) FOR UPDATE;
 IF NOT FOUND OR v_r.status<>'registered' THEN RAISE EXCEPTION 'Ticket unavailable for this event'; END IF;
 SELECT coalesce(v_r.attendee_name,p.full_name,'Attendee') INTO v_name FROM (SELECT 1) x LEFT JOIN public.profiles p ON p.id=v_r.user_id;
 IF v_r.checked_in_at IS NOT NULL THEN RETURN QUERY SELECT v_r.id,v_name,true; RETURN; END IF;
 UPDATE public.event_registrations SET checked_in_at=now() WHERE id=v_r.id;
 INSERT INTO public.event_checkins(event_id,registration_id,checked_in_by,method) VALUES(p_event_id,v_r.id,auth.uid(),'qr');
 UPDATE public.event_attendance SET status='checked_in',attendance_method='qr',checked_in_at=now(),checked_in_by=auth.uid() WHERE event_id=p_event_id AND event_attendance.registration_id=v_r.id;
 IF NOT FOUND THEN INSERT INTO public.event_attendance(event_id,registration_id,status,attendance_method,checked_in_at,checked_in_by) VALUES(p_event_id,v_r.id,'checked_in','qr',now(),auth.uid()); END IF;
 RETURN QUERY SELECT v_r.id,v_name,false;
END; $$;
REVOKE ALL ON FUNCTION public.scan_event_admission(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.scan_event_admission(uuid,text) TO authenticated;

CREATE FUNCTION public.record_event_badge_issue(p_event_id uuid,p_registration_id uuid) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_id uuid;
BEGIN
 IF NOT public.can_operate_event(p_event_id,'badge') THEN RAISE EXCEPTION 'Event badge staff required'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.event_registrations WHERE id=p_registration_id AND event_id=p_event_id AND status='registered') THEN RAISE EXCEPTION 'Active registration required'; END IF;
 INSERT INTO public.event_badge_issues(event_id,registration_id,issued_by) VALUES(p_event_id,p_registration_id,auth.uid()) RETURNING id INTO v_id;
 RETURN v_id;
END; $$;
REVOKE ALL ON FUNCTION public.record_event_badge_issue(uuid,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.record_event_badge_issue(uuid,uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.redeem_event_meal_ticket(p_meal_day_id uuid,p_ticket_code text) RETURNS TABLE(attendee_name text,event_title text,meal_label text,used_count integer,allowance integer,remaining integer) LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_day public.event_meal_days; v_r public.event_registrations; v_used integer; v_name text; v_title text;
BEGIN
 SELECT * INTO v_day FROM public.event_meal_days WHERE id=p_meal_day_id AND is_active;
 IF NOT FOUND THEN RAISE EXCEPTION 'Meal service unavailable'; END IF;
 IF NOT public.can_operate_event(v_day.event_id,'redemption') THEN RAISE EXCEPTION 'Event redemption staff required'; END IF;
 IF v_day.service_date<>(now() AT TIME ZONE coalesce((SELECT timezone FROM public.events WHERE id=v_day.event_id),'America/Chicago'))::date THEN RAISE EXCEPTION 'Meal service is not available today'; END IF;
 SELECT * INTO v_r FROM public.event_registrations WHERE event_id=v_day.event_id AND upper(ticket_code)=upper(btrim(p_ticket_code)) FOR UPDATE;
 IF NOT FOUND OR v_r.status<>'registered' THEN RAISE EXCEPTION 'Ticket unavailable for this event'; END IF;
 SELECT count(*) INTO v_used FROM public.event_meal_redemptions WHERE meal_day_id=p_meal_day_id AND registration_id=v_r.id;
 IF v_used>=v_day.allowance_per_attendee THEN RAISE EXCEPTION 'Meal allowance already used'; END IF;
 INSERT INTO public.event_meal_redemptions(meal_day_id,registration_id,redemption_number,redeemed_by) VALUES(p_meal_day_id,v_r.id,v_used+1,auth.uid());
 SELECT coalesce(v_r.attendee_name,p.full_name,'Attendee') INTO v_name FROM (SELECT 1) x LEFT JOIN public.profiles p ON p.id=v_r.user_id;
 SELECT title INTO v_title FROM public.events WHERE id=v_day.event_id;
 RETURN QUERY SELECT v_name,v_title,v_day.label,v_used+1,v_day.allowance_per_attendee,v_day.allowance_per_attendee-v_used-1;
END; $$;
REVOKE ALL ON FUNCTION public.redeem_event_meal_ticket(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.redeem_event_meal_ticket(uuid,text) TO authenticated;