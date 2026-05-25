"use client";

import { useMemo } from "react";

import type { DriverLocationMap } from "@/features/drivers/application/use-driver-locations";
import { isLocationStale } from "@/core/utils/geo";

export interface DriverMarkerData {
  driverId: string;
  latitude: number;
  longitude: number;
  speedKmh: number | null;
  isStale: boolean;
  recordedAtMillis: number;
}

/**
 * Derives a stable DriverMarkerData[] from a DriverLocationMap.
 *
 * The computation only re-runs when the Map reference changes (i.e. when
 * at least one location document was updated by useDriverLocations).
 * Components that receive this array as a prop will not re-render unless
 * the array reference itself is new.
 */
export function useDriverMarkers(
  locations: DriverLocationMap,
): DriverMarkerData[] {
  return useMemo(() => {
    return [...locations.values()].map((loc) => ({
      driverId: loc.driverId,
      latitude: loc.latitude,
      longitude: loc.longitude,
      // Convert m/s → km/h at the boundary so map components work in km/h
      speedKmh:
        loc.speedMetersPerSecond !== null && loc.speedMetersPerSecond !== undefined
          ? Math.round(loc.speedMetersPerSecond * 3.6)
          : null,
      isStale: isLocationStale(loc.recordedAtMillis),
      recordedAtMillis: loc.recordedAtMillis,
    }));
  }, [locations]);
}
