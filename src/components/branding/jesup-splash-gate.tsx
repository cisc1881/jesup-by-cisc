import { useRouterState } from "@tanstack/react-router";
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

function shouldSkipSplash(pathname: string): boolean {
  if (hasSeenSplashThisSession()) return true;
  if (prefersReducedMotion()) return true;
  if (pathname === "/auth" || pathname.startsWith("/auth/")) return true;
  if (pathname.startsWith("/admin")) return true;
  return false;
}

function markSplashSeen(): void {
  try {
    sessionStorage.setItem(JESUP_SPLASH_SESSION_KEY, "1");
  } catch {
    /* private browsing */
  }
}

export function JesupSplashGate({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [gatePhase, setGatePhase] = useState<SplashGatePhase>("pending");

  useEffect(() => {
    if (gatePhase !== "pending") return;
    if (shouldSkipSplash(pathname)) {
      setGatePhase("done");
      return;
    }
    setGatePhase("show");
  }, [gatePhase, pathname]);

  useEffect(() => {
    if (gatePhase !== "show") return;
    const timer = window.setTimeout(() => setGatePhase("exit"), SPLASH_HOLD_MS);
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
      {children}
      {splashPhase !== "hidden" && (
        <JesupSplashScreen phase={splashPhase} onExitComplete={handleExitComplete} />
      )}
    </>
  );
}
