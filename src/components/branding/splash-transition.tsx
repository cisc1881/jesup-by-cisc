import { type ReactNode, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export type SplashTransitionPhase = "enter" | "exit" | "hidden";

export type SplashTransitionProps = {
  phase: SplashTransitionPhase;
  children: ReactNode;
  className?: string;
  onExitComplete?: () => void;
};

export function SplashTransition({ phase, children, className, onExitComplete }: SplashTransitionProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (phase !== "exit" || !onExitComplete) return;
    const node = rootRef.current;
    if (!node) return;

    const handleAnimationEnd = (event: AnimationEvent) => {
      if (event.target !== node || event.animationName !== "splash-exit") return;
      onExitComplete();
    };

    node.addEventListener("animationend", handleAnimationEnd);
    return () => node.removeEventListener("animationend", handleAnimationEnd);
  }, [phase, onExitComplete]);

  if (phase === "hidden") return null;

  return (
    <div
      ref={rootRef}
      className={cn("jesup-splash", phase === "exit" && "jesup-splash--exiting", className)}
      aria-hidden="true"
    >
      {children}
    </div>
  );
}
