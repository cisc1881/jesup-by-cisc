-- Secure native internship applications. The authenticated user is derived from
-- the session, while availability, deadline, duplicate, and capacity rules are
-- enforced in one serialized database operation.

CREATE OR REPLACE FUNCTION public.submit_internship_application(p_application jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_internship public.internships%ROWTYPE;
  v_application_id uuid;
  v_active_count bigint;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Sign in is required to apply';
  END IF;

  SELECT * INTO v_internship
  FROM public.internships
  WHERE id = (p_application->>'internship_id')::uuid
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Internship opportunity was not found';
  END IF;

  IF NOT v_internship.is_open THEN
    RAISE EXCEPTION 'Applications are closed for this opportunity';
  END IF;

  IF v_internship.deadline IS NOT NULL AND v_internship.deadline < current_date THEN
    RAISE EXCEPTION 'The application deadline has passed';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.internship_applications a
    WHERE a.internship_id = v_internship.id AND a.user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'You already applied for this opportunity';
  END IF;

  IF v_internship.max_applicants IS NOT NULL THEN
    SELECT count(*) INTO v_active_count
    FROM public.internship_applications a
    WHERE a.internship_id = v_internship.id
      AND a.status NOT IN ('rejected', 'withdrawn');

    IF v_active_count >= v_internship.max_applicants THEN
      RAISE EXCEPTION 'This opportunity has reached its application limit';
    END IF;
  END IF;

  INSERT INTO public.internship_applications (
    internship_id,
    user_id,
    status,
    cover_letter,
    resume_url,
    cohort_id,
    track,
    school_name,
    major,
    graduation_year,
    institution_id,
    institution_type,
    is_1890_land_grant,
    academic_level,
    emergency_contact,
    submitted_at
  ) VALUES (
    v_internship.id,
    v_user_id,
    'pending',
    NULLIF(btrim(p_application->>'cover_letter'), ''),
    NULLIF(btrim(p_application->>'resume_url'), ''),
    CASE WHEN v_internship.is_2fas THEN v_internship.cohort_id ELSE NULL END,
    CASE WHEN v_internship.is_2fas THEN v_internship.track ELSE NULL END,
    NULLIF(btrim(p_application->>'school_name'), ''),
    NULLIF(btrim(p_application->>'major'), ''),
    NULLIF(p_application->>'graduation_year', '')::int,
    NULLIF(p_application->>'institution_id', '')::uuid,
    NULLIF(p_application->>'institution_type', '')::public.institution_type,
    NULLIF(p_application->>'is_1890_land_grant', '')::boolean,
    NULLIF(p_application->>'academic_level', '')::public.academic_level,
    CASE
      WHEN v_internship.is_2fas
        AND jsonb_typeof(p_application->'emergency_contact') = 'object'
        THEN p_application->'emergency_contact'
      ELSE '{}'::jsonb
    END,
    now()
  )
  RETURNING id INTO v_application_id;

  RETURN v_application_id;
END;
$$;

REVOKE INSERT ON public.internship_applications FROM authenticated;
REVOKE ALL ON FUNCTION public.submit_internship_application(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_internship_application(jsonb) TO authenticated;
