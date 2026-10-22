import { useRouterState, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { ENTRY_DESTINATION_KEY, GUEST_ENTRY_KEY, isAuthReturn, needsEntryChoice, readSessionValue, writeSessionValue } from "@/lib/entry-session";
import { type ReactNode, useCallback, useEffect, useState } from "react";
import {
  JesupSplashScreen,
  JESUP_SPLASH_SESSION_KEY,
  SPLASH_EXIT_MS,
  SPLASH_HOLD_MS,
} from "./jesup-splash-screen";
import type { SplashTransitionPhase } from "./splash-transition";

type SplashGatePhase = "pending" | "show" | "exit" | "done";

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function hasSeenSplashThisSession(): boolean {
  try {
    return sessionStorage.getItem(JESUP_SPLASH_SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

function markSplashSeen(): void {
  try {
    sessionStorage.setItem(JESUP_SPLASH_SESSION_KEY, "1");
  } catch {
    /* private browsing */
  }
}

export function JesupSplashGate({ children }: { children: ReactNode }) {
  const location = useRouterState({ select: (state) => state.location });
  const pathname = location.pathname;
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [gatePhase, setGatePhase] = useState<SplashGatePhase>("pending");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (loading) return;
    const authReturn = isAuthReturn(pathname, location.searchStr, window.location.hash);
    if (user || authReturn || readSessionValue(GUEST_ENTRY_KEY) === "1") {
      setGatePhase("done");
      setReady(true);
      return;
    }
    if (gatePhase !== "pending") return;
    if (hasSeenSplashThisSession()) {
      setGatePhase("done");
      return;
    }
    setGatePhase("show");
  }, [gatePhase, pathname, location.searchStr, user, loading]);

  useEffect(() => {
    if (loading || gatePhase !== "done") return;
    const authReturn = isAuthReturn(pathname, location.searchStr, window.location.hash);
    if (!needsEntryChoice({signedIn: Boolean(user), guestChosen: readSessionValue(GUEST_ENTRY_KEY) === "1", authReturn}) || pathname === "/auth") {
      setReady(true);
      return;
    }
    const next = `${pathname}${location.searchStr}${window.location.hash}`;
    writeSessionValue(ENTRY_DESTINATION_KEY, next);
    void navigate({ to: "/auth", search: { next }, replace: true });
  }, [gatePhase, loading, user, pathname, location.searchStr, navigate]);

  useEffect(() => {
    if (gatePhase !== "show") return;
    const timer = window.setTimeout(() => setGatePhase("exit"), prefersReducedMotion() ? 100 : SPLASH_HOLD_MS);
    return () => window.clearTimeout(timer);
  }, [gatePhase]);

  const handleExitComplete = useCallback(() => {
    markSplashSeen();
    setGatePhase("done");
  }, []);

  useEffect(() => {
    if (gatePhase !== "exit") return;
    const fallback = window.setTimeout(handleExitComplete, SPLASH_EXIT_MS + 50);
    return () => window.clearTimeout(fallback);
  }, [gatePhase, handleExitComplete]);

  const splashPhase: SplashTransitionPhase =
    gatePhase === "show" ? "enter" : gatePhase === "exit" ? "exit" : "hidden";

  return (
    <>
      <div hidden={!ready} inert={!ready}>{children}</div>
      {!ready && splashPhase === "hidden" && <div className="fixed inset-0 z-50 bg-background" aria-label="Opening JESUP" role="status" />}
      {splashPhase !== "hidden" && (
        <JesupSplashScreen phase={splashPhase} onExitComplete={handleExitComplete} />
      )}
    </>
  );
}
