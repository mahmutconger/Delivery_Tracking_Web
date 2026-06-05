"use client";

import { useRef } from "react";

/**
 * @brief `fn`'in `limitMs` süre içinde en fazla bir kez çalışmasını sağlayan throttled bir sarmalayıcı döner.
 * @param fn Throttle uygulanacak fonksiyon.
 * @param limitMs Minimum çağrı aralığı (ms). Bu süre dolmadan yapılan çağrılar yoksayılır.
 * @returns Render'lar arasında stabil, throttle uygulanmış fonksiyon.
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
 * @brief useThrottle gibi ancak kalan bekleme süresini de döndürür; buton devre dışı bırakma veya geri sayım için kullanılır.
 * @param fn Throttle uygulanacak fonksiyon.
 * @param limitMs Minimum çağrı aralığı (ms).
 * @returns call: çağrı başarılıysa true, engellendiyse false dönen fonksiyon; getRemainingMs: kalan bekleme süresi (ms).
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
