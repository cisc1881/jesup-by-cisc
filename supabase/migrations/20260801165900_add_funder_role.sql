-- Add the restricted funder role in its own transaction before policies and
-- functions reference the new enum value.
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'funder';
