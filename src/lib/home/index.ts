export type {
  HomeCta,
  HomeEvent,
  HomeHeroSlide,
  HomeImpactStat,
  HomeMarket,
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
  fetchHomePageData,
  fetchHomePublications,
  pickNearestMarket,
  resolveHomeCta,
} from "./queries";

export { fetchHomePrograms } from "./programs-source";

export { HOME_QUICK_ACTIONS } from "./quick-actions";
export { fetchHomeSectionMeta, DEFAULT_IMPACT_METRICS } from "./section-config";
export type { HomeSectionId, HomeSectionMeta, HomeImpactMetricDef } from "./section-config";
