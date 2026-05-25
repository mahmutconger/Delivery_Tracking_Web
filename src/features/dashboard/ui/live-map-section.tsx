"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";
import { MapContainer, TileLayer } from "react-leaflet";

import { useLiveMode } from "@/core/context/live-mode-context";
import { useDriverLocations } from "@/features/drivers/application/use-driver-locations";
import { useDriverMarkers } from "@/features/maps/application/use-driver-markers";
import { DriverMarker } from "@/features/maps/ui/driver-marker";

const DEFAULT_CENTER: [number, number] = [41.0082, 28.9784];

export function LiveMapSection() {
  const { enabled, toggle } = useLiveMode();
  const { locations, freshCount, staleCount, error, isListening } =
    useDriverLocations(enabled);
  const markers = useDriverMarkers(locations);

  // Avoid SSR — Leaflet accesses window at mount time
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <h3 className="text-sm font-semibold text-slate-950">
            Canlı Sürücü Takibi
          </h3>
          {enabled && isListening && (
            <p className="text-xs text-slate-500">
              {freshCount} aktif · {staleCount} güncel değil
            </p>
          )}
          {enabled && !isListening && (
            <p className="text-xs text-slate-400">Bağlanıyor…</p>
          )}
        </div>

        <button
          onClick={toggle}
          className={`rounded-full px-4 py-1.5 text-xs font-medium transition ${
            enabled
              ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          {enabled ? "● Canlı" : "Canlıyı Başlat"}
        </button>
      </div>

      {error && (
        <p className="rounded-xl bg-rose-50 px-4 py-2 text-xs text-rose-600">
          {error}
        </p>
      )}

      <div
        className="overflow-hidden rounded-2xl border border-slate-200"
        style={{ height: 380 }}
      >
        {mounted ? (
          <MapContainer
            center={DEFAULT_CENTER}
            zoom={10}
            style={{ height: "100%", width: "100%" }}
            scrollWheelZoom={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {markers.map((marker) => (
              <DriverMarker key={marker.driverId} marker={marker} />
            ))}
          </MapContainer>
        ) : (
          <div className="h-full animate-pulse rounded-2xl bg-slate-100" />
        )}
      </div>

      {!enabled && (
        <p className="text-center text-xs text-slate-400">
          Firestore dinleyicileri kapalı — "Canlıyı Başlat" ile etkinleştirin.
        </p>
      )}

      {enabled && isListening && markers.length === 0 && (
        <p className="text-center text-xs text-slate-400">
          Şu an aktif konum bildiren sürücü yok.
        </p>
      )}
    </div>
  );
}
