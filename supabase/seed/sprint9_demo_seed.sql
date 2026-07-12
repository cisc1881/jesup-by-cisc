-- Sprint 9 demo seed (idempotent) — safe to re-run on dev/staging
-- Does not delete or overwrite unrelated production-like rows.
-- See docs/DEMO_SEED_DATA.md

-- Fixed demo event: BTW Summit
DO $$
DECLARE
  v_event_id UUID := 'b0cdd829-90ca-4b02-aa7d-03282454a0c5';
  v_eval_id UUID;
  v_internship_id UUID;
BEGIN
  -- Ensure BTW Summit is published with open registration
  UPDATE public.events
  SET
    status = 'published',
    is_active = true,
    registration_status = 'open',
    registration_open = true,
    updated_at = now()
  WHERE id = v_event_id;

  -- Native evaluation: active, open window, native form
  INSERT INTO public.event_evaluations (
    event_id,
    title,
    use_native_form,
    is_active,
    response_mode,
    opens_at,
    closes_at
  ) VALUES (
    v_event_id,
    'BTW Summit post-event evaluation',
    true,
    true,
    'identified',
    now() - interval '1 day',
    now() + interval '90 days'
  )
  ON CONFLICT (event_id) DO UPDATE SET
    use_native_form = true,
    is_active = true,
    response_mode = 'identified',
    opens_at = COALESCE(public.event_evaluations.opens_at, now() - interval '1 day'),
    closes_at = GREATEST(COALESCE(public.event_evaluations.closes_at, now() + interval '90 days'), now() + interval '30 days'),
    updated_at = now()
  RETURNING id INTO v_eval_id;

  IF v_eval_id IS NULL THEN
    SELECT id INTO v_eval_id FROM public.event_evaluations WHERE event_id = v_event_id;
  END IF;

  -- Default evaluation questions (skip if any default already exists)
  IF v_eval_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.event_evaluation_questions q
    WHERE q.evaluation_id = v_eval_id AND q.is_default = true
  ) THEN
    INSERT INTO public.event_evaluation_questions (
      evaluation_id, sort_order, question_type, prompt, help_text, is_required, is_default
    ) VALUES
      (v_eval_id, 0, 'rating', 'Overall satisfaction', 'How satisfied were you with this event?', true, true),
      (v_eval_id, 1, 'long_text', 'What did you find most valuable?', NULL, false, true),
      (v_eval_id, 2, 'yes_no', 'Would you recommend this event to others?', NULL, false, true),
      (v_eval_id, 3, 'consent', 'Permission for follow-up', 'May we contact you about future programs?', false, true);
  END IF;

  -- Public open 2FAS internship (slug-stable upsert)
  INSERT INTO public.internships (
    title,
    description,
    department,
    deadline,
    is_open,
    is_2fas,
    slug
  ) VALUES (
    '2FAS Undergraduate Internship (Demo)',
    'Summer research internship for students at 1890 land-grant institutions. Demo seed for Sprint 9.',
    'Carver Integrative Sustainability Center',
    (CURRENT_DATE + interval '120 days')::date,
    true,
    true,
    'demo-2fas-undergraduate-internship'
  )
  ON CONFLICT (slug) DO UPDATE SET
    is_open = true,
    is_2fas = true,
    deadline = GREATEST(public.internships.deadline, (CURRENT_DATE + interval '60 days')::date),
    updated_at = now()
  RETURNING id INTO v_internship_id;

  -- Backfill attendance rows for existing registrations on demo event
  INSERT INTO public.event_attendance (
    event_id,
    registration_id,
    status,
    attendance_method,
    checked_in_at,
    created_at,
    updated_at
  )
  SELECT
    er.event_id,
    er.id,
    CASE
      WHEN er.status = 'cancelled' THEN 'cancelled'::public.attendance_status
      WHEN er.checked_in_at IS NOT NULL THEN 'checked_in'::public.attendance_status
      ELSE 'registered'::public.attendance_status
    END,
    CASE WHEN er.checked_in_at IS NOT NULL THEN 'manual'::public.attendance_method ELSE NULL END,
    er.checked_in_at,
    er.created_at,
    COALESCE(er.updated_at, er.created_at)
  FROM public.event_registrations er
  WHERE er.event_id = v_event_id
    AND NOT EXISTS (
      SELECT 1 FROM public.event_attendance ea WHERE ea.registration_id = er.id
    );
END $$;
