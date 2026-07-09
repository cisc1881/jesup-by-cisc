import type { LucideIcon } from "lucide-react";
import type { MarketListItem } from "@/lib/markets";
import type { PublicationListItem } from "@/lib/publications";
import type { HomeSectionId, HomeSectionMeta } from "./section-config";

/** Featured image slide for the home hero carousel. */
export type HomeHeroSlide = {
  id: string;
  imageUrl: string;
  imageAlt: string;
  title: string | null;
  subtitle: string | null;
  linkTo: string;
  linkParams?: Record<string, string>;
  linkLabel: string | null;
};

export type HomeProgram = {
  slug: string;
  name: string;
  short: string;
  tagline: string;
  imageUrl: string;
  categoryName: string | null;
};

export type HomeEvent = {
  id: string;
  title: string;
  startsAt: string;
  location: string | null;
  imageUrl: string | null;
  registrationOpen: boolean;
};

export type HomePublication = PublicationListItem;

export type HomePodcastEpisode = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  coverUrl: string | null;
  guest: string | null;
  durationSeconds: number | null;
  publishedAt: string | null;
};

export type HomeMarket = MarketListItem;

export type HomeImpactStat = {
  id: string;
  label: string;
  value: number;
};

export type HomeCta = {
  eyebrow: string | null;
  title: string;
  body: string | null;
  linkTo: string;
  linkParams?: Record<string, string>;
  buttonLabel: string;
};

export type HomeQuickAction = {
  to: string;
  label: string;
  icon: LucideIcon;
};

export type HomePageData = {
  heroSlides: HomeHeroSlide[];
  programs: HomeProgram[];
  events: HomeEvent[];
  publications: HomePublication[];
  featuredPodcast: HomePodcastEpisode | null;
  markets: HomeMarket[];
  impactStats: HomeImpactStat[];
  cta: HomeCta | null;
  sections: Record<HomeSectionId, HomeSectionMeta>;
};
