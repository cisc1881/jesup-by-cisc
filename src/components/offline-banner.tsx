import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

export function OfflineBanner() {
  // Keep the server and first client render identical. Reading navigator.onLine
  // during render caused a hydration mismatch, and several iOS/PWA webviews can
  // report false even while same-origin requests are succeeding.
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    let disposed = false;
    let activeController: AbortController | null = null;

    async function verifyConnectivity() {
      activeController?.abort();
      const controller = new AbortController();
      activeController = controller;
      const timeout = window.setTimeout(() => controller.abort(), 5000);

      try {
        await fetch(`/favicon.ico?connectivity=${Date.now()}`, {
          method: "HEAD",
          cache: "no-store",
          credentials: "same-origin",
          signal: controller.signal,
        });
        if (!disposed) setOffline(false);
      } catch {
        if (!disposed) setOffline(!navigator.onLine);
      } finally {
        window.clearTimeout(timeout);
      }
    }

    function onNetworkChange() {
      void verifyConnectivity();
    }

    void verifyConnectivity();
    window.addEventListener("online", onNetworkChange);
    window.addEventListener("offline", onNetworkChange);
    return () => {
      disposed = true;
      activeController?.abort();
      window.removeEventListener("online", onNetworkChange);
      window.removeEventListener("offline", onNetworkChange);
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
