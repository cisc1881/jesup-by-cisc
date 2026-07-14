import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createDefaultStoredLocation,
  readStoredWeatherLocation,
  writeStoredWeatherLocation,
} from "@/lib/weather/location-storage";
import { geocodeLocationServerFn } from "@/lib/weather/server-fn";
import type { GeocodedPlace, LocationSource, StoredWeatherLocation, WeatherCenterStatus } from "@/lib/weather/types";

type UseWeatherLocationResult = {
  location: StoredWeatherLocation;
  locationSource: LocationSource;
  status: WeatherCenterStatus;
  errorMessage?: string;
  isSearchingLocation: boolean;
  requestLiveLocation: () => void;
  searchManualLocation: (query: string) => Promise<void>;
  useDefaultLocation: () => void;
  openLocationEditor: () => void;
  closeLocationEditor: () => void;
  isEditingLocation: boolean;
};

function toStoredLocation(place: GeocodedPlace, source: LocationSource): StoredWeatherLocation {
  return {
    lat: place.lat,
    lon: place.lon,
    source,
    label: place.label,
    county: place.county,
    city: place.city,
    state: place.state,
    postalCode: place.postalCode,
  };
}

export function useWeatherLocation(): UseWeatherLocationResult {
  const [location, setLocation] = useState<StoredWeatherLocation>(() => {
    return readStoredWeatherLocation() ?? createDefaultStoredLocation();
  });
  const [status, setStatus] = useState<WeatherCenterStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [isEditingLocation, setIsEditingLocation] = useState(false);

  useEffect(() => {
    writeStoredWeatherLocation(location);
  }, [location]);

  const locationSource = location.source;

  const requestLiveLocation = useCallback(() => {
    setErrorMessage(undefined);

    if (!navigator.geolocation) {
      setStatus("provider-error");
      setErrorMessage("Location is not supported in this browser.");
      return;
    }

    setStatus("requesting-permission");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextLocation: StoredWeatherLocation = {
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          source: "live",
        };
        setLocation(nextLocation);
        setStatus("loading");
        setIsEditingLocation(false);
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setStatus("permission-denied");
          setErrorMessage("Location permission was denied. You can enter a city or ZIP instead.");
        } else if (error.code === error.TIMEOUT) {
          setStatus("provider-error");
          setErrorMessage("Location request timed out. Try again or enter a city or ZIP.");
        } else {
          setStatus("provider-error");
          setErrorMessage("Could not determine your location.");
        }
      },
      { maximumAge: 0, timeout: 12_000, enableHighAccuracy: false },
    );
  }, []);

  const searchManualLocation = useCallback(async (query: string) => {
    setIsSearchingLocation(true);
    setErrorMessage(undefined);
    setStatus("loading");

    try {
      const place = await geocodeLocationServerFn({ data: { query } });
      setLocation(toStoredLocation(place, "manual"));
      setIsEditingLocation(false);
    } catch (error) {
      setStatus("provider-error");
      setErrorMessage(error instanceof Error ? error.message : "Could not find that location.");
    } finally {
      setIsSearchingLocation(false);
    }
  }, []);

  const useDefaultLocation = useCallback(() => {
    const fallback = createDefaultStoredLocation();
    setLocation(fallback);
    setStatus("loading");
    setErrorMessage(undefined);
    setIsEditingLocation(false);
  }, []);

  const openLocationEditor = useCallback(() => {
    setIsEditingLocation(true);
    setErrorMessage(undefined);
  }, []);

  const closeLocationEditor = useCallback(() => {
    setIsEditingLocation(false);
  }, []);

  return useMemo(
    () => ({
      location,
      locationSource,
      status,
      errorMessage,
      isSearchingLocation,
      requestLiveLocation,
      searchManualLocation,
      useDefaultLocation,
      openLocationEditor,
      closeLocationEditor,
      isEditingLocation,
    }),
    [
      location,
      locationSource,
      status,
      errorMessage,
      isSearchingLocation,
      requestLiveLocation,
      searchManualLocation,
      useDefaultLocation,
      openLocationEditor,
      closeLocationEditor,
      isEditingLocation,
    ],
  );
}
