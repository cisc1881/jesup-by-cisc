import { useCallback, useRef, useState, type TouchEvent } from "react";

type PullToRefreshState = "idle" | "pulling" | "refreshing";

type UsePullToRefreshOptions = {
  onRefresh: () => Promise<unknown>;
  threshold?: number;
  disabled?: boolean;
};

export function usePullToRefresh({
  onRefresh,
  threshold = 72,
  disabled = false,
}: UsePullToRefreshOptions) {
  const [state, setState] = useState<PullToRefreshState>("idle");
  const [distance, setDistance] = useState(0);
  const startY = useRef(0);
  const isTracking = useRef(false);

  const reset = useCallback(() => {
    setState("idle");
    setDistance(0);
    isTracking.current = false;
  }, []);

  const onTouchStart = useCallback(
    (event: TouchEvent) => {
      if (disabled || state === "refreshing" || window.scrollY > 4) return;
      startY.current = event.touches[0]?.clientY ?? 0;
      isTracking.current = true;
    },
    [disabled, state],
  );

  const onTouchMove = useCallback(
    (event: TouchEvent) => {
      if (!isTracking.current || disabled || state === "refreshing") return;
      const currentY = event.touches[0]?.clientY ?? 0;
      const delta = currentY - startY.current;
      if (delta > 0 && window.scrollY <= 4) {
        setDistance(Math.min(delta * 0.45, threshold * 1.6));
        setState("pulling");
      }
    },
    [disabled, state, threshold],
  );

  const onTouchEnd = useCallback(async () => {
    if (!isTracking.current || disabled) return;
    isTracking.current = false;

    if (distance >= threshold) {
      setState("refreshing");
      setDistance(threshold * 0.55);
      try {
        await onRefresh();
      } finally {
        reset();
      }
      return;
    }

    reset();
  }, [disabled, distance, onRefresh, reset, threshold]);

  return {
    state,
    distance,
    isRefreshing: state === "refreshing",
    isPulling: state === "pulling",
    progress: Math.min(distance / threshold, 1),
    handlers: { onTouchStart, onTouchMove, onTouchEnd },
  };
}
