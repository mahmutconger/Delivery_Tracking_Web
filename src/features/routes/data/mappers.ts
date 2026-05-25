import type { DocumentData } from "firebase-admin/firestore";

import type { DailyRoute } from "@/features/routes/domain/models";
import type { DeliveryStop } from "@/features/stops/domain/models";

function toIsoString(value: unknown) {
  if (!value) return null;

  if (typeof value === "string") return value;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object" && value && "toDate" in value) {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }

  return null;
}

export function mapRouteDocument(id: string, data: DocumentData): DailyRoute {
  return {
    id,
    driverId: data.driverId ? String(data.driverId) : null,
    routeDate: String(data.routeDate ?? ""),
    status: String(data.status ?? "draft"),
    routeName: String(data.routeName ?? ""),
    encodedPolyline: data.encodedPolyline ? String(data.encodedPolyline) : null,
    bounds: data.bounds
      ? {
          north: Number(data.bounds.north),
          south: Number(data.bounds.south),
          east: Number(data.bounds.east),
          west: Number(data.bounds.west),
        }
      : null,
    stopCount: Number(data.stopCount ?? 0),
  };
}

export function mapStopDocument(
  routeId: string,
  id: string,
  data: DocumentData,
): DeliveryStop {
  return {
    id,
    routeId,
    sequence: Number(data.sequence ?? 0),
    customerName: String(data.customerName ?? ""),
    address: String(data.address ?? ""),
    latitude: Number(data.latitude ?? 0),
    longitude: Number(data.longitude ?? 0),
    status: String(data.status ?? "pending"),
    deliveredAt: toIsoString(data.deliveredAt),
    proofImagePath: data.proofImagePath ? String(data.proofImagePath) : null,
    proofUploadState: String(data.proofUploadState ?? "none"),
  };
}
