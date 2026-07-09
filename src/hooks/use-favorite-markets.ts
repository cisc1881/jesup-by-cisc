import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { fetchUserFavoriteMarketIds, toggleFavoriteMarket } from "@/lib/markets";

const STORAGE_KEY = "jesup-favorite-markets";

export function useFavoriteMarkets() {
  const { user } = useAuth();
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (user) {
        try {
          const ids = await fetchUserFavoriteMarketIds(user.id);
          if (!cancelled) {
            setSavedIds(ids);
            localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
          }
        } catch {
          const raw = localStorage.getItem(STORAGE_KEY);
          if (!cancelled && raw) setSavedIds(new Set(JSON.parse(raw) as string[]));
        }
      } else {
        try {
          const raw = localStorage.getItem(STORAGE_KEY);
          if (!cancelled && raw) setSavedIds(new Set(JSON.parse(raw) as string[]));
        } catch {
          if (!cancelled) setSavedIds(new Set());
        }
      }
      if (!cancelled) setReady(true);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const persistLocal = useCallback((next: Set<string>) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
  }, []);

  const toggleSaved = useCallback(
    async (marketId: string) => {
      const next = new Set(savedIds);
      const willSave = !next.has(marketId);
      if (willSave) next.add(marketId);
      else next.delete(marketId);
      setSavedIds(next);
      persistLocal(next);

      if (user) {
        try {
          await toggleFavoriteMarket(user.id, marketId, willSave);
        } catch {
          const rollback = new Set(savedIds);
          setSavedIds(rollback);
          persistLocal(rollback);
        }
      }
    },
    [persistLocal, savedIds, user],
  );

  const isSaved = useCallback((marketId: string) => savedIds.has(marketId), [savedIds]);

  return { savedIds, toggleSaved, isSaved, savedCount: savedIds.size, ready };
}
