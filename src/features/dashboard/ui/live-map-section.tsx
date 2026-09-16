"use client";

import dynamic from "next/dynamic";
import { useCallback, useMemo, useState } from "react";

import { useLiveMode } from "@/core/context/live-mode-context";
import { getRelativeTime } from "@/core/utils/date";
import type { LiveDriverProfile } from "@/features/dashboard/application/get-dashboard-snapshot";
import { useDriverLocations } from "@/features/drivers/application/use-driver-locations";
import { useDriverMarkers } from "@/features/maps/application/use-driver-markers";
import { SpecialProgressBlock } from "@/shared/components/special-progress";
import { cn } from "@/shared/utils/cn";

// Leaflet modül değerlendirmesinde `window`a eriştiği için harita katmanı yalnızca
// istemcide yüklenir; aksi halde sunucu render'ı patlar ve sayfa client-only'e düşer.
const LiveMapCanvas = dynamic(
  () =>
    import("@/features/dashboard/ui/live-map-canvas").then(
      (m) => m.LiveMapCanvas,
    ),
  {
    ssr: false,
    loading: () => <SpecialProgressBlock label="Harita yükleniyor…" />,
  },
);

/**
 * @brief Panelin canlı sürücü takibi bölümü.
 *
 * Harita işaretçileri istemcideki Firestore dinleyicisinden, sürücü kimlik
 * bilgileri ise sunucudan gelen künyelerden beslenir. Yan listeden bir sürücü
 * seçildiğinde harita o sürücüye uçar ve balonu açılır.
 *
 * @param drivers Sunucuda Admin SDK ile okunan sürücü künyeleri.
 */
export function LiveMapSection({ drivers }: { drivers: LiveDriverProfile[] }) {
  const { enabled, toggle } = useLiveMode();
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);

  const { locations, freshCount, staleCount, error, isListening, isConnecting, retry } =
    useDriverLocations(enabled);

  const profilesById = useMemo(
    () => new Map(drivers.map((driver) => [driver.id, driver])),
    [drivers],
  );
  const markers = useDriverMarkers(locations, profilesById);

  const selectDriver = useCallback((driverId: string) => {
    setSelectedDriverId((current) => (current === driverId ? null : driverId));
  }, []);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-0.5">
          <h3 className="text-sm font-semibold text-slate-950">
            Canlı Sürücü Takibi
          </h3>
          {enabled && isListening ? (
            <p className="text-xs text-slate-500">
              {freshCount} aktif · {staleCount} güncel değil
            </p>
          ) : null}
          {enabled && isConnecting ? (
            <p className="text-xs text-slate-400">Bağlanıyor…</p>
          ) : null}
        </div>

        <button
          onClick={toggle}
          className={cn(
            "rounded-full px-4 py-1.5 text-xs font-medium transition",
            enabled
              ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200",
          )}
          type="button"
        >
          {enabled ? "● Canlı" : "Canlıyı Başlat"}
        </button>
      </div>

      {error ? (
        <div className="space-y-2 rounded-xl bg-rose-50 px-4 py-3 text-xs text-rose-700">
          <p className="font-medium">{error.message}</p>
          {error.hint ? <p className="text-rose-600">{error.hint}</p> : null}
          <button
            className="font-medium underline underline-offset-2"
            onClick={retry}
            type="button"
          >
            Tekrar dene
          </button>
        </div>
      ) : null}

      <div className="grid gap-3 lg:grid-cols-[1.6fr_1fr]">
        <div
          className="overflow-hidden rounded-2xl border border-slate-200"
          style={{ height: 380 }}
        >
          <LiveMapCanvas
            markers={markers}
            onSelectDriver={selectDriver}
            selectedDriverId={selectedDriverId}
          />
        </div>

        <div
          className="overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 p-2"
          style={{ height: 380 }}
        >
          {markers.length === 0 ? (
            <p className="px-2 py-3 text-xs text-slate-500">
              {enabled
                ? "Konum bildiren sürücü yok."
                : "Sürücü listesi için canlı modu başlatın."}
            </p>
          ) : (
            <ul className="space-y-1">
              {markers.map((marker) => {
                const isSelected = marker.driverId === selectedDriverId;

                return (
                  <li key={marker.driverId}>
                    <button
                      className={cn(
                        "w-full rounded-xl px-3 py-2 text-left transition",
                        isSelected
                          ? "bg-slate-900 text-white"
                          : "bg-white text-slate-700 hover:bg-slate-100",
                      )}
                      onClick={() => selectDriver(marker.driverId)}
                      type="button"
                    >
                      <span className="flex items-center gap-2">
                        <span
                          aria-hidden
                          className={cn(
                            "size-2 shrink-0 rounded-full",
                            marker.isStale ? "bg-slate-400" : "bg-emerald-500",
                          )}
                        />
                        <span className="truncate text-sm font-medium">
                          {marker.label}
                        </span>
                      </span>
                      <span
                        className={cn(
                          "mt-0.5 block truncate text-xs",
                          isSelected ? "text-slate-300" : "text-slate-500",
                        )}
                      >
                        {marker.profile?.assignedRouteName ?? "Rota atanmamış"} ·{" "}
                        {getRelativeTime(marker.recordedAtMillis)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {!enabled ? (
        <p className="text-center text-xs text-slate-400">
          Firestore dinleyicileri kapalı — “Canlıyı Başlat” ile etkinleştirin.
        </p>
      ) : null}

      {enabled && isListening && markers.length === 0 ? (
        <p className="text-center text-xs text-slate-400">
          Şu an aktif konum bildiren sürücü yok.
        </p>
      ) : null}
    </div>
  );
}
