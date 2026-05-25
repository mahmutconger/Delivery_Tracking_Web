import { toFirestoreReadinessError } from "@/core/errors/app-error";
import {
  readyState,
  setupRequiredState,
  type ServerReadState,
} from "@/core/types/server-read-state";
import { toRouteDate } from "@/core/utils/date";
import { FirestoreDriverRepository } from "@/features/drivers/data/firestore-driver-repository";
import type { DriverListItem } from "@/features/drivers/domain/models";
import { FirestoreRouteRepository } from "@/features/routes/data/firestore-route-repository";

const driverRepository = new FirestoreDriverRepository();
const routeRepository = new FirestoreRouteRepository();

export interface DriverDetailData {
  driver: NonNullable<
    Awaited<ReturnType<FirestoreDriverRepository["getDriverById"]>>
  >;
  location: Awaited<ReturnType<FirestoreDriverRepository["getDriverLocation"]>>;
  assignedRouteId: string | null;
}

export async function getDriversOverview(
  routeDate = toRouteDate(new Date()),
): Promise<ServerReadState<DriverListItem[]>> {
  try {
    const [drivers, locations, assignedRouteIdsByDriver] = await Promise.all([
      driverRepository.listDrivers(),
      driverRepository.listDriverLocations(),
      routeRepository.getAssignedRouteIdsByDriver(routeDate),
    ]);

    return readyState(
      await driverRepository.buildDriverListItems(
        assignedRouteIdsByDriver,
        drivers,
        locations,
      ),
    );
  } catch (error) {
    const readinessError = toFirestoreReadinessError(error);
    if (readinessError) {
      return setupRequiredState(readinessError.message, []);
    }

    throw error;
  }
}

export async function getDriverDetail(
  driverId: string,
  routeDate = toRouteDate(new Date()),
): Promise<ServerReadState<DriverDetailData | null>> {
  try {
    const [driver, location, assignedRouteIdsByDriver] = await Promise.all([
      driverRepository.getDriverById(driverId),
      driverRepository.getDriverLocation(driverId),
      routeRepository.getAssignedRouteIdsByDriver(routeDate),
    ]);

    if (!driver) {
      return readyState(null);
    }

    return readyState({
      driver,
      location,
      assignedRouteId: assignedRouteIdsByDriver.get(driverId) ?? null,
    });
  } catch (error) {
    const readinessError = toFirestoreReadinessError(error);
    if (readinessError) {
      return setupRequiredState(readinessError.message, null);
    }

    throw error;
  }
}

export async function setDriverActive(driverId: string, active: boolean) {
  return driverRepository.setDriverActive(driverId, active);
}

export async function updateDriverPhone(driverId: string, phoneNumber: string | null) {
  return driverRepository.updateDriverPhone(driverId, phoneNumber);
}
