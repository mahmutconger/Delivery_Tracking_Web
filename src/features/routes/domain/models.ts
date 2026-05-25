import type { RouteBounds } from "@/core/utils/geo";

export const ROUTE_STATUSES = [
  "draft",
  "assigned",
  "in_progress",
  "completed",
  "cancelled",
] as const;

export type RouteStatus = (typeof ROUTE_STATUSES)[number];

export interface DailyRoute {
  id: string;
  driverId: string | null;
  routeDate: string;
  status: RouteStatus | string;
  routeName: string;
  encodedPolyline?: string | null;
  bounds?: RouteBounds | null;
  stopCount: number;
}

export function canTransitionRouteStatus(
  currentStatus: string,
  nextStatus: string,
) {
  const transitions: Record<string, string[]> = {
    draft: ["draft", "assigned", "cancelled"],
    assigned: ["assigned", "in_progress", "cancelled"],
    in_progress: ["in_progress", "completed", "cancelled"],
    completed: ["completed"],
    cancelled: ["cancelled"],
  };

  return transitions[currentStatus]?.includes(nextStatus) ?? false;
}
