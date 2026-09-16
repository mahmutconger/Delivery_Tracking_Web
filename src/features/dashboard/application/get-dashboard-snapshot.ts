import {
  toFirestoreReadinessError,
} from "@/core/errors/app-error";
import {
  readyState,
  setupRequiredState,
  type ServerReadState,
} from "@/core/types/server-read-state";
import { isLocationStale } from "@/core/utils/geo";
import { FirestoreDriverRepository } from "@/features/drivers/data/firestore-driver-repository";
import { FirestoreRouteRepository } from "@/features/routes/data/firestore-route-repository";
import { toRouteDate } from "@/core/utils/date";

/**
 * @brief Canlı haritadaki bir işaretçiyi kime ait olduğunu gösterecek kadar zenginleştiren sürücü künyesi.
 *
 * Konumun kendisi istemcideki Firestore dinleyicisinden gelir; kimlik bilgileri
 * ise Admin SDK ile sunucuda okunur. Böylece isim/telefon göstermek için
 * istemciye ek bir koleksiyon okuma izni vermek gerekmez.
 */
export interface LiveDriverProfile {
  id: string;
  displayName: string;
  email: string;
  phoneNumber: string | null;
  active: boolean;
  assignedRouteId: string | null;
  assignedRouteName: string | null;
}

export interface DashboardSnapshot {
  routeCount: number;
  statusCounts: Record<string, number>;
  deliveredStops: number;
  pendingStops: number;
  inProgressStops: number;
  failedProofUploads: number;
  staleDrivers: number;
  drivers: LiveDriverProfile[];
}

const driverRepository = new FirestoreDriverRepository();
const routeRepository = new FirestoreRouteRepository();

export const emptyDashboardSnapshot: DashboardSnapshot = {
  routeCount: 0,
  statusCounts: {},
  deliveredStops: 0,
  pendingStops: 0,
  inProgressStops: 0,
  failedProofUploads: 0,
  staleDrivers: 0,
  drivers: [],
};

export async function getDashboardSnapshot(
  routeDate = toRouteDate(new Date()),
): Promise<ServerReadState<DashboardSnapshot>> {
  try {
    const [routes, locations, drivers] = await Promise.all([
      routeRepository.listRoutesByDate(routeDate),
      driverRepository.listDriverLocations(),
      driverRepository.listDrivers(),
    ]);

    const stopsByRouteId = await routeRepository.listStopsForRoutes(
      routes.map((route) => route.id),
    );

    const statusCounts = routes.reduce<Record<string, number>>((accumulator, route) => {
      accumulator[route.status] = (accumulator[route.status] ?? 0) + 1;
      return accumulator;
    }, {});

    let deliveredStops = 0;
    let pendingStops = 0;
    let inProgressStops = 0;
    let failedProofUploads = 0;

    stopsByRouteId.forEach((stops) => {
      stops.forEach((stop) => {
        if (stop.status === "delivered") deliveredStops += 1;
        if (stop.status === "pending") pendingStops += 1;
        if (stop.status === "in_progress") inProgressStops += 1;
        if (stop.proofUploadState === "failed") failedProofUploads += 1;
      });
    });

    // Sürücünün bugün hangi rotaya bakması gerektiği harita balonunda gösterilir.
    const routeByDriverId = new Map(
      routes
        .filter((route) => route.driverId)
        .map((route) => [route.driverId as string, route]),
    );

    return readyState({
      routeCount: routes.length,
      drivers: drivers.map<LiveDriverProfile>((driver) => {
        const assignedRoute = routeByDriverId.get(driver.id) ?? null;

        return {
          id: driver.id,
          displayName: driver.displayName,
          email: driver.email,
          phoneNumber: driver.phoneNumber,
          active: driver.active,
          assignedRouteId: assignedRoute?.id ?? null,
          assignedRouteName: assignedRoute?.routeName ?? null,
        };
      }),
      statusCounts,
      deliveredStops,
      pendingStops,
      inProgressStops,
      failedProofUploads,
      staleDrivers: locations.filter((location) =>
        isLocationStale(location.recordedAtMillis),
      ).length,
    });
  } catch (error) {
    const readinessError = toFirestoreReadinessError(error);
    if (readinessError) {
      return setupRequiredState(readinessError.message, emptyDashboardSnapshot);
    }

    throw error;
  }
}
