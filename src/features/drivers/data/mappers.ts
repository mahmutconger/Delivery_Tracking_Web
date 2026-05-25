import type { DocumentData } from "firebase-admin/firestore";

import type { Driver, DriverLocation } from "@/features/drivers/domain/models";

function toIsoString(value: unknown) {
  if (!value) return null;

  if (typeof value === "string") return value;
  if (typeof value === "number") return new Date(value).toISOString();
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object" && value && "toDate" in value) {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }

  return null;
}

export function mapDriverDocument(id: string, data: DocumentData): Driver {
  return {
    id,
    displayName: String(data.displayName ?? ""),
    email: String(data.email ?? ""),
    phoneNumber: data.phoneNumber ? String(data.phoneNumber) : null,
    active: data.active !== false,
    lastSessionAt: toIsoString(data.lastSessionAt),
  };
}

export function mapDriverLocationDocument(
  id: string,
  data: DocumentData,
): DriverLocation {
  return {
    driverId: id,
    latitude: Number(data.latitude ?? 0),
    longitude: Number(data.longitude ?? 0),
    accuracyMeters:
      data.accuracyMeters === undefined ? null : Number(data.accuracyMeters),
    speedMetersPerSecond:
      data.speedMetersPerSecond === undefined
        ? null
        : Number(data.speedMetersPerSecond),
    recordedAtMillis: Number(data.recordedAtMillis ?? 0),
  };
}
