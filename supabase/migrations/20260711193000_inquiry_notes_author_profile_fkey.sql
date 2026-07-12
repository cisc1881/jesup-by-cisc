-- inquiry_notes.author_id → profiles.id (enables PostgREST profile embeds; client also fetches profiles separately)
-- Canonical identity remains auth.users; profiles.id mirrors auth user UUID for staff display.
ALTER TABLE public.inquiry_notes
  DROP CONSTRAINT IF EXISTS inquiry_notes_author_profile_fkey;

ALTER TABLE public.inquiry_notes
  DROP CONSTRAINT IF EXISTS inquiry_notes_author_id_fkey;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.inquiry_notes n
    LEFT JOIN public.profiles p ON p.id = n.author_id
    WHERE p.id IS NULL
  ) THEN
    ALTER TABLE public.inquiry_notes
      ADD CONSTRAINT inquiry_notes_author_profile_fkey
      FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  ELSE
    RAISE EXCEPTION 'Cannot add inquiry_notes_author_profile_fkey: orphan author_id rows without matching profiles';
  END IF;
END $$;
