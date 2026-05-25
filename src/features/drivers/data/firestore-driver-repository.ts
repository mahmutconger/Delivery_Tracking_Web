import { FieldValue } from "firebase-admin/firestore";

import {
  AppError,
  toFirestoreReadinessError,
} from "@/core/errors/app-error";
import { getAdminDb, isAdminAvailable } from "@/lib/firebase/admin";
import {
  mapDriverDocument,
  mapDriverLocationDocument,
} from "@/features/drivers/data/mappers";
import type {
  Driver,
  DriverLocation,
  DriverListItem,
} from "@/features/drivers/domain/models";

export class FirestoreDriverRepository {
  private normalizeReadError(error: unknown): never {
    const readinessError = toFirestoreReadinessError(error);
    throw readinessError ?? error;
  }

  async listDrivers() {
    if (!isAdminAvailable()) {
      return [] as Driver[];
    }

    try {
      const snapshot = await getAdminDb()
        .collection("drivers")
        .orderBy("displayName")
        .get();

      return snapshot.docs.map((document) =>
        mapDriverDocument(document.id, document.data()),
      );
    } catch (error) {
      this.normalizeReadError(error);
    }
  }

  async getDriverById(driverId: string) {
    if (!isAdminAvailable()) {
      return null;
    }

    try {
      const snapshot = await getAdminDb().collection("drivers").doc(driverId).get();
      return snapshot.exists
        ? mapDriverDocument(snapshot.id, snapshot.data()!)
        : null;
    } catch (error) {
      this.normalizeReadError(error);
    }
  }

  async listDriverLocations() {
    if (!isAdminAvailable()) {
      return [] as DriverLocation[];
    }

    try {
      const snapshot = await getAdminDb().collection("drivers_location").get();
      return snapshot.docs.map((document) =>
        mapDriverLocationDocument(document.id, document.data()),
      );
    } catch (error) {
      this.normalizeReadError(error);
    }
  }

  async getDriverLocation(driverId: string) {
    if (!isAdminAvailable()) {
      return null;
    }

    try {
      const snapshot = await getAdminDb()
        .collection("drivers_location")
        .doc(driverId)
        .get();

      return snapshot.exists
        ? mapDriverLocationDocument(snapshot.id, snapshot.data()!)
        : null;
    } catch (error) {
      this.normalizeReadError(error);
    }
  }

  async buildDriverListItems(
    assignedRouteIdsByDriver: Map<string, string>,
    drivers: Driver[],
    locations: DriverLocation[],
  ) {
    const locationMap = new Map(locations.map((location) => [location.driverId, location]));

    return drivers.map<DriverListItem>((driver) => ({
      ...driver,
      assigned: assignedRouteIdsByDriver.has(driver.id),
      assignedRouteId: assignedRouteIdsByDriver.get(driver.id) ?? null,
      location: locationMap.get(driver.id) ?? null,
    }));
  }

  async setDriverActive(driverId: string, active: boolean) {
    if (!isAdminAvailable()) {
      throw new AppError({
        message: "Firebase Admin is not configured.",
        statusCode: 500,
      });
    }

    await getAdminDb().collection("drivers").doc(driverId).set(
      {
        active,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  }

  async updateDriverPhone(driverId: string, phoneNumber: string | null) {
    if (!isAdminAvailable()) {
      throw new AppError({
        message: "Firebase Admin is not configured.",
        statusCode: 500,
      });
    }

    await getAdminDb().collection("drivers").doc(driverId).set(
      {
        phoneNumber: phoneNumber ?? FieldValue.delete(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  }
}
