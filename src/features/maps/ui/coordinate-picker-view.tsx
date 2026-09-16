"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { createPinIcon } from "@/features/maps/ui/map-icon";

const defaultCenter: [number, number] = [41.0082, 28.9784];
const defaultFocusZoom = 16;

/**
 * Haritanın belirli bir konuma uçmasını tetikleyen istek. `token` her yeni
 * istekte artırılır; böylece aynı koordinata tekrar odaklanmak da mümkün olur.
 */
export interface CoordinateFocus {
  latitude: number;
  longitude: number;
  zoom?: number;
  token: number;
}

function PickLayer({
  value,
  onChange,
}: {
  value: { latitude: number; longitude: number };
  onChange: (value: { latitude: number; longitude: number }) => void;
}) {
  useMapEvents({
    click(event) {
      onChange({
        latitude: Number(event.latlng.lat.toFixed(6)),
        longitude: Number(event.latlng.lng.toFixed(6)),
      });
    },
  });

  return <Marker icon={createPinIcon()} position={[value.latitude, value.longitude]} />;
}

function FocusLayer({ focus }: { focus?: CoordinateFocus | null }) {
  const map = useMap();
  const lastTokenRef = useRef<number | null>(null);

  useEffect(() => {
    if (!focus || focus.token === lastTokenRef.current) return;
    if (!Number.isFinite(focus.latitude) || !Number.isFinite(focus.longitude)) return;

    lastTokenRef.current = focus.token;
    map.flyTo([focus.latitude, focus.longitude], focus.zoom ?? defaultFocusZoom, {
      duration: 0.8,
    });
  }, [focus, map]);

  return null;
}

/**
 * @brief Haritadan tıklayarak koordinat seçilmesini sağlar; `focus` verildiğinde o konuma yaklaşır.
 * @param value Seçili koordinat; pinin konumunu belirler.
 * @param onChange Haritaya tıklandığında yeni koordinatla çağrılır.
 * @param tileUrl Leaflet tile şablon adresi.
 * @param attribution Harita altında gösterilecek atıf metni.
 * @param focus İsteğe bağlı odaklanma isteği (örn. adres arama sonucu seçildiğinde).
 */
export function CoordinatePickerView({
  value,
  onChange,
  tileUrl,
  attribution,
  focus,
}: {
  value: { latitude: number; longitude: number };
  onChange: (value: { latitude: number; longitude: number }) => void;
  tileUrl: string;
  attribution: string;
  focus?: CoordinateFocus | null;
}) {
  const position =
    Number.isFinite(value.latitude) && Number.isFinite(value.longitude)
      ? ([value.latitude, value.longitude] as [number, number])
      : defaultCenter;

  return (
    <div className="h-64 overflow-hidden rounded-2xl border border-slate-200">
      <MapContainer center={position} zoom={12} className="h-full w-full">
        <TileLayer attribution={attribution} url={tileUrl} />
        <PickLayer value={value} onChange={onChange} />
        <FocusLayer focus={focus} />
      </MapContainer>
    </div>
  );
}
