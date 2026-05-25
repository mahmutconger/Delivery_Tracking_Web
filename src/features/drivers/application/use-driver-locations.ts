"use client";

import { collection, onSnapshot } from "firebase/firestore";
import { useEffect, useRef, useState } from "react";

import { isFirebaseClientConfigured } from "@/core/env/public";
import { isLocationStale } from "@/core/utils/geo";
import type { DriverLocation } from "@/features/drivers/domain/models";
import { getClientDb } from "@/lib/firebase/client";

export type DriverLocationMap = Map<string, DriverLocation>;

export interface UseDriverLocationsResult {
  locations: DriverLocationMap;
  freshCount: number;
  staleCount: number;
  error: string | null;
  isListening: boolean;
}

/**
 * Subscribes to the entire "drivers_location" collection with a single
 * onSnapshot listener and returns a stable Map<driverId, DriverLocation>.
 *
 * Only the Map reference changes when at least one location document
 * changes — components that useMemo off this Map will only recompute when
 * the Map itself is replaced.
 *
 * The listener is created on mount when `enabled` is true and torn down
 * when `enabled` becomes false or the component unmounts.
 */
export function useDriverLocations(
  enabled: boolean,
): UseDriverLocationsResult {
  const [locations, setLocations] = useState<DriverLocationMap>(new Map());
  const [error, setError] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);

  // Keep a stable ref to the latest Map so we can mutate individual entries
  // without triggering a full re-render for unchanged drivers.
  const locationsRef = useRef<DriverLocationMap>(new Map());

  useEffect(() => {
    if (!enabled) {
      setIsListening(false);
      return;
    }

    if (!isFirebaseClientConfigured()) {
      setError("Firebase istemci yapılandırması eksik.");
      return;
    }

    setError(null);
    setIsListening(true);

    const unsubscribe = onSnapshot(
      collection(getClientDb(), "drivers_location"),
      (snapshot) => {
        // Build a new Map so consumers get referential change signal.
        // We copy unchanged entries from the previous Map to avoid
        // re-allocating DriverLocation objects that haven't changed.
        const next = new Map<string, DriverLocation>(locationsRef.current);

        snapshot.docChanges().forEach((change) => {
          if (change.type === "removed") {
            next.delete(change.doc.id);
            return;
          }

          const data = change.doc.data();
          next.set(change.doc.id, {
            driverId: change.doc.id,
            latitude: Number(data.latitude ?? 0),
            longitude: Number(data.longitude ?? 0),
            accuracyMeters:
              data.accuracyMeters === undefined
                ? null
                : Number(data.accuracyMeters),
            speedMetersPerSecond:
              data.speedMetersPerSecond === undefined
                ? null
                : Number(data.speedMetersPerSecond),
            recordedAtMillis: Number(data.recordedAtMillis ?? 0),
          });
        });

        locationsRef.current = next;
        setLocations(next);
      },
      (firestoreError) => {
        setError(firestoreError.message);
        setIsListening(false);
      },
    );

    return () => {
      unsubscribe();
      setIsListening(false);
    };
  }, [enabled]);

  const freshCount = [...locations.values()].filter(
    (loc) => !isLocationStale(loc.recordedAtMillis),
  ).length;

  const staleCount = locations.size - freshCount;

  return { locations, freshCount, staleCount, error, isListening };
}
