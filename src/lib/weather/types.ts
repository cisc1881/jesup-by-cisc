/** Sprint 10 — Weather & Emergency Center data contracts. */

import type { CountyVerificationStatus } from "./county-directory-types";
import type { WeatherRadarInfo } from "./radar";

export type WeatherSeverity = "advisory" | "watch" | "warning" | "emergency";

export type WeatherConditionCode =
  | "clear"
  | "partly-cloudy"
  | "cloudy"
  | "rain"
  | "thunderstorm"
  | "wind"
  | "hot";

export type LocationSource = "live" | "manual" | "default";

export type WeatherCenterStatus =
  | "idle"
  | "requesting-permission"
  | "loading"
  | "live"
  | "permission-denied"
  | "provider-error"
  | "fallback";

export interface WeatherCoordinates {
  lat: number;
  lon: number;
}

export interface StoredWeatherLocation extends WeatherCoordinates {
  source: LocationSource;
  label?: string;
  county?: string;
  city?: string;
  state?: string;
  postalCode?: string;
}

export interface GeocodedPlace extends WeatherCoordinates {
  label: string;
  county: string;
  city?: string;
  state?: string;
  postalCode?: string;
}

export interface WeatherLocation {
  label: string;
  county: string;
  city?: string;
  state?: string;
  postalCode?: string;
}

export interface CurrentConditions {
  temperatureF: number;
  condition: string;
  conditionCode: WeatherConditionCode;
  feelsLikeF: number;
  humidityPercent: number;
  windMph: number;
  windDirection: string;
  rainChancePercent: number;
  heatIndexF: number;
  lastUpdated: string;
}

export interface SevereWeatherAlert {
  id: string;
  title: string;
  severity: WeatherSeverity;
  effectiveAt: string;
  expiresAt: string;
  shortDescription: string;
  recommendedAction: string;
  details: string;
  source?: string;
}

export interface ForecastDay {
  weekday: string;
  conditionCode: WeatherConditionCode;
  condition: string;
  highF: number;
  lowF: number;
  rainProbabilityPercent: number;
}

export interface CountyPreparedness {
  countyName: string;
  agencyName: string;
  phone: string | null;
  alternatePhone?: string | null;
  websiteUrl?: string | null;
  alertSignupUrl?: string | null;
  shelterInfoUrl?: string | null;
  guidance: string[];
  contactAvailable: boolean;
  verificationStatus: CountyVerificationStatus;
  sourceName?: string;
  sourceUrl?: string;
  verifiedDate?: string;
  lastReviewedLabel?: string;
}

export interface AgriculturalInsightItem {
  id: string;
  label: string;
  summary: string;
}

export interface AgriculturalInsights {
  title: string;
  insights: AgriculturalInsightItem[];
  usdaDeadlineCount: number;
  extensionWorkshopCount: number;
}

/** Normalized weather payload consumed by UI components. */
export interface WeatherCenterData {
  /** When true, UI shows demo/fallback labeling and disclaimers. */
  isDemo: boolean;
  /** True when live providers failed and demo/fallback content is shown. */
  isFallback?: boolean;
  location: WeatherLocation;
  current: CurrentConditions;
  alerts: SevereWeatherAlert[];
  forecast: ForecastDay[];
  countyPreparedness: CountyPreparedness;
  agriculture: AgriculturalInsights;
  radar?: WeatherRadarInfo;
  coordinates?: WeatherCoordinates;
}

export interface WeatherCenterProps {
  data: WeatherCenterData | null;
  isLoading?: boolean;
  status?: WeatherCenterStatus;
  locationSource?: LocationSource;
  errorMessage?: string;
  onRequestLocation?: () => void;
  onChangeLocation?: () => void;
  onManualLocationSearch?: (query: string) => Promise<void>;
  onUseDefaultLocation?: () => void;
  isSearchingLocation?: boolean;
  isRefreshing?: boolean;
  onRefreshWeather?: () => void;
  lastUpdatedLabel?: string;
}
