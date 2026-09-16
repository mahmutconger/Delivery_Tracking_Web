import Image from "next/image";

import { cn } from "@/shared/utils/cn";

/** Marka logosu; `public/` altından servis edilir. */
const LOGO_SRC = "/tracking_logo1.svg";

/**
 * @brief Uygulamanın marka logosu.
 *
 * Logo dosyasının kendi opak beyaz zemini vardır; bu yüzden koyu yüzeylerde de
 * okunabilmesi için her zaman beyaz, yuvarlatılmış bir kutu içinde gösterilir.
 * Yanında her zaman metin bulunduğundan dekoratif kabul edilir (`alt=""`).
 *
 * @param className Kutunun boyutunu ve ek stillerini verir (varsayılan `size-10`).
 */
export function BrandLogo({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative block size-10 shrink-0 overflow-hidden rounded-xl bg-white ring-1 ring-slate-900/10",
        className,
      )}
    >
      <Image
        alt=""
        aria-hidden
        className="object-contain"
        fill
        priority
        sizes="96px"
        src={LOGO_SRC}
      />
    </span>
  );
}
