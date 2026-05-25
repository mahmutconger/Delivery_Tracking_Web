"use client";

import { useRef } from "react";

/**
 * Returns a throttled version of `fn` that fires at most once per `limitMs`.
 *
 * The first call in a window goes through immediately. Subsequent calls
 * within the same window are dropped entirely (fire-and-forget throttle,
 * not leading+trailing). The returned function is stable across renders.
 *
 * Use for action buttons (notifications, status changes) where a double-tap
 * must not trigger a second API request within the cooldown window.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useThrottle<T extends (...args: any[]) => void>(
  fn: T,
  limitMs: number,
): (...args: Parameters<T>) => void {
  const lastCalledRef = useRef<number>(0);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  return (...args: Parameters<T>) => {
    const now = Date.now();

    if (now - lastCalledRef.current < limitMs) {
      return;
    }

    lastCalledRef.current = now;
    fnRef.current(...args);
  };
}

/**
 * Like useThrottle but returns the remaining cooldown in ms so the caller
 * can disable / show a countdown on a button.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useThrottleWithCooldown<T extends (...args: any[]) => void>(
  fn: T,
  limitMs: number,
): {
  call: (...args: Parameters<T>) => boolean;
  getRemainingMs: () => number;
} {
  const lastCalledRef = useRef<number>(0);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  const getRemainingMs = () => {
    const elapsed = Date.now() - lastCalledRef.current;
    return Math.max(0, limitMs - elapsed);
  };

  const call = (...args: Parameters<T>): boolean => {
    if (getRemainingMs() > 0) {
      return false;
    }

    lastCalledRef.current = Date.now();
    fnRef.current(...args);
    return true;
  };

  return { call, getRemainingMs };
}
