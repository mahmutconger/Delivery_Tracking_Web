"use client";

import { useEffect, useRef, useState } from "react";

/**
 * @brief `delayMs` boyunca değişmeyen bir `value` kopyası döndürür.
 * @param value İzlenecek değer. Her değişiklik zamanlayıcıyı sıfırlar.
 * @param delayMs Değer yayılmadan önce beklenmesi gereken süre (ms).
 * @returns Sessizlik süresi dolduğunda güncellenen debounced değer.
 */
export function useDebounce<T>(value: T, delayMs: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debouncedValue;
}

/**
 * @brief `fn`'i `delayMs` geçene kadar yürütmeyi erteleyerek debounce uygulayan bir sarmalayıcı döndürür.
 * @param fn Debounce uygulanacak callback.
 * @param delayMs Çalıştırmadan önceki bekleme süresi (ms).
 * @returns Render'lar arasında stabil (useRef destekli) debounced fonksiyon.
 */
export function useDebouncedCallback<T extends (...args: unknown[]) => void>(
  fn: T,
  delayMs: number,
): (...args: Parameters<T>) => void {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  return (...args: Parameters<T>) => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      fnRef.current(...args);
      timerRef.current = null;
    }, delayMs);
  };
}
