/**
 * Development / demonstration weather data for Sprint 10 Phase 1.
 * NOT live production data — clearly labeled in UI and code.
 */
import type { WeatherCenterData } from "./types";

export const DEMO_WEATHER_LABEL = "Development demo data";

export const DEMO_WEATHER_CENTER_DATA: WeatherCenterData = {
  isDemo: true,
  location: {
    label: "Tuskegee, AL",
    county: "Macon County",
  },
  current: {
    temperatureF: 88,
    condition: "Partly cloudy",
    conditionCode: "partly-cloudy",
    feelsLikeF: 94,
    humidityPercent: 62,
    windMph: 8,
    windDirection: "SW",
    rainChancePercent: 35,
    heatIndexF: 96,
    lastUpdated: "2026-07-12T13:00:00-05:00",
  },
  alerts: [
    {
      id: "demo-alert-1",
      title: "Demo Severe Thunderstorm Watch",
      severity: "watch",
      effectiveAt: "2026-07-12T14:00:00-05:00",
      expiresAt: "2026-07-12T20:00:00-05:00",
      shortDescription:
        "Demonstration alert only. Conditions are favorable for demo thunderstorms with gusty winds in the Macon County area.",
      recommendedAction:
        "Review your household storm plan, charge devices, and monitor trusted local sources. This is not a live NWS alert.",
      details:
        "This sample watch is shown for UI testing. In a live deployment, text would come from the National Weather Service or county emergency feeds. Hazards shown for demonstration: gusts up to 40 mph, frequent lightning, brief heavy rain.",
    },
  ],
  forecast: [
    { weekday: "Sun", conditionCode: "partly-cloudy", condition: "Partly cloudy", highF: 90, lowF: 72, rainProbabilityPercent: 30 },
    { weekday: "Mon", conditionCode: "thunderstorm", condition: "Thunderstorms", highF: 87, lowF: 71, rainProbabilityPercent: 65 },
    { weekday: "Tue", conditionCode: "rain", condition: "Showers", highF: 84, lowF: 70, rainProbabilityPercent: 55 },
    { weekday: "Wed", conditionCode: "cloudy", condition: "Cloudy", highF: 86, lowF: 69, rainProbabilityPercent: 25 },
    { weekday: "Thu", conditionCode: "clear", condition: "Mostly sunny", highF: 91, lowF: 73, rainProbabilityPercent: 10 },
    { weekday: "Fri", conditionCode: "hot", condition: "Hot & humid", highF: 94, lowF: 75, rainProbabilityPercent: 15 },
    { weekday: "Sat", conditionCode: "partly-cloudy", condition: "Partly cloudy", highF: 92, lowF: 74, rainProbabilityPercent: 20 },
  ],
  countyPreparedness: {
    countyName: "Macon County",
    agencyName: "Macon County Emergency Management Agency",
    phone: "334-724-2626",
    contactAvailable: true,
    verificationStatus: "verified",
    sourceName: "Macon County Emergency Management Agency (demo)",
    verifiedDate: "2026-07-12",
    guidance: [
      "Keep a NOAA weather radio or reliable local alert app enabled for Macon County.",
      "Maintain battery backup for phones, radios, and essential medical devices.",
      "Know common seasonal trends: summer heat, afternoon thunderstorms, and occasional severe wind.",
      "Prepare a storm emergency kit: water, medications, flashlight, first aid, and important documents.",
      "Agree on a household storm protocol — where to shelter and how to check on neighbors.",
      "Pay special attention to very young children, older adults, and those with mobility needs.",
      "Contact local authorities if you need non-emergency assistance during extended outages.",
    ],
  },
  agriculture: {
    title: "This Week in Alabama Agriculture",
    insights: [
      { id: "heat", label: "Heat stress risk", summary: "Elevated for livestock and field crews — demo advisory." },
      { id: "irrigation", label: "Irrigation recommendation", summary: "Increase early-morning irrigation for demonstration plots." },
      { id: "livestock", label: "Livestock shade & water", summary: "Ensure shade structures and fresh water — sample guidance." },
      { id: "planting", label: "Planting window", summary: "Late summer cover-crop planting window opening — demo only." },
      { id: "rain", label: "Rain outlook", summary: "Scattered storms mid-week; plan field work for Thu–Fri demo window." },
      { id: "pest", label: "Pest risk", summary: "Moderate stink bug pressure possible after storms — illustration data." },
    ],
    usdaDeadlineCount: 2,
    extensionWorkshopCount: 3,
  },
};

export const DEMO_AGRICULTURE_DATA = DEMO_WEATHER_CENTER_DATA.agriculture;
