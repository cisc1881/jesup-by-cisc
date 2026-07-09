/** Geographic helpers for farmers markets. */

export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function distanceMiles(km: number) {
  return km * 0.621371;
}

export function formatDistance(km: number | null | undefined) {
  if (km == null) return null;
  if (km < 1) return `${Math.round(km * 1000)} m`;
  const miles = distanceMiles(km);
  if (miles < 10) return `${miles.toFixed(1)} mi`;
  return `${Math.round(miles)} mi`;
}

export function googleMapsDirectionsUrl(market: {
  lat: number | null;
  lng: number | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
}) {
  if (market.lat != null && market.lng != null) {
    return `https://www.google.com/maps/dir/?api=1&destination=${market.lat},${market.lng}`;
  }
  const query = encodeURIComponent(
    [market.address, market.city, market.state].filter(Boolean).join(", "),
  );
  return `https://www.google.com/maps/dir/?api=1&destination=${query}`;
}

export function googleMapsEmbedUrl(lat: number, lng: number, zoom = 14) {
  return `https://www.google.com/maps?q=${lat},${lng}&z=${zoom}&output=embed`;
}

export async function shareMarket(market: { name: string; id: string; slug?: string }) {
  const url = `${window.location.origin}/markets/${market.id}`;
  if (navigator.share) {
    await navigator.share({ title: market.name, text: `Visit ${market.name}`, url });
    return;
  }
  await navigator.clipboard.writeText(url);
}
