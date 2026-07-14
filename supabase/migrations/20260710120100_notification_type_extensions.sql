-- Sprint 9 Phase 9A: notification_type enum extensions (separate transaction)
-- Must run before any trigger/function that references the new enum values.

DO $$ BEGIN
  ALTER TYPE public.notification_type ADD VALUE 'inquiry_received';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE public.notification_type ADD VALUE 'evaluation_submitted';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
