import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

export function OfflineBanner() {
  const [offline, setOffline] = useState(
    typeof navigator !== "undefined" ? !navigator.onLine : false,
  );

  useEffect(() => {
    function onOnline() {
      setOffline(false);
    }
    function onOffline() {
      setOffline(true);
    }
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] flex items-center justify-center gap-2 bg-foreground px-4 py-2 text-center text-xs font-semibold text-background sm:text-sm"
    >
      <WifiOff className="h-4 w-4 shrink-0" aria-hidden="true" />
      You&apos;re offline. Some content may be unavailable until your connection returns.
    </div>
  );
}
