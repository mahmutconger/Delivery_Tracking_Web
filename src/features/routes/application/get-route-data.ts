import { toFirestoreReadinessError } from "@/core/errors/app-error";
import {
  readyState,
  setupRequiredState,
  type ServerReadState,
} from "@/core/types/server-read-state";
import { FirestoreDriverRepository } from "@/features/drivers/data/firestore-driver-repository";
import { FirestoreRouteRepository } from "@/features/routes/data/firestore-route-repository";
import { toRouteDate } from "@/core/utils/date";
import type { RouteStatus } from "@/features/routes/domain/models";

const routeRepository = new FirestoreRouteRepository();
const driverRepository = new FirestoreDriverRepository();

export interface RoutesOverviewData {
  routeDate: string;
  drivers: Awaited<ReturnType<FirestoreDriverRepository["listDrivers"]>>;
  routes: Array<
    Awaited<ReturnType<FirestoreRouteRepository["listRoutesByDate"]>>[number] & {
      driverName: string;
    }
  >;
}

export async function getRoutesOverview(options?: {
  routeDate?: string;
  status?: string;
  driverId?: string;
}): Promise<ServerReadState<RoutesOverviewData>> {
  const routeDate = options?.routeDate ?? toRouteDate(new Date());

  try {
    const [routes, drivers] = await Promise.all([
      routeRepository.listRoutesByDate(routeDate, {
        status: options?.status,
        driverId: options?.driverId,
      }),
      driverRepository.listDrivers(),
    ]);

    const driverMap = new Map(drivers.map((driver) => [driver.id, driver]));

    return readyState({
      routeDate,
      drivers,
      routes: routes.map((route) => ({
        ...route,
        driverName: route.driverId
          ? driverMap.get(route.driverId)?.displayName ?? "Unknown"
          : "Unassigned",
      })),
    });
  } catch (error) {
    const readinessError = toFirestoreReadinessError(error);
    if (readinessError) {
      return setupRequiredState(readinessError.message, {
        routeDate,
        drivers: [],
        routes: [],
      });
    }

    throw error;
  }
}

export async function getRouteDetail(
  routeId: string,
): Promise<
  ServerReadState<
    | (Awaited<ReturnType<FirestoreRouteRepository["getRouteWithStops"]>> & {
        drivers: Awaited<ReturnType<FirestoreDriverRepository["listDrivers"]>>;
      })
    | null
  >
> {
  try {
    const [routeWithStops, drivers] = await Promise.all([
      routeRepository.getRouteWithStops(routeId),
      driverRepository.listDrivers(),
    ]);

    if (!routeWithStops) {
      return readyState(null);
    }

    return readyState({
      ...routeWithStops,
      drivers,
    });
  } catch (error) {
    const readinessError = toFirestoreReadinessError(error);
    if (readinessError) {
      return setupRequiredState(readinessError.message, null);
    }

    throw error;
  }
}

export async function createRoute(input: {
  routeName: string;
  routeDate: string;
  driverId?: string | null;
  status: RouteStatus;
  encodedPolyline?: string | null;
  bounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  } | null;
}) {
  return routeRepository.createRoute(input);
}

export async function updateRoute(
  routeId: string,
  input: {
    routeName?: string;
    routeDate?: string;
    driverId?: string | null;
    status?: RouteStatus;
    encodedPolyline?: string | null;
    bounds?: {
      north: number;
      south: number;
      east: number;
      west: number;
    } | null;
  },
) {
  return routeRepository.updateRoute(routeId, input);
}

export async function assignRoute(routeId: string, driverId: string | null) {
  return routeRepository.assignRoute(routeId, driverId);
}

export async function createStop(
  routeId: string,
  input: {
    sequence?: number;
    customerName: string;
    address: string;
    latitude: number;
    longitude: number;
    status: string;
    deliveredAt?: string | null;
    proofImagePath?: string | null;
    proofUploadState: string;
  },
) {
  return routeRepository.createStop(routeId, input);
}

export async function updateStop(
  routeId: string,
  stopId: string,
  input: {
    customerName?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    status?: string;
    deliveredAt?: string | null;
    proofImagePath?: string | null;
    proofUploadState?: string;
  },
) {
  return routeRepository.updateStop(routeId, stopId, input);
}

export async function deleteStop(routeId: string, stopId: string) {
  return routeRepository.deleteStop(routeId, stopId);
}

export async function reorderStops(routeId: string, stopIds: string[]) {
  return routeRepository.reorderStops(routeId, stopIds);
}

export async function getStopProofUrl(routeId: string, stopId: string) {
  return routeRepository.getStopProofUrl(routeId, stopId);
}
