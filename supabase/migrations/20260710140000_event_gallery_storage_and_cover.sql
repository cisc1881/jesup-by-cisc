-- Phase 9G event gallery storage and cover constraints
-- Applied: development (verified July 2026)
-- 1. Partial unique index enforcing one cover image per event
-- 2. Participant submission upload policy for event-images bucket
-- 3. Optional trigger to auto-clear other covers when setting a new cover

-- ---------------------------------------------------------------------------
-- 1. One cover per event (partial unique index)
-- ---------------------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS idx_event_gallery_one_cover_per_event
  ON public.event_gallery (event_id)
  WHERE is_cover = true;

-- ---------------------------------------------------------------------------
-- 2. Participant submission storage (authenticated users, own path only)
-- ---------------------------------------------------------------------------
CREATE POLICY "event-images participant submission insert"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'event-images'
    AND (storage.foldername(name))[1] = 'submissions'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

-- Participants may update/delete only their own submission files (pre-submit edits)
CREATE POLICY "event-images participant submission update"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'event-images'
    AND (storage.foldername(name))[1] = 'submissions'
    AND (storage.foldername(name))[2] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'event-images'
    AND (storage.foldername(name))[1] = 'submissions'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

CREATE POLICY "event-images participant submission delete"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'event-images'
    AND (storage.foldername(name))[1] = 'submissions'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

-- ---------------------------------------------------------------------------
-- 3. Database helper: set cover with transaction-safe clearing
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_event_gallery_cover(p_event_id UUID, p_gallery_id UUID)
RETURNS public.event_gallery
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result public.event_gallery;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin role required';
  END IF;

  UPDATE public.event_gallery
  SET is_cover = false
  WHERE event_id = p_event_id AND is_cover = true;

  UPDATE public.event_gallery
  SET is_cover = true, is_public_approved = true
  WHERE id = p_gallery_id AND event_id = p_event_id
  RETURNING * INTO result;

  IF result.id IS NULL THEN
    RAISE EXCEPTION 'Gallery item not found for event';
  END IF;

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.set_event_gallery_cover(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_event_gallery_cover(UUID, UUID) TO authenticated;

-- ---------------------------------------------------------------------------
-- NOTES
-- ---------------------------------------------------------------------------
-- The event-images bucket remains public-read. Participant submission URLs are
-- technically readable if guessed, but they are NOT linked from public pages
-- until approved into event_gallery with is_public_approved = true.
-- Consider making the bucket private + signed URLs in a future hardening pass.
