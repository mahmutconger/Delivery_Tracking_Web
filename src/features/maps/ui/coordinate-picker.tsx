"use client";

import "leaflet/dist/leaflet.css";
import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";
import { createPinIcon } from "@/features/maps/ui/map-icon";

const defaultCenter: [number, number] = [41.0082, 28.9784];

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

export function CoordinatePicker({
  value,
  onChange,
  tileUrl,
  attribution,
}: {
  value: { latitude: number; longitude: number };
  onChange: (value: { latitude: number; longitude: number }) => void;
  tileUrl: string;
  attribution: string;
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
      </MapContainer>
    </div>
  );
}
