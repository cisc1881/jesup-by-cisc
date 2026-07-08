
-- Lock down SECURITY DEFINER helpers
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- Storage policies for `resumes` (private)
CREATE POLICY "resumes user read own" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'resumes' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(),'admin')));
CREATE POLICY "resumes user upload own" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "resumes user delete own" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'resumes' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(),'admin')));

-- Storage policies for `publications` (private bucket, but anyone can read)
CREATE POLICY "publications public read" ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'publications');
CREATE POLICY "publications admin write" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'publications' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "publications admin update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'publications' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "publications admin delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'publications' AND public.has_role(auth.uid(),'admin'));
