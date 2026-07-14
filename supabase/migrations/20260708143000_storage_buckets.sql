-- Create JESUP storage buckets (policies for publications + resumes exist in 20260708002127).

INSERT INTO storage.buckets (id, name, public)
VALUES
  ('publications', 'publications', true),
  ('market-images', 'market-images', true),
  ('event-images', 'event-images', true),
  ('equipment-images', 'equipment-images', true),
  ('partner-logos', 'partner-logos', true),
  ('podcast-images', 'podcast-images', true),
  ('resumes', 'resumes', false)
ON CONFLICT (id) DO UPDATE
  SET public = EXCLUDED.public,
      name = EXCLUDED.name;

-- Public image buckets: anyone can read; only admins can write.

CREATE POLICY "market-images public read" ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'market-images');
CREATE POLICY "market-images admin insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'market-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "market-images admin update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'market-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "market-images admin delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'market-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "event-images public read" ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'event-images');
CREATE POLICY "event-images admin insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'event-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "event-images admin update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'event-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "event-images admin delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'event-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "equipment-images public read" ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'equipment-images');
CREATE POLICY "equipment-images admin insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'equipment-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "equipment-images admin update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'equipment-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "equipment-images admin delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'equipment-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "partner-logos public read" ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'partner-logos');
CREATE POLICY "partner-logos admin insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'partner-logos' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "partner-logos admin update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'partner-logos' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "partner-logos admin delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'partner-logos' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "podcast-images public read" ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'podcast-images');
CREATE POLICY "podcast-images admin insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'podcast-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "podcast-images admin update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'podcast-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "podcast-images admin delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'podcast-images' AND public.has_role(auth.uid(), 'admin'));

-- Resumes: allow users to replace their own files (upload upsert support).
CREATE POLICY "resumes user update own" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);
