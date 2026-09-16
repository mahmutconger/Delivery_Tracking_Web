"use client";

import dynamic from "next/dynamic";

import type { CoordinateFocus } from "@/features/maps/ui/coordinate-picker-view";
import { SpecialProgressBlock } from "@/shared/components/special-progress";

export type { CoordinateFocus };

/**
 * Leaflet modül değerlendirmesi sırasında `window`a eriştiği için seçici yalnızca
 * istemcide yüklenir. Aksi halde sunucu render'ı "window is not defined" ile
 * patlar ve React tüm sayfayı client-only render'a düşürür.
 */
const CoordinatePickerView = dynamic(
  () =>
    import("@/features/maps/ui/coordinate-picker-view").then(
      (m) => m.CoordinatePickerView,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 overflow-hidden rounded-2xl border border-slate-200">
        <SpecialProgressBlock label="Harita yükleniyor…" />
      </div>
    ),
  },
);

/**
 * @brief Haritadan tıklayarak koordinat seçilmesini sağlar; `focus` verildiğinde o konuma yaklaşır.
 * @param value Seçili koordinat; pinin konumunu belirler.
 * @param onChange Haritaya tıklandığında yeni koordinatla çağrılır.
 * @param tileUrl Leaflet tile şablon adresi.
 * @param attribution Harita altında gösterilecek atıf metni.
 * @param focus İsteğe bağlı odaklanma isteği (örn. adres arama sonucu seçildiğinde).
 */
export function CoordinatePicker(props: {
  value: { latitude: number; longitude: number };
  onChange: (value: { latitude: number; longitude: number }) => void;
  tileUrl: string;
  attribution: string;
  focus?: CoordinateFocus | null;
}) {
  return <CoordinatePickerView {...props} />;
}
