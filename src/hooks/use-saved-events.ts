import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "jesup-saved-events";

export function useSavedEvents() {
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setSavedIds(new Set(JSON.parse(raw) as string[]));
    } catch {
      setSavedIds(new Set());
    }
  }, []);

  const persist = useCallback((next: Set<string>) => {
    setSavedIds(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
  }, []);

  const toggleSaved = useCallback(
    (eventId: string) => {
      const next = new Set(savedIds);
      if (next.has(eventId)) next.delete(eventId);
      else next.add(eventId);
      persist(next);
    },
    [persist, savedIds],
  );

  const isSaved = useCallback((eventId: string) => savedIds.has(eventId), [savedIds]);

  return { savedIds, toggleSaved, isSaved, savedCount: savedIds.size };
}
