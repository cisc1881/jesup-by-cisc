import { useCallback, useEffect, useState } from "react";

export function useUserLocation() {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLoading(false);
      },
      () => {
        setDenied(true);
        setLoading(false);
      },
      { maximumAge: 300_000, timeout: 10_000 },
    );
  }, []);

  const refresh = useCallback(() => {
    if (!navigator.geolocation) return;
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setDenied(false);
        setLoading(false);
      },
      () => {
        setDenied(true);
        setLoading(false);
      },
      { maximumAge: 0, timeout: 10_000 },
    );
  }, []);

  return { coords, loading, denied, refresh };
}
