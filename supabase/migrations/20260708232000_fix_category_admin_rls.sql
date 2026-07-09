-- Fix admin category creation: RLS policies call has_role(), which requires EXECUTE
-- for the authenticated role. Also expose SECURITY DEFINER helpers for reliable inserts.

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.create_program_category(p_name text)
RETURNS public.program_categories
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_name text := trim(p_name);
  v_slug text;
  v_row public.program_categories;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Admin access required' USING ERRCODE = '42501';
  END IF;

  IF v_name = '' THEN
    RAISE EXCEPTION 'Category name is required' USING ERRCODE = '22023';
  END IF;

  v_slug := lower(regexp_replace(v_name, '[^a-zA-Z0-9]+', '-', 'g'));
  v_slug := trim(both '-' from v_slug);

  IF v_slug = '' THEN
    RAISE EXCEPTION 'Category name must include letters or numbers' USING ERRCODE = '22023';
  END IF;

  IF EXISTS (SELECT 1 FROM public.program_categories WHERE slug = v_slug) THEN
    v_slug := v_slug || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 6);
  END IF;

  INSERT INTO public.program_categories (name, slug)
  VALUES (v_name, v_slug)
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_publication_category(p_name text)
RETURNS public.publication_categories
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_name text := trim(p_name);
  v_slug text;
  v_row public.publication_categories;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Admin access required' USING ERRCODE = '42501';
  END IF;

  IF v_name = '' THEN
    RAISE EXCEPTION 'Category name is required' USING ERRCODE = '22023';
  END IF;

  v_slug := lower(regexp_replace(v_name, '[^a-zA-Z0-9]+', '-', 'g'));
  v_slug := trim(both '-' from v_slug);

  IF v_slug = '' THEN
    RAISE EXCEPTION 'Category name must include letters or numbers' USING ERRCODE = '22023';
  END IF;

  IF EXISTS (SELECT 1 FROM public.publication_categories WHERE slug = v_slug) THEN
    v_slug := v_slug || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 6);
  END IF;

  INSERT INTO public.publication_categories (name, slug)
  VALUES (v_name, v_slug)
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.create_program_category(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_publication_category(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_program_category(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.create_publication_category(text) TO authenticated, service_role;
