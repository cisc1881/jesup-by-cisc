-- Privacy-safe attendee directory for registered participants and event administrators.
CREATE OR REPLACE FUNCTION public.list_event_attendees(p_event_id uuid)
RETURNS TABLE (
  user_id uuid,
  full_name text,
  affiliation text,
  school_name text,
  major_or_interest text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    r.user_id,
    coalesce(nullif(p.full_name, ''), nullif(r.attendee_name, ''), 'JESUP attendee') AS full_name,
    p.affiliation,
    p.school_name,
    p.major_or_interest
  FROM public.event_registrations r
  LEFT JOIN public.profiles p ON p.id = r.user_id
  WHERE r.event_id = p_event_id
    AND r.status <> 'cancelled'
    AND (
      public.has_role(auth.uid(), 'admin')
      OR EXISTS (
        SELECT 1
        FROM public.event_registrations mine
        WHERE mine.event_id = p_event_id
          AND mine.user_id = auth.uid()
          AND mine.status <> 'cancelled'
      )
    )
  ORDER BY full_name;
$$;

REVOKE ALL ON FUNCTION public.list_event_attendees(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_event_attendees(uuid) TO authenticated;
