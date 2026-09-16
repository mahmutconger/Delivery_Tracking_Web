"use client";

import { useEffect, useRef, useState } from "react";
import type { AnimationItem } from "lottie-web";

import { cn } from "@/shared/utils/cn";

/**
 * Uygulamadaki tüm yükleniyor/progress göstergelerinin ortak kaynağı.
 *
 * Yeni bir yükleniyor durumu eklerken aşağıdaki üç sunumdan birini seçin:
 *
 * - `SpecialProgressOverlay` — sunucuyu değiştiren işlemler; ekranı kaplar ve
 *   etkileşimi engeller (durak ekleme/silme, rota kaydetme, giriş, CSV aktarma).
 * - `SpecialProgressBlock`   — içeriğin geleceği alanı dolduran, engellemeyen
 *   gösterge (harita iskeletleri, rota geçişindeki `loading.tsx`).
 * - `SpecialProgressInline`  — kısa ve engellenmemesi gereken işlemler için
 *   küçük satır içi gösterge (adres arama).
 *
 * Ham oynatıcıya (`SpecialProgressAnimation`) yalnızca bu üçü yetmediğinde
 * doğrudan başvurun; boyut `className` ile verilir.
 */

/**
 * LottieFiles'tan indirilen animasyon buraya konur. Dosya yoksa bileşen
 * sessizce CSS tabanlı belirsiz (indeterminate) progress bar'a düşer.
 */
const ANIMATION_PATH = "/animations/special_progress_animation.json";

/** Animasyonun doğal ölçüsü 120x144 — kutular bu orana göre boyutlandırılır. */
const ASPECT_CLASS = "aspect-[5/6]";

type AnimationData = Record<string, unknown>;

// Modül seviyesi önbellek: `undefined` henüz denenmedi, `null` dosya yok.
let cachedAnimationData: AnimationData | null | undefined;
let pendingFetch: Promise<AnimationData | null> | null = null;

async function loadAnimationData(): Promise<AnimationData | null> {
  if (cachedAnimationData !== undefined) {
    return cachedAnimationData;
  }

  // `force-cache` KULLANMAYIN: animasyon dosyası eklenmeden önce tarayıcıda
  // önbelleğe düşen 404 yanıtı, dosya sonradan eklenince bile doğrulanmadan
  // kullanılır ve animasyon kalıcı olarak CSS yedeğine düşer.
  pendingFetch ??= fetch(ANIMATION_PATH)
    .then((response) => (response.ok ? response.json() : null))
    .catch(() => null)
    .then((data: AnimationData | null) => {
      cachedAnimationData = data ?? null;
      pendingFetch = null;
      return cachedAnimationData;
    });

  return pendingFetch;
}

// Yalnızca SVG renderer kullanıldığı için "light" derleme yeterli: tam derleme
// canvas renderer'ı da içerir ve modül yüklenirken canvas context'i yoklar.
let lottiePromise: Promise<
  typeof import("lottie-web/build/player/lottie_light").default
> | null = null;

function loadLottie() {
  lottiePromise ??= import("lottie-web/build/player/lottie_light").then(
    (module) => module.default,
  );
  return lottiePromise;
}

/**
 * @brief Animasyonu ve oynatıcıyı önceden indirir; böylece overlay açıldığı anda hazırdır.
 *
 * Animasyon dosyası yoksa oynatıcı hiç indirilmez — CSS yedeği kullanılacağı için gereksizdir.
 */
export async function preloadSpecialProgressAnimation() {
  const animationData = await loadAnimationData();
  if (!animationData) return;
  await loadLottie();
}

/**
 * @brief `special_progress_animation` Lottie animasyonunu oynatır; animasyon yoksa CSS progress bar gösterir.
 * @param className Dış kapsayıcıya uygulanacak ek sınıflar (boyut buradan verilir).
 */
export function SpecialProgressAnimation({
  className,
}: {
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let animation: AnimationItem | null = null;

    async function start() {
      const animationData = await loadAnimationData();
      if (cancelled || !animationData) return;

      const lottie = await loadLottie();
      if (cancelled || !containerRef.current) return;

      animation = lottie.loadAnimation({
        container: containerRef.current,
        renderer: "svg",
        loop: true,
        autoplay: true,
        animationData,
      });
      setIsPlaying(true);
    }

    void start();

    return () => {
      cancelled = true;
      animation?.destroy();
    };
  }, []);

  return (
    <div
      className={cn("relative flex items-center justify-center", className)}
      role="presentation"
    >
      <div aria-hidden className="h-full w-full" ref={containerRef} />
      {isPlaying ? null : (
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 px-2">
          <div className="special-progress-track" />
        </div>
      )}
    </div>
  );
}

/**
 * @brief Uzun süren bir işlem boyunca ekranı kaplayan, animasyonlu progress göstergesi.
 * @param open Overlay'in görünür olup olmadığı.
 * @param title Animasyonun altında gösterilecek ana metin.
 * @param description İsteğe bağlı açıklama satırı.
 */
export function SpecialProgressOverlay({
  open,
  title,
  description,
}: {
  open: boolean;
  title: string;
  description?: string;
}) {
  // Kullanıcı kaydete bastığında animasyon hazır olsun diye sayfa açılışında indirilir.
  useEffect(() => {
    void preloadSpecialProgressAnimation();
  }, []);

  // Overlay açıkken arka plan kaydırması kilitlenir.
  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <div
      aria-busy
      aria-live="polite"
      className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/40 p-6 backdrop-blur-sm"
      role="status"
    >
      <div className="w-full max-w-xs rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-2xl">
        <SpecialProgressAnimation className={cn("mx-auto w-24", ASPECT_CLASS)} />
        <p className="mt-4 text-sm font-semibold text-slate-950">{title}</p>
        {description ? (
          <p className="mt-1 text-xs text-slate-500">{description}</p>
        ) : null}
      </div>
    </div>
  );
}

/**
 * @brief Bir kapsayıcıyı dolduran yükleniyor göstergesi (harita iskeletleri, rota geçişleri).
 *
 * Engellemez; yalnızca içeriğin geleceği alanı tutar.
 *
 * @param label Animasyonun altında gösterilecek metin.
 * @param className Kapsayıcıya uygulanacak ek sınıflar.
 */
export function SpecialProgressBlock({
  label,
  className,
}: {
  label?: string;
  className?: string;
}) {
  // Rota geçişlerinde de aynı animasyon görünsün diye erkenden indirilir.
  useEffect(() => {
    void preloadSpecialProgressAnimation();
  }, []);

  return (
    <div
      aria-busy
      aria-live="polite"
      className={cn(
        "flex h-full w-full flex-col items-center justify-center gap-3 bg-slate-50",
        className,
      )}
      role="status"
    >
      <SpecialProgressAnimation className={cn("w-20", ASPECT_CLASS)} />
      {label ? <p className="text-sm text-slate-500">{label}</p> : null}
    </div>
  );
}

/**
 * @brief Satır içi, engellemeyen küçük yükleniyor göstergesi (adres arama gibi kısa işlemler).
 * @param label Animasyonun yanında gösterilecek metin.
 * @param className Kapsayıcıya uygulanacak ek sınıflar.
 */
export function SpecialProgressInline({
  label,
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      aria-busy
      aria-live="polite"
      className={cn("flex items-center gap-2 text-sm text-slate-500", className)}
      role="status"
    >
      <SpecialProgressAnimation className={cn("w-6 shrink-0", ASPECT_CLASS)} />
      {label ? <span>{label}</span> : null}
    </div>
  );
}
