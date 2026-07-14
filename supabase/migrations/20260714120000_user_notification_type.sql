-- Keep enum changes in their own transaction before functions reference them.

DO $$ BEGIN
  ALTER TYPE public.notification_type ADD VALUE 'internship_application';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
