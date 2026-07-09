export type {
  HomeCta,
  HomeEvent,
  HomeHeroSlide,
  HomeImpactStat,
  HomeMarket,
  HomeNewsArticle,
  HomePageData,
  HomePodcastEpisode,
  HomeProgram,
  HomePublication,
  HomeQuickAction,
} from "./types";

export {
  distanceKm,
  fetchFeaturedPodcast,
  fetchHomeEvents,
  fetchHomeHeroSlides,
  fetchHomeImpactStats,
  fetchHomeMarkets,
  fetchHomeNews,
  fetchHomePageData,
  fetchHomePublications,
  pickNearestMarket,
  resolveHomeCta,
} from "./queries";

export { fetchHomePrograms } from "./programs-source";

export { HOME_QUICK_ACTIONS } from "./quick-actions";
export { fetchHomeSectionMeta, DEFAULT_IMPACT_METRICS, DEFAULT_SECTION_META } from "./section-config";
export type { HomeSectionId, HomeSectionMeta, HomeImpactMetricDef } from "./section-config";
