export const WEATHER_SW_PATH = "/sw.js";

export async function registerWeatherServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return null;

  try {
    return await navigator.serviceWorker.register(WEATHER_SW_PATH, { scope: "/" });
  } catch {
    return null;
  }
}

export async function getWeatherServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return null;
  return navigator.serviceWorker.getRegistration("/");
}

export { urlBase64ToUint8Array } from "./subscription-normalize";
