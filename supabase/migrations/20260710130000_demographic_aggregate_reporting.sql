-- Phase 9F: Admin-only demographic aggregate reporting RPCs
-- Additive migration. Apply manually after review.
-- Does not expose raw participant_demographics rows.

-- ============================================================
-- Helper: event-linked demographic rows
-- ============================================================

CREATE OR REPLACE FUNCTION public.event_demographic_rows(p_event_id UUID)
RETURNS SETOF public.participant_demographics
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT pd.*
  FROM public.participant_demographics pd
  WHERE pd.consent_demographics = true
    AND (
      (pd.source_type = 'registration'::public.demographic_source_type
        AND pd.source_id IN (
          SELECT er.id FROM public.event_registrations er WHERE er.event_id = p_event_id
        ))
      OR (pd.source_type = 'walk_in'::public.demographic_source_type
        AND pd.source_id IN (
          SELECT wi.id FROM public.event_walk_ins wi WHERE wi.event_id = p_event_id
        ))
      OR (pd.source_type = 'evaluation'::public.demographic_source_type
        AND pd.source_id IN (
          SELECT r.id FROM public.event_evaluation_responses r WHERE r.event_id = p_event_id
        ))
      OR (pd.source_type = 'attendance'::public.demographic_source_type
        AND pd.source_id IN (
          SELECT ea.id FROM public.event_attendance ea WHERE ea.event_id = p_event_id
        ))
    );
$$;

REVOKE ALL ON FUNCTION public.event_demographic_rows(UUID) FROM PUBLIC;

-- ============================================================
-- Anonymous evaluation demographics (no identity linkage)
-- ============================================================

CREATE OR REPLACE FUNCTION public.upsert_anonymous_evaluation_demographics(
  p_response_id UUID,
  p_access_token TEXT,
  p_age_range TEXT DEFAULT NULL,
  p_race TEXT DEFAULT NULL,
  p_ethnicity TEXT DEFAULT NULL,
  p_gender TEXT DEFAULT NULL,
  p_veteran_status TEXT DEFAULT NULL,
  p_disability_status TEXT DEFAULT NULL,
  p_farmer_producer_status TEXT DEFAULT NULL,
  p_beginning_farmer BOOLEAN DEFAULT NULL,
  p_limited_resource_producer BOOLEAN DEFAULT NULL,
  p_county TEXT DEFAULT NULL,
  p_state TEXT DEFAULT NULL,
  p_rural_urban TEXT DEFAULT NULL,
  p_institution_id UUID DEFAULT NULL,
  p_academic_level public.academic_level DEFAULT NULL,
  p_consent_demographics BOOLEAN DEFAULT false
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_response public.event_evaluation_responses%ROWTYPE;
  v_id UUID;
BEGIN
  IF p_consent_demographics IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'consent_demographics is required';
  END IF;

  IF p_access_token IS NULL OR length(trim(p_access_token)) = 0 THEN
    RAISE EXCEPTION 'access token is required';
  END IF;

  SELECT * INTO v_response
  FROM public.event_evaluation_responses r
  WHERE r.id = p_response_id
    AND r.access_token_hash = public.hash_evaluation_access_token(p_access_token);

  IF v_response.id IS NULL THEN
    RAISE EXCEPTION 'invalid response or access token';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.event_evaluations ev
    WHERE ev.id = v_response.evaluation_id
      AND ev.response_mode = 'anonymous'::public.evaluation_response_mode
      AND ev.is_active = true
  ) THEN
    RAISE EXCEPTION 'evaluation is not available for anonymous demographic submission';
  END IF;

  INSERT INTO public.participant_demographics (
    source_type,
    source_id,
    user_id,
    age_range,
    race,
    ethnicity,
    gender,
    veteran_status,
    disability_status,
    farmer_producer_status,
    beginning_farmer,
    limited_resource_producer,
    county,
    state,
    rural_urban,
    institution_id,
    academic_level,
    consent_demographics
  ) VALUES (
    'evaluation'::public.demographic_source_type,
    v_response.id,
    NULL,
    p_age_range,
    p_race,
    p_ethnicity,
    p_gender,
    p_veteran_status,
    p_disability_status,
    p_farmer_producer_status,
    p_beginning_farmer,
    p_limited_resource_producer,
    p_county,
    p_state,
    p_rural_urban,
    p_institution_id,
    p_academic_level,
    true
  )
  ON CONFLICT (source_type, source_id) DO UPDATE SET
    user_id = NULL,
    age_range = EXCLUDED.age_range,
    race = EXCLUDED.race,
    ethnicity = EXCLUDED.ethnicity,
    gender = EXCLUDED.gender,
    veteran_status = EXCLUDED.veteran_status,
    disability_status = EXCLUDED.disability_status,
    farmer_producer_status = EXCLUDED.farmer_producer_status,
    beginning_farmer = EXCLUDED.beginning_farmer,
    limited_resource_producer = EXCLUDED.limited_resource_producer,
    county = EXCLUDED.county,
    state = EXCLUDED.state,
    rural_urban = EXCLUDED.rural_urban,
    institution_id = EXCLUDED.institution_id,
    academic_level = EXCLUDED.academic_level,
    consent_demographics = EXCLUDED.consent_demographics,
    updated_at = now()
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_anonymous_evaluation_demographics(
  UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN, BOOLEAN, TEXT, TEXT, TEXT, UUID, public.academic_level, BOOLEAN
) TO anon, authenticated;

-- ============================================================
-- Aggregate reporting (admin-only)
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_event_demographic_aggregates(p_event_id UUID)
RETURNS TABLE (
  category TEXT,
  value_label TEXT,
  count BIGINT,
  suppressed BOOLEAN
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_min_cell CONSTANT INT := 5;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'admin access required';
  END IF;

  RETURN QUERY
  WITH rows AS (
    SELECT * FROM public.event_demographic_rows(p_event_id)
  ),
  buckets AS (
    SELECT 'age_range'::TEXT AS category, COALESCE(NULLIF(age_range, ''), 'Not provided') AS value_label, COUNT(*)::BIGINT AS cnt
    FROM rows GROUP BY 1, 2
    UNION ALL
    SELECT 'race', COALESCE(NULLIF(race, ''), 'Not provided'), COUNT(*)::BIGINT FROM rows GROUP BY 1, 2
    UNION ALL
    SELECT 'ethnicity', COALESCE(NULLIF(ethnicity, ''), 'Not provided'), COUNT(*)::BIGINT FROM rows GROUP BY 1, 2
    UNION ALL
    SELECT 'gender', COALESCE(NULLIF(gender, ''), 'Not provided'), COUNT(*)::BIGINT FROM rows GROUP BY 1, 2
    UNION ALL
    SELECT 'veteran_status', COALESCE(NULLIF(veteran_status, ''), 'Not provided'), COUNT(*)::BIGINT FROM rows GROUP BY 1, 2
    UNION ALL
    SELECT 'disability_status', COALESCE(NULLIF(disability_status, ''), 'Not provided'), COUNT(*)::BIGINT FROM rows GROUP BY 1, 2
    UNION ALL
    SELECT 'farmer_producer_status', COALESCE(NULLIF(farmer_producer_status, ''), 'Not provided'), COUNT(*)::BIGINT FROM rows GROUP BY 1, 2
    UNION ALL
    SELECT 'beginning_farmer',
      CASE
        WHEN beginning_farmer IS TRUE THEN 'Yes'
        WHEN beginning_farmer IS FALSE THEN 'No'
        ELSE 'Not provided'
      END,
      COUNT(*)::BIGINT
    FROM rows GROUP BY 1, 2
    UNION ALL
    SELECT 'limited_resource_producer',
      CASE
        WHEN limited_resource_producer IS TRUE THEN 'Yes'
        WHEN limited_resource_producer IS FALSE THEN 'No'
        ELSE 'Not provided'
      END,
      COUNT(*)::BIGINT
    FROM rows GROUP BY 1, 2
    UNION ALL
    SELECT 'county', COALESCE(NULLIF(county, ''), 'Not provided'), COUNT(*)::BIGINT FROM rows GROUP BY 1, 2
    UNION ALL
    SELECT 'state', COALESCE(NULLIF(state, ''), 'Not provided'), COUNT(*)::BIGINT FROM rows GROUP BY 1, 2
    UNION ALL
    SELECT 'rural_urban', COALESCE(NULLIF(rural_urban, ''), 'Not provided'), COUNT(*)::BIGINT FROM rows GROUP BY 1, 2
    UNION ALL
    SELECT 'academic_level', COALESCE(NULLIF(academic_level::TEXT, ''), 'Not provided'), COUNT(*)::BIGINT FROM rows GROUP BY 1, 2
    UNION ALL
    SELECT 'institution_type',
      COALESCE(NULLIF(i.institution_type::TEXT, ''), 'Not provided'),
      COUNT(*)::BIGINT
    FROM rows r
    LEFT JOIN public.institutions i ON i.id = r.institution_id
    GROUP BY 1, 2
  )
  SELECT
    b.category,
    b.value_label,
    CASE WHEN b.cnt < v_min_cell THEN NULL ELSE b.cnt END AS count,
    (b.cnt < v_min_cell) AS suppressed
  FROM buckets b
  WHERE b.value_label IS NOT NULL
  ORDER BY b.category, b.value_label;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_event_demographic_aggregates(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_multi_event_demographic_aggregates(p_event_ids UUID[])
RETURNS TABLE (
  category TEXT,
  value_label TEXT,
  count BIGINT,
  suppressed BOOLEAN
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event_id UUID;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'admin access required';
  END IF;

  IF p_event_ids IS NULL OR array_length(p_event_ids, 1) IS NULL THEN
    RETURN;
  END IF;

  CREATE TEMP TABLE IF NOT EXISTS tmp_demo_agg (
    category TEXT,
    value_label TEXT,
    count BIGINT,
    suppressed BOOLEAN
  ) ON COMMIT DROP;

  TRUNCATE tmp_demo_agg;

  FOREACH v_event_id IN ARRAY p_event_ids
  LOOP
    INSERT INTO tmp_demo_agg (category, value_label, count, suppressed)
    SELECT a.category, a.value_label, a.count, a.suppressed
    FROM public.get_event_demographic_aggregates(v_event_id) a;
  END LOOP;

  RETURN QUERY
  SELECT
    t.category,
    t.value_label,
    CASE WHEN SUM(COALESCE(t.count, 0)) < 5 THEN NULL ELSE SUM(COALESCE(t.count, 0)) END AS count,
    (SUM(COALESCE(t.count, 0)) < 5) AS suppressed
  FROM tmp_demo_agg t
  GROUP BY t.category, t.value_label
  ORDER BY t.category, t.value_label;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_multi_event_demographic_aggregates(UUID[]) TO authenticated;
