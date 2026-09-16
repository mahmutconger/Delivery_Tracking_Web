"use client";

import { useMemo } from "react";

import { isLocationStale } from "@/core/utils/geo";
import type { DriverLocationMap } from "@/features/drivers/application/use-driver-locations";
import type { LiveDriverProfile } from "@/features/dashboard/application/get-dashboard-snapshot";

export interface DriverMarkerData {
  driverId: string;
  latitude: number;
  longitude: number;
  speedKmh: number | null;
  accuracyMeters: number | null;
  isStale: boolean;
  recordedAtMillis: number;
  /** Sunucudan gelen sürücü künyesi; kayıt bulunamazsa null. */
  profile: LiveDriverProfile | null;
  /** Balonda ve listede gösterilecek ad (künye yoksa ham kimlik). */
  label: string;
}

/**
 * @brief Konum Map'ini ve sürücü künyelerini haritada gösterilebilir işaretçilere dönüştürür.
 *
 * Hesaplama yalnızca Map referansı değiştiğinde (yani en az bir konum belgesi
 * güncellendiğinde) yeniden çalışır.
 *
 * @param locations useDriverLocations'tan gelen konum Map'i.
 * @param profilesById Sunucudan gelen sürücü künyeleri (id → künye).
 * @returns Ada göre sıralanmış işaretçi listesi.
 */
export function useDriverMarkers(
  locations: DriverLocationMap,
  profilesById: Map<string, LiveDriverProfile>,
): DriverMarkerData[] {
  return useMemo(() => {
    return [...locations.values()]
      .map<DriverMarkerData>((location) => {
        const profile = profilesById.get(location.driverId) ?? null;

        return {
          driverId: location.driverId,
          latitude: location.latitude,
          longitude: location.longitude,
          // m/s → km/sa dönüşümü sınırda yapılır; harita bileşenleri km/sa ile çalışır.
          speedKmh:
            location.speedMetersPerSecond !== null &&
            location.speedMetersPerSecond !== undefined
              ? Math.round(location.speedMetersPerSecond * 3.6)
              : null,
          accuracyMeters: location.accuracyMeters ?? null,
          isStale: isLocationStale(location.recordedAtMillis),
          recordedAtMillis: location.recordedAtMillis,
          profile,
          label: profile?.displayName ?? location.driverId,
        };
      })
      .sort((first, second) => first.label.localeCompare(second.label, "tr"));
  }, [locations, profilesById]);
}
