import type { WeatherCoordinates } from "./types";

export type WeatherRadarInfo = {
  wfo: string;
  radarPageUrl: string;
  openInNewWindowUrl: string;
  attribution: string;
  available: boolean;
};

export function buildNwsRadarInfo(wfo: string, coords?: WeatherCoordinates): WeatherRadarInfo {
  const office = wfo.toUpperCase();
  const radarPageUrl = `https://www.weather.gov/${office.toLowerCase()}`;
  const openInNewWindowUrl = coords
    ? `https://radar.weather.gov/ridge/standard/${office}-loop.gif`
    : radarPageUrl;

  return {
    wfo: office,
    radarPageUrl,
    openInNewWindowUrl,
    attribution: "Radar imagery and alerts provided by the U.S. National Weather Service.",
    available: true,
  };
}

export function buildUnavailableRadarInfo(): WeatherRadarInfo {
  return {
    wfo: "",
    radarPageUrl: "https://www.weather.gov/",
    openInNewWindowUrl: "https://www.weather.gov/",
    attribution: "National Weather Service radar",
    available: false,
  };
}
