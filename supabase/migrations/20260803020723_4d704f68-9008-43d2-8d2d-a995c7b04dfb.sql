-- 1) platform_settings: public-safe keys only
DROP POLICY IF EXISTS "Public can read platform settings" ON public.platform_settings;

CREATE POLICY "Public can read public platform settings"
ON public.platform_settings
FOR SELECT
TO anon, authenticated
USING (key IN ('organization', 'brand', 'homepage', 'navigation', 'maps'));

CREATE POLICY "Admins can read all platform settings"
ON public.platform_settings
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 2) link tables: require parent published/active
DROP POLICY IF EXISTS "Public can read news tags" ON public.news_tags;
CREATE POLICY "Public can read news tags"
ON public.news_tags FOR SELECT TO anon, authenticated
USING (
  EXISTS (SELECT 1 FROM public.news_articles n WHERE n.id = news_tags.news_article_id AND n.is_published = true)
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
);

DROP POLICY IF EXISTS "Public can read news_programs" ON public.news_programs;
CREATE POLICY "Public can read news_programs"
ON public.news_programs FOR SELECT TO anon, authenticated
USING (
  (EXISTS (SELECT 1 FROM public.news_articles n WHERE n.id = news_programs.news_article_id AND n.is_published = true)
   AND EXISTS (SELECT 1 FROM public.programs p WHERE p.id = news_programs.program_id AND p.is_active = true))
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
);

DROP POLICY IF EXISTS "Public can read news_events" ON public.news_events;
CREATE POLICY "Public can read news_events"
ON public.news_events FOR SELECT TO anon, authenticated
USING (
  (EXISTS (SELECT 1 FROM public.news_articles n WHERE n.id = news_events.news_article_id AND n.is_published = true)
   AND EXISTS (SELECT 1 FROM public.events e WHERE e.id = news_events.event_id AND e.is_active = true AND e.status = 'published'))
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
);

DROP POLICY IF EXISTS "Public can read news_publications" ON public.news_publications;
CREATE POLICY "Public can read news_publications"
ON public.news_publications FOR SELECT TO anon, authenticated
USING (
  (EXISTS (SELECT 1 FROM public.news_articles n WHERE n.id = news_publications.news_article_id AND n.is_published = true)
   AND EXISTS (SELECT 1 FROM public.publications p WHERE p.id = news_publications.publication_id AND p.is_active = true))
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
);

DROP POLICY IF EXISTS "Public can read news_partners" ON public.news_partners;
CREATE POLICY "Public can read news_partners"
ON public.news_partners FOR SELECT TO anon, authenticated
USING (
  (EXISTS (SELECT 1 FROM public.news_articles n WHERE n.id = news_partners.news_article_id AND n.is_published = true)
   AND EXISTS (SELECT 1 FROM public.partners p WHERE p.id = news_partners.partner_id AND p.is_published = true))
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
);

DROP POLICY IF EXISTS "Public can read partner_publications" ON public.partner_publications;
CREATE POLICY "Public can read partner_publications"
ON public.partner_publications FOR SELECT TO anon, authenticated
USING (
  (EXISTS (SELECT 1 FROM public.partners p WHERE p.id = partner_publications.partner_id AND p.is_published = true)
   AND EXISTS (SELECT 1 FROM public.publications pub WHERE pub.id = partner_publications.publication_id AND pub.is_active = true))
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
);

DROP POLICY IF EXISTS "Public can read partner_podcast_episodes" ON public.partner_podcast_episodes;
CREATE POLICY "Public can read partner_podcast_episodes"
ON public.partner_podcast_episodes FOR SELECT TO anon, authenticated
USING (
  (EXISTS (SELECT 1 FROM public.partners p WHERE p.id = partner_podcast_episodes.partner_id AND p.is_published = true)
   AND EXISTS (SELECT 1 FROM public.podcast_episodes pe WHERE pe.id = partner_podcast_episodes.podcast_episode_id AND pe.is_published = true))
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
);

DROP POLICY IF EXISTS "Public can read content tag links" ON public.content_tag_links;
CREATE POLICY "Public can read content tag links"
ON public.content_tag_links FOR SELECT TO anon, authenticated
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR CASE content_tag_links.entity_type
    WHEN 'news' THEN EXISTS (SELECT 1 FROM public.news_articles n WHERE n.id = content_tag_links.entity_id AND n.is_published = true)
    WHEN 'news_article' THEN EXISTS (SELECT 1 FROM public.news_articles n WHERE n.id = content_tag_links.entity_id AND n.is_published = true)
    WHEN 'program' THEN EXISTS (SELECT 1 FROM public.programs p WHERE p.id = content_tag_links.entity_id AND p.is_active = true)
    WHEN 'event' THEN EXISTS (SELECT 1 FROM public.events e WHERE e.id = content_tag_links.entity_id AND e.is_active = true AND e.status = 'published')
    WHEN 'publication' THEN EXISTS (SELECT 1 FROM public.publications p WHERE p.id = content_tag_links.entity_id AND p.is_active = true)
    WHEN 'partner' THEN EXISTS (SELECT 1 FROM public.partners p WHERE p.id = content_tag_links.entity_id AND p.is_published = true)
    WHEN 'podcast_episode' THEN EXISTS (SELECT 1 FROM public.podcast_episodes pe WHERE pe.id = content_tag_links.entity_id AND pe.is_published = true)
    ELSE false
  END
);

-- 3) SECURITY DEFINER functions: remove blanket PUBLIC execute, grant explicitly
REVOKE ALL ON FUNCTION public.create_anonymous_evaluation_response(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.submit_anonymous_evaluation_answers(uuid, text, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.upsert_anonymous_evaluation_demographics(uuid, text, text, text, text, text, text, text, text, boolean, boolean, text, text, text, uuid, public.academic_level, boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_event_registration_count(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.create_anonymous_evaluation_response(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_anonymous_evaluation_answers(uuid, text, jsonb) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_anonymous_evaluation_demographics(uuid, text, text, text, text, text, text, text, text, boolean, boolean, text, text, text, uuid, public.academic_level, boolean) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_event_registration_count(uuid) TO anon, authenticated;

-- admin-only routines: no anon access
REVOKE ALL ON FUNCTION public.create_program_category(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.create_publication_category(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.set_event_gallery_cover(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_event_demographic_aggregates(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_multi_event_demographic_aggregates(uuid[]) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.event_demographic_rows(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_program_category(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_publication_category(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_event_gallery_cover(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_event_demographic_aggregates(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_multi_event_demographic_aggregates(uuid[]) TO authenticated;