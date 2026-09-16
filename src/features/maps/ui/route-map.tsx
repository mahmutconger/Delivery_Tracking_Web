"use client";

import dynamic from "next/dynamic";

import type { DailyRoute } from "@/features/routes/domain/models";
import type { DeliveryStop } from "@/features/stops/domain/models";
import { SpecialProgressBlock } from "@/shared/components/special-progress";

/**
 * Leaflet modül değerlendirmesi sırasında `window`a eriştiği için harita yalnızca
 * istemcide yüklenir. Aksi halde sunucu render'ı "window is not defined" ile
 * patlar ve React tüm sayfayı client-only render'a düşürür.
 */
const RouteMapView = dynamic(
  () => import("@/features/maps/ui/route-map-view").then((m) => m.RouteMapView),
  {
    ssr: false,
    loading: () => (
      <div className="h-[420px] overflow-hidden rounded-3xl border border-slate-200 shadow-sm">
        <SpecialProgressBlock label="Harita yükleniyor…" />
      </div>
    ),
  },
);

/**
 * @brief Rota geometrisini ve duraklarını gösteren harita.
 * @param route Rota kaydı (polyline ve sınırlar için).
 * @param stops Haritada işaretlenecek duraklar.
 * @param tileUrl Leaflet tile şablon adresi.
 * @param attribution Harita altında gösterilecek atıf metni.
 */
export function RouteMap(props: {
  route: DailyRoute;
  stops: DeliveryStop[];
  tileUrl: string;
  attribution: string;
}) {
  return <RouteMapView {...props} />;
}
