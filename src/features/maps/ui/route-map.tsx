"use client";

import "leaflet/dist/leaflet.css";
import { memo, useMemo } from "react";
import { MapContainer, Marker, Polyline, Popup, TileLayer } from "react-leaflet";

import { createBounds } from "@/core/utils/geo";
import { createPinIcon } from "@/features/maps/ui/map-icon";
import { decodePolyline } from "@/core/utils/polyline";
import type { DailyRoute } from "@/features/routes/domain/models";
import type { DeliveryStop } from "@/features/stops/domain/models";

const fallbackCenter: [number, number] = [41.0082, 28.9784];
const stopPinIcon = createPinIcon();

interface StopMarkerProps {
  stop: DeliveryStop;
}

// Each stop marker only re-renders when its own data changes.
const StopMarker = memo(function StopMarker({ stop }: StopMarkerProps) {
  return (
    <Marker
      key={stop.id}
      icon={stopPinIcon}
      position={[stop.latitude, stop.longitude]}
    >
      <Popup>
        <div className="space-y-1">
          <strong>{stop.sequence}. {stop.customerName}</strong>
          <p>{stop.address}</p>
        </div>
      </Popup>
    </Marker>
  );
});

export function RouteMap({
  route,
  stops,
  tileUrl,
  attribution,
}: {
  route: DailyRoute;
  stops: DeliveryStop[];
  tileUrl: string;
  attribution: string;
}) {
  // O(n) polyline decode — only re-runs when the encoded string changes.
  const polyline = useMemo(
    () =>
      decodePolyline(route.encodedPolyline).map(
        ([lat, lng]) => [lat, lng] as [number, number],
      ),
    [route.encodedPolyline],
  );

  // O(n) bounds calculation — only re-runs when stops array reference changes.
  const bounds = useMemo(() => {
    if (route.bounds) return route.bounds;
    return createBounds(stops.map((s) => ({ latitude: s.latitude, longitude: s.longitude })));
  }, [route.bounds, stops]);

  const center = useMemo<[number, number]>(
    () =>
      stops.length > 0
        ? [stops[0].latitude, stops[0].longitude]
        : fallbackCenter,
    [stops],
  );

  const leafletBounds = useMemo(
    () =>
      bounds
        ? ([[bounds.south, bounds.west], [bounds.north, bounds.east]] as [
            [number, number],
            [number, number],
          ])
        : undefined,
    [bounds],
  );

  return (
    <div className="h-[420px] overflow-hidden rounded-3xl border border-slate-200 shadow-sm">
      <MapContainer
        center={center}
        zoom={12}
        scrollWheelZoom
        bounds={leafletBounds}
        className="h-full w-full"
      >
        <TileLayer attribution={attribution} url={tileUrl} />
        {polyline.length > 0 ? (
          <Polyline positions={polyline} pathOptions={{ color: "#0f172a", weight: 4 }} />
        ) : null}
        {stops.map((stop) => (
          <StopMarker key={stop.id} stop={stop} />
        ))}
      </MapContainer>
    </div>
  );
}
