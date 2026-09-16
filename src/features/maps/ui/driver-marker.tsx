"use client";

import { memo, useEffect, useRef } from "react";
import type { Marker as LeafletMarker } from "leaflet";
import { Marker, Popup } from "react-leaflet";

import { formatDateTime, getRelativeTime } from "@/core/utils/date";
import { createPinIcon } from "@/features/maps/ui/map-icon";
import type { DriverMarkerData } from "@/features/maps/application/use-driver-markers";

interface DriverMarkerProps {
  marker: DriverMarkerData;
  /** Listeden seçildiğinde balon otomatik açılır. */
  isSelected?: boolean;
  onSelect?: (driverId: string) => void;
}

function DriverMarkerInner({ marker, isSelected, onSelect }: DriverMarkerProps) {
  const markerRef = useRef<LeafletMarker | null>(null);
  const icon = createPinIcon(marker.isStale ? "#94a3b8" : "#0f172a");
  const { profile } = marker;

  // Sürücü yan listeden seçildiğinde balonu programatik olarak aç.
  useEffect(() => {
    if (isSelected) {
      markerRef.current?.openPopup();
    }
  }, [isSelected]);

  return (
    <Marker
      eventHandlers={{ click: () => onSelect?.(marker.driverId) }}
      icon={icon}
      position={[marker.latitude, marker.longitude]}
      ref={markerRef}
    >
      <Popup>
        <div className="min-w-[13rem] space-y-2 text-sm">
          <div>
            <strong className="block text-slate-950">{marker.label}</strong>
            {profile ? (
              <span className="text-xs text-slate-500">{profile.email}</span>
            ) : (
              <span className="text-xs text-amber-600">
                Bu kimlik için sürücü kaydı bulunamadı.
              </span>
            )}
          </div>

          <dl className="space-y-1 text-xs text-slate-600">
            {profile?.phoneNumber ? (
              <div className="flex justify-between gap-3">
                <dt>Telefon</dt>
                <dd>
                  <a
                    className="font-medium text-slate-900 underline underline-offset-2"
                    href={`tel:${profile.phoneNumber}`}
                  >
                    {profile.phoneNumber}
                  </a>
                </dd>
              </div>
            ) : null}

            <div className="flex justify-between gap-3">
              <dt>Bugünkü rota</dt>
              <dd className="text-right">
                {profile?.assignedRouteId ? (
                  <a
                    className="font-medium text-slate-900 underline underline-offset-2"
                    href={`/routes/${profile.assignedRouteId}`}
                  >
                    {profile.assignedRouteName ?? "Rotayı aç"}
                  </a>
                ) : (
                  "Atanmamış"
                )}
              </dd>
            </div>

            <div className="flex justify-between gap-3">
              <dt>Hız</dt>
              <dd>
                {marker.speedKmh !== null ? `${marker.speedKmh} km/sa` : "Bilinmiyor"}
              </dd>
            </div>

            {marker.accuracyMeters !== null ? (
              <div className="flex justify-between gap-3">
                <dt>Doğruluk</dt>
                <dd>±{Math.round(marker.accuracyMeters)} m</dd>
              </div>
            ) : null}

            <div className="flex justify-between gap-3">
              <dt>Son sinyal</dt>
              <dd className="text-right">
                {getRelativeTime(marker.recordedAtMillis)}
              </dd>
            </div>

            <div className="flex justify-between gap-3">
              <dt>Kayıt zamanı</dt>
              <dd className="text-right">
                {formatDateTime(marker.recordedAtMillis)}
              </dd>
            </div>

            <div className="flex justify-between gap-3">
              <dt>Koordinat</dt>
              <dd className="text-right">
                {marker.latitude.toFixed(5)}, {marker.longitude.toFixed(5)}
              </dd>
            </div>
          </dl>

          {marker.isStale ? (
            <p className="rounded-lg bg-amber-50 px-2 py-1 text-xs text-amber-700">
              Konum 15 dakikadan eski.
            </p>
          ) : null}

          {profile && !profile.active ? (
            <p className="rounded-lg bg-slate-100 px-2 py-1 text-xs text-slate-600">
              Sürücü pasif olarak işaretli.
            </p>
          ) : null}

          {profile ? (
            <a
              className="block text-xs font-medium text-slate-900 underline underline-offset-2"
              href={`/drivers/${profile.id}`}
            >
              Sürücü detayına git
            </a>
          ) : null}
        </div>
      </Popup>
    </Marker>
  );
}

/**
 * Yalnızca konum, hız, bayatlık, künye veya seçim durumu değiştiğinde yeniden render edilir.
 * driverId sabit bir kimlik olduğu için değişim sinyali olarak kullanılmaz.
 */
function areEqual(previous: DriverMarkerProps, next: DriverMarkerProps) {
  return (
    previous.marker.latitude === next.marker.latitude &&
    previous.marker.longitude === next.marker.longitude &&
    previous.marker.speedKmh === next.marker.speedKmh &&
    previous.marker.accuracyMeters === next.marker.accuracyMeters &&
    previous.marker.isStale === next.marker.isStale &&
    previous.marker.recordedAtMillis === next.marker.recordedAtMillis &&
    previous.marker.profile === next.marker.profile &&
    previous.isSelected === next.isSelected &&
    previous.onSelect === next.onSelect
  );
}

export const DriverMarker = memo(DriverMarkerInner, areEqual);
