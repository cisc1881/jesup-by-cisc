
-- Add profile FKs alongside existing auth.users FKs so PostgREST can embed profile fields.
ALTER TABLE public.event_registrations
  ADD CONSTRAINT event_registrations_user_profile_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.internship_applications
  ADD CONSTRAINT internship_applications_user_profile_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.equipment_checkouts
  ADD CONSTRAINT equipment_checkouts_user_profile_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
