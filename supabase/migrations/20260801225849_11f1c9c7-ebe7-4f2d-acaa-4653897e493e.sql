-- Internal role helper: used inside RLS policies (runs as owner), never needs client access
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;

-- Sign-in-only RPCs: remove anonymous execute
REVOKE EXECUTE ON FUNCTION public.register_for_event(uuid, text, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.save_registration_accommodations(uuid, text, text, text, boolean) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.list_event_chat(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.post_event_chat(uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.redeem_event_meal_ticket(uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_my_funder_dashboard() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.set_funder_grant_access(uuid, uuid, boolean) FROM PUBLIC, anon;

-- Re-affirm intended access for signed-in users
GRANT EXECUTE ON FUNCTION public.register_for_event(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.save_registration_accommodations(uuid, text, text, text, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_event_chat(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.post_event_chat(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_event_meal_ticket(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_funder_dashboard() TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_funder_grant_access(uuid, uuid, boolean) TO authenticated;