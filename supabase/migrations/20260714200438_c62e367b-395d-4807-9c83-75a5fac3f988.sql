
-- Revoke EXECUTE from anon/authenticated/PUBLIC on internal SECURITY DEFINER functions
-- Trigger functions
REVOKE ALL ON FUNCTION public.tg_set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.trg_event_evaluation_response_privacy() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.trg_validate_event_attendance_event() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.trg_inquiries_public_insert_guard() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.trg_notify_inquiry_received() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.trg_notify_twofas_application() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.generate_event_ticket_code() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.trg_notify_equipment_request() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.enforce_event_capacity() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.trg_notify_publication_added() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.trg_notify_grant_deadline() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.enforce_equipment_availability() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.trg_notify_event_registration() FROM PUBLIC, anon, authenticated;

-- Internal helper SECURITY DEFINER functions (not intended for direct RPC calls)
REVOKE ALL ON FUNCTION public.create_admin_notification(public.notification_type, text, text, text, public.notification_priority, text, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.event_demographic_rows(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_event_gallery_cover(uuid, uuid) FROM PUBLIC, anon, authenticated;

-- hash_evaluation_access_token is IMMUTABLE helper, not SECURITY DEFINER, but revoke direct RPC exposure anyway
REVOKE ALL ON FUNCTION public.hash_evaluation_access_token(text) FROM PUBLIC, anon, authenticated;

-- Ensure service_role retains full access
GRANT ALL ON FUNCTION public.tg_set_updated_at() TO service_role;
GRANT ALL ON FUNCTION public.handle_new_user() TO service_role;
GRANT ALL ON FUNCTION public.trg_event_evaluation_response_privacy() TO service_role;
GRANT ALL ON FUNCTION public.trg_validate_event_attendance_event() TO service_role;
GRANT ALL ON FUNCTION public.trg_inquiries_public_insert_guard() TO service_role;
GRANT ALL ON FUNCTION public.trg_notify_inquiry_received() TO service_role;
GRANT ALL ON FUNCTION public.trg_notify_twofas_application() TO service_role;
GRANT ALL ON FUNCTION public.generate_event_ticket_code() TO service_role;
GRANT ALL ON FUNCTION public.trg_notify_equipment_request() TO service_role;
GRANT ALL ON FUNCTION public.enforce_event_capacity() TO service_role;
GRANT ALL ON FUNCTION public.trg_notify_publication_added() TO service_role;
GRANT ALL ON FUNCTION public.trg_notify_grant_deadline() TO service_role;
GRANT ALL ON FUNCTION public.enforce_equipment_availability() TO service_role;
GRANT ALL ON FUNCTION public.trg_notify_event_registration() TO service_role;
GRANT ALL ON FUNCTION public.create_admin_notification(public.notification_type, text, text, text, public.notification_priority, text, uuid) TO service_role;
GRANT ALL ON FUNCTION public.event_demographic_rows(uuid) TO service_role;
GRANT ALL ON FUNCTION public.set_event_gallery_cover(uuid, uuid) TO service_role;
GRANT ALL ON FUNCTION public.hash_evaluation_access_token(text) TO service_role;
