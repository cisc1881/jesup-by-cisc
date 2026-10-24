import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { validCoordinates, type CoveragePlace } from '@/lib/extension-insights';

export default function ExtensionCoverageMap({ places }: { places: CoveragePlace[] }) {
  const element = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!element.current) return;
    const map = L.map(element.current, { scrollWheelZoom: false }).setView([32.43, -85.71], 7);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>', maxZoom: 19,
    }).addTo(map);
    const points: L.LatLngTuple[] = [];
    for (const place of places) {
      if (!validCoordinates(place.lat, place.lng) || place.lat === null || place.lng === null) continue;
      const point: L.LatLngTuple = [place.lat, place.lng];
      points.push(point);
      // Text nodes, not interpreted HTML, keep stored venue titles safe.
      const popup = document.createElement('div');
      popup.textContent = `${place.name} · ${place.kind === 'event' ? 'Event' : 'Market'} · ${place.place ?? 'Place not recorded'}`;
      const token = getComputedStyle(element.current).getPropertyValue(place.kind === 'event' ? '--primary' : '--muted-foreground').trim();
      L.circleMarker(point, { radius: place.kind === 'event' ? 9 : 6, color: token, fillColor: token, fillOpacity: .8, weight: 2 }).bindPopup(popup).addTo(map);
    }
    if (points.length) map.fitBounds(L.latLngBounds(points), { padding: [32, 32], maxZoom: 12 });
    const resize = new ResizeObserver(() => map.invalidateSize());
    resize.observe(element.current);
    return () => { resize.disconnect(); map.remove(); };
  }, [places]);
  return <div ref={element} role="region" aria-label="Event and market venue coverage map; equivalent records listed below" className="relative z-0 h-[420px] w-full rounded-lg border border-border bg-muted sm:h-[480px]" />;
}