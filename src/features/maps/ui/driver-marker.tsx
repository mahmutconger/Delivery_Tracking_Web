"use client";

import { memo } from "react";
import { Marker, Popup } from "react-leaflet";

import { createPinIcon } from "@/features/maps/ui/map-icon";
import { getRelativeTime } from "@/core/utils/date";
import type { DriverMarkerData } from "@/features/maps/application/use-driver-markers";

interface DriverMarkerProps {
  marker: DriverMarkerData;
  displayName?: string;
}

function DriverMarkerInner({ marker, displayName }: DriverMarkerProps) {
  const icon = createPinIcon(marker.isStale ? "#94a3b8" : "#0f172a");

  return (
    <Marker
      key={marker.driverId}
      position={[marker.latitude, marker.longitude]}
      icon={icon}
    >
      <Popup>
        <div className="space-y-1 text-sm">
          <strong>{displayName ?? marker.driverId}</strong>
          {marker.speedKmh !== null && (
            <p>{marker.speedKmh} km/sa</p>
          )}
          <p className="text-slate-500">
            {getRelativeTime(marker.recordedAtMillis)}
          </p>
          {marker.isStale && (
            <p className="text-amber-600">Konum bayat (&gt;15 dk)</p>
          )}
        </div>
      </Popup>
    </Marker>
  );
}

/**
 * Custom equality: only re-render if coordinates, speed, or staleness changed.
 * driverId and displayName are stable identifiers — skipping them as change
 * signals avoids unnecessary re-renders when only unrelated state updates.
 */
function areEqual(prev: DriverMarkerProps, next: DriverMarkerProps) {
  return (
    prev.marker.latitude === next.marker.latitude &&
    prev.marker.longitude === next.marker.longitude &&
    prev.marker.speedKmh === next.marker.speedKmh &&
    prev.marker.isStale === next.marker.isStale &&
    prev.displayName === next.displayName
  );
}

export const DriverMarker = memo(DriverMarkerInner, areEqual);
