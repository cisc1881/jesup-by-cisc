import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "jesup-market-reminders";

export function useMarketReminders() {
  const [reminderIds, setReminderIds] = useState<Set<string>>(new Set());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setReminderIds(new Set(JSON.parse(raw) as string[]));
    } catch {
      setReminderIds(new Set());
    }
    setReady(true);
  }, []);

  const persist = useCallback((next: Set<string>) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
  }, []);

  const toggleReminder = useCallback(
    (marketId: string) => {
      const next = new Set(reminderIds);
      if (next.has(marketId)) next.delete(marketId);
      else next.add(marketId);
      setReminderIds(next);
      persist(next);
      return !reminderIds.has(marketId);
    },
    [persist, reminderIds],
  );

  const hasReminder = useCallback((marketId: string) => reminderIds.has(marketId), [reminderIds]);

  return { reminderIds, toggleReminder, hasReminder, ready };
}
