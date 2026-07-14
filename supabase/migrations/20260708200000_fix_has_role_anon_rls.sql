-- Fix: anon RLS policies call has_role(), but execute was revoked from anon in an earlier migration.
-- Without this grant, public SELECT on programs/publications (and related tables) returns 401.

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon;
