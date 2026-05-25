"use client";

import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";

import { formatDateTime, getRelativeTime } from "@/core/utils/date";
import { isFirebaseClientConfigured } from "@/core/env/public";
import { isLocationStale } from "@/core/utils/geo";
import type { DriverLocation } from "@/features/drivers/domain/models";
import { getClientDb } from "@/lib/firebase/client";
import { Button } from "@/shared/components/button";
import { Card, CardTitle } from "@/shared/components/card";
import { StatusBadge } from "@/shared/components/status-badge";

export function DriverLiveLocation({
  driverId,
  initialLocation,
}: {
  driverId: string;
  initialLocation: DriverLocation | null;
}) {
  const [enabled, setEnabled] = useState(false);
  const [location, setLocation] = useState(initialLocation);
  const [listenerError, setListenerError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    if (!isFirebaseClientConfigured()) {
      return;
    }

    const unsubscribe = onSnapshot(
      doc(getClientDb(), "drivers_location", driverId),
      (snapshot) => {
        if (!snapshot.exists()) {
          setLocation(null);
          return;
        }

        const data = snapshot.data();
        setLocation({
          driverId,
          latitude: Number(data.latitude ?? 0),
          longitude: Number(data.longitude ?? 0),
          accuracyMeters:
            data.accuracyMeters === undefined ? null : Number(data.accuracyMeters),
          speedMetersPerSecond:
            data.speedMetersPerSecond === undefined
              ? null
              : Number(data.speedMetersPerSecond),
          recordedAtMillis: Number(data.recordedAtMillis ?? 0),
        });
      },
      (error) => {
        setListenerError(error.message);
        setEnabled(false);
      },
    );

    return unsubscribe;
  }, [driverId, enabled]);

  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div>
          <CardTitle>Son bilinen konum</CardTitle>
          <p className="mt-1 text-sm text-slate-600">
            Canlı mod, sayfa açıkken yalnızca bu sürücü belgesine abone olur.
          </p>
        </div>
        <Button
          variant={enabled ? "secondary" : "primary"}
          onClick={() => {
            if (!enabled && !isFirebaseClientConfigured()) {
              setListenerError(
                "Canlı konum için Firebase istemci yapılandırması eksik.",
              );
              return;
            }

            setListenerError(null);
            setEnabled((current) => !current);
          }}
          type="button"
        >
          {enabled ? "Canlı modu kapat" : "Canlı modu aç"}
        </Button>
      </div>
      <div className="mt-5 space-y-3 text-sm text-slate-700">
        <div className="flex items-center gap-3">
          <StatusBadge
            value={
              location && !isLocationStale(location.recordedAtMillis)
                ? "fresh"
                : "stale"
            }
          />
          <span>{location ? getRelativeTime(location.recordedAtMillis) : "Güncelleme yok"}</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-slate-500">Koordinatlar</p>
            <p className="mt-2 font-medium text-slate-950">
              {location
                ? `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`
                : "Bilinmiyor"}
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-slate-500">Kayıt tarihi</p>
            <p className="mt-2 font-medium text-slate-950">
              {formatDateTime(location?.recordedAtMillis)}
            </p>
          </div>
        </div>
        {listenerError ? (
          <p className="rounded-2xl bg-rose-50 px-4 py-3 text-rose-700">
            {listenerError}
          </p>
        ) : null}
      </div>
    </Card>
  );
}
