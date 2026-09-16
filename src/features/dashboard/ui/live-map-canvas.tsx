"use client";

import "leaflet/dist/leaflet.css";
import { latLngBounds } from "leaflet";
import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";

import { DriverMarker } from "@/features/maps/ui/driver-marker";
import type { DriverMarkerData } from "@/features/maps/application/use-driver-markers";

const DEFAULT_CENTER: [number, number] = [41.0082, 28.9784];
const SELECTED_ZOOM = 15;

/**
 * @brief Haritayı işaretçilere göre konumlandırır.
 *
 * İlk sürücüler geldiğinde tümünü kapsayacak şekilde bir kez sığdırır; sonrasında
 * yalnızca kullanıcı bir sürücü seçtiğinde o sürücüye uçar. Böylece her konum
 * güncellemesinde harita kullanıcının altından kaymaz.
 */
function MapViewController({
  markers,
  selectedDriverId,
}: {
  markers: DriverMarkerData[];
  selectedDriverId: string | null;
}) {
  const map = useMap();
  const hasFittedRef = useRef(false);

  useEffect(() => {
    if (hasFittedRef.current || markers.length === 0) return;

    hasFittedRef.current = true;

    if (markers.length === 1) {
      map.setView([markers[0].latitude, markers[0].longitude], 13);
      return;
    }

    map.fitBounds(
      latLngBounds(markers.map((marker) => [marker.latitude, marker.longitude])),
      { padding: [48, 48] },
    );
  }, [map, markers]);

  const selected = selectedDriverId
    ? markers.find((marker) => marker.driverId === selectedDriverId) ?? null
    : null;
  const selectedLatitude = selected?.latitude ?? null;
  const selectedLongitude = selected?.longitude ?? null;

  // Yalnızca seçili sürücünün kendi koordinatı değiştiğinde uçulur; başka bir
  // sürücünün konum güncellemesi haritayı yerinden oynatmaz.
  useEffect(() => {
    if (selectedLatitude === null || selectedLongitude === null) return;

    map.flyTo([selectedLatitude, selectedLongitude], SELECTED_ZOOM, {
      duration: 0.6,
    });
  }, [map, selectedDriverId, selectedLatitude, selectedLongitude]);

  return null;
}

/**
 * @brief Canlı sürücü haritasının Leaflet katmanı.
 *
 * Leaflet modül değerlendirmesinde `window`a eriştiği için bu dosya yalnızca
 * istemcide yüklenir (bkz. live-map-section içindeki dinamik import).
 *
 * @param markers Haritada gösterilecek sürücü işaretçileri.
 * @param selectedDriverId Odaklanılacak sürücü; balonu açılır.
 * @param onSelectDriver Bir işaretçiye tıklandığında çağrılır.
 */
export function LiveMapCanvas({
  markers,
  selectedDriverId = null,
  onSelectDriver,
}: {
  markers: DriverMarkerData[];
  selectedDriverId?: string | null;
  onSelectDriver?: (driverId: string) => void;
}) {
  return (
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
      <MapViewController markers={markers} selectedDriverId={selectedDriverId} />
      {markers.map((marker) => (
        <DriverMarker
          key={marker.driverId}
          isSelected={marker.driverId === selectedDriverId}
          marker={marker}
          onSelect={onSelectDriver}
        />
      ))}
    </MapContainer>
  );
}
