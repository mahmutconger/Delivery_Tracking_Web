import { FieldValue } from "firebase-admin/firestore";

import {
  AppError,
  toFirestoreReadinessError,
} from "@/core/errors/app-error";
import { getAdminDb, getAdminStorage, isAdminAvailable } from "@/lib/firebase/admin";
import { mapRouteDocument, mapStopDocument } from "@/features/routes/data/mappers";
import {
  canTransitionRouteStatus,
  type DailyRoute,
  type RouteStatus,
} from "@/features/routes/domain/models";
import type { DeliveryStop } from "@/features/stops/domain/models";

interface CreateRouteInput {
  routeName: string;
  routeDate: string;
  driverId?: string | null;
  status: RouteStatus;
  encodedPolyline?: string | null;
  bounds?: DailyRoute["bounds"];
}

interface UpdateRouteInput {
  routeName?: string;
  routeDate?: string;
  driverId?: string | null;
  status?: RouteStatus;
  encodedPolyline?: string | null;
  bounds?: DailyRoute["bounds"];
}

interface CreateStopInput {
  sequence?: number;
  customerName: string;
  address: string;
  latitude: number;
  longitude: number;
  status: string;
  deliveredAt?: string | null;
  proofImagePath?: string | null;
  proofUploadState: string;
}

type UpdateStopInput = Partial<CreateStopInput>;

export class FirestoreRouteRepository {
  async listRoutesByDateRange(startDate: string, endDate: string) {
    if (!isAdminAvailable()) {
      return [] as DailyRoute[];
    }

    try {
      const snapshot = await getAdminDb()
        .collection("daily_routes")
        .where("routeDate", ">=", startDate)
        .where("routeDate", "<=", endDate)
        .get();

      return snapshot.docs
        .map((document) => mapRouteDocument(document.id, document.data()))
        .sort((a, b) => a.routeDate.localeCompare(b.routeDate));
    } catch (error) {
      this.normalizeReadError(error);
    }
  }

  private normalizeReadError(error: unknown): never {
    const readinessError = toFirestoreReadinessError(error);
    throw readinessError ?? error;
  }

  async listRoutesByDate(routeDate: string, filters?: { status?: string; driverId?: string }) {
    if (!isAdminAvailable()) {
      return [] as DailyRoute[];
    }

    try {
      let query = getAdminDb()
        .collection("daily_routes")
        .where("routeDate", "==", routeDate);

      if (filters?.status) {
        query = query.where("status", "==", filters.status);
      }

      if (filters?.driverId) {
        query = query.where("driverId", "==", filters.driverId);
      }

      const snapshot = await query.orderBy("routeName").get();
      return snapshot.docs.map((document) =>
        mapRouteDocument(document.id, document.data()),
      );
    } catch (error) {
      this.normalizeReadError(error);
    }
  }

  async getRouteById(routeId: string) {
    if (!isAdminAvailable()) {
      return null;
    }

    try {
      const snapshot = await getAdminDb()
        .collection("daily_routes")
        .doc(routeId)
        .get();
      return snapshot.exists
        ? mapRouteDocument(snapshot.id, snapshot.data()!)
        : null;
    } catch (error) {
      this.normalizeReadError(error);
    }
  }

  async getRouteWithStops(routeId: string) {
    if (!isAdminAvailable()) {
      return null;
    }

    try {
      const route = await this.getRouteById(routeId);
      if (!route) return null;

      const stopsSnapshot = await getAdminDb()
        .collection("daily_routes")
        .doc(routeId)
        .collection("stops")
        .orderBy("sequence")
        .get();

      return {
        route,
        stops: stopsSnapshot.docs.map((document) =>
          mapStopDocument(routeId, document.id, document.data()),
        ),
      };
    } catch (error) {
      this.normalizeReadError(error);
    }
  }

  async getAssignedRouteIdsByDriver(routeDate: string) {
    if (!isAdminAvailable()) {
      return new Map<string, string>();
    }

    try {
      const snapshot = await getAdminDb()
        .collection("daily_routes")
        .where("routeDate", "==", routeDate)
        .get();

      return snapshot.docs.reduce((map, document) => {
        const data = document.data();
        if (data.driverId) {
          map.set(String(data.driverId), document.id);
        }
        return map;
      }, new Map<string, string>());
    } catch (error) {
      this.normalizeReadError(error);
    }
  }

  private async assertDriverAvailability(
    transaction: FirebaseFirestore.Transaction,
    driverId: string,
    routeDate: string,
    ignoreRouteId?: string,
  ) {
    const driverSnapshot = await transaction.get(
      getAdminDb().collection("drivers").doc(driverId),
    );

    if (!driverSnapshot.exists) {
      throw new AppError({
        message: "Driver not found.",
        statusCode: 404,
        code: "DRIVER_NOT_FOUND",
      });
    }

    if (!driverSnapshot.data()?.active) {
      throw new AppError({
        message: "Inactive drivers cannot receive new assignments.",
        statusCode: 400,
        code: "DRIVER_INACTIVE",
      });
    }

    const conflictingRoutes = await transaction.get(
      getAdminDb()
        .collection("daily_routes")
        .where("driverId", "==", driverId)
        .where("routeDate", "==", routeDate),
    );

    const hasConflict = conflictingRoutes.docs.some(
      (document) => document.id !== ignoreRouteId && document.data().status !== "cancelled",
    );

    if (hasConflict) {
      throw new AppError({
        message: "A driver can only have one route per day.",
        statusCode: 400,
        code: "ROUTE_ASSIGNMENT_CONFLICT",
      });
    }
  }

  async createRoute(input: CreateRouteInput) {
    if (!isAdminAvailable()) {
      throw new AppError({
        message: "Firebase Admin is not configured.",
        statusCode: 500,
      });
    }

    const routeId = crypto.randomUUID();
    const routeRef = getAdminDb().collection("daily_routes").doc(routeId);

    await getAdminDb().runTransaction(async (transaction) => {
      if (!input.driverId && input.status === "assigned") {
        throw new AppError({
          message: "Assigned routes must include a driver.",
          statusCode: 400,
          code: "ASSIGNED_ROUTE_REQUIRES_DRIVER",
        });
      }

      if (input.driverId) {
        await this.assertDriverAvailability(
          transaction,
          input.driverId,
          input.routeDate,
        );
      }

      transaction.set(routeRef, {
        driverId: input.driverId ?? null,
        routeDate: input.routeDate,
        status: input.driverId && input.status === "draft" ? "assigned" : input.status,
        routeName: input.routeName,
        encodedPolyline: input.encodedPolyline ?? null,
        bounds: input.bounds ?? null,
        stopCount: 0,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    });

    return routeId;
  }

  async updateRoute(routeId: string, input: UpdateRouteInput) {
    if (!isAdminAvailable()) {
      throw new AppError({
        message: "Firebase Admin is not configured.",
        statusCode: 500,
      });
    }

    const routeRef = getAdminDb().collection("daily_routes").doc(routeId);

    await getAdminDb().runTransaction(async (transaction) => {
      const routeSnapshot = await transaction.get(routeRef);
      if (!routeSnapshot.exists) {
        throw new AppError({
          message: "Route not found.",
          statusCode: 404,
          code: "ROUTE_NOT_FOUND",
        });
      }

      const route = mapRouteDocument(routeSnapshot.id, routeSnapshot.data()!);
      if (
        input.status &&
        !canTransitionRouteStatus(String(route.status), input.status)
      ) {
        throw new AppError({
          message: `Cannot move route from ${route.status} to ${input.status}.`,
          statusCode: 400,
          code: "INVALID_ROUTE_STATUS_TRANSITION",
        });
      }

      const nextDriverId =
        input.driverId === undefined ? route.driverId : input.driverId;
      const nextRouteDate = input.routeDate ?? route.routeDate;
      const nextStatus = input.status ?? String(route.status);

      if (!nextDriverId && nextStatus === "assigned") {
        throw new AppError({
          message: "Assigned routes must include a driver.",
          statusCode: 400,
          code: "ASSIGNED_ROUTE_REQUIRES_DRIVER",
        });
      }

      if (nextDriverId) {
        await this.assertDriverAvailability(
          transaction,
          nextDriverId,
          nextRouteDate,
          routeId,
        );
      }

      const inputFields = Object.fromEntries(
        Object.entries(input).filter(([, v]) => v !== undefined),
      );
      transaction.set(
        routeRef,
        {
          ...inputFields,
          driverId: nextDriverId ?? null,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
    });
  }

  async assignRoute(routeId: string, driverId: string | null) {
    const route = await this.getRouteById(routeId);

    if (!route) {
      throw new AppError({
        message: "Route not found.",
        statusCode: 404,
        code: "ROUTE_NOT_FOUND",
      });
    }

    // Promote draft → assigned when adding a driver; demote assigned → draft when removing one
    const nextStatus = driverId
      ? route.status === "draft" ? "assigned" : undefined
      : route.status === "assigned" ? "draft" : undefined;

    await this.updateRoute(routeId, { driverId, status: nextStatus });
  }

  async createStop(routeId: string, input: CreateStopInput) {
    if (!isAdminAvailable()) {
      throw new AppError({
        message: "Firebase Admin is not configured.",
        statusCode: 500,
      });
    }

    const routeRef = getAdminDb().collection("daily_routes").doc(routeId);
    const stopId = crypto.randomUUID();
    const stopRef = routeRef.collection("stops").doc(stopId);

    await getAdminDb().runTransaction(async (transaction) => {
      const routeSnapshot = await transaction.get(routeRef);
      if (!routeSnapshot.exists) {
        throw new AppError({
          message: "Route not found.",
          statusCode: 404,
          code: "ROUTE_NOT_FOUND",
        });
      }

      const route = mapRouteDocument(routeSnapshot.id, routeSnapshot.data()!);
      if (route.status !== "draft" && route.status !== "in_progress") {
        throw new AppError({
          message: "Stops can only be created while a route is in draft or in-progress status.",
          statusCode: 400,
          code: "ROUTE_NOT_MUTABLE",
        });
      }

      const stopsSnapshot = await transaction.get(routeRef.collection("stops"));
      const sequence = input.sequence ?? stopsSnapshot.size + 1;

      transaction.set(stopRef, {
        sequence,
        customerName: input.customerName,
        address: input.address,
        latitude: input.latitude,
        longitude: input.longitude,
        status: input.status,
        deliveredAt: input.deliveredAt ?? null,
        proofImagePath: input.proofImagePath ?? null,
        proofUploadState: input.proofUploadState,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      transaction.set(
        routeRef,
        {
          stopCount: route.stopCount + 1,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
    });

    return stopId;
  }

  async updateStop(routeId: string, stopId: string, input: UpdateStopInput) {
    if (!isAdminAvailable()) {
      throw new AppError({
        message: "Firebase Admin is not configured.",
        statusCode: 500,
      });
    }

    const routeRef = getAdminDb().collection("daily_routes").doc(routeId);
    const stopRef = routeRef.collection("stops").doc(stopId);

    await getAdminDb().runTransaction(async (transaction) => {
      const routeSnapshot = await transaction.get(routeRef);
      if (!routeSnapshot.exists) {
        throw new AppError({
          message: "Route not found.",
          statusCode: 404,
          code: "ROUTE_NOT_FOUND",
        });
      }

      const route = mapRouteDocument(routeSnapshot.id, routeSnapshot.data()!);
      if (route.status !== "draft" && route.status !== "in_progress") {
        throw new AppError({
          message: "Stops can only be edited while a route is in draft or in-progress status.",
          statusCode: 400,
          code: "ROUTE_NOT_MUTABLE",
        });
      }

      const stopSnapshot = await transaction.get(stopRef);
      if (!stopSnapshot.exists) {
        throw new AppError({
          message: "Stop not found.",
          statusCode: 404,
          code: "STOP_NOT_FOUND",
        });
      }

      transaction.set(
        stopRef,
        {
          ...input,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
    });
  }

  async deleteStop(routeId: string, stopId: string) {
    if (!isAdminAvailable()) {
      throw new AppError({
        message: "Firebase Admin is not configured.",
        statusCode: 500,
      });
    }

    const routeRef = getAdminDb().collection("daily_routes").doc(routeId);
    const stopRef = routeRef.collection("stops").doc(stopId);

    await getAdminDb().runTransaction(async (transaction) => {
      const routeSnapshot = await transaction.get(routeRef);
      if (!routeSnapshot.exists) {
        throw new AppError({
          message: "Route not found.",
          statusCode: 404,
          code: "ROUTE_NOT_FOUND",
        });
      }

      const route = mapRouteDocument(routeSnapshot.id, routeSnapshot.data()!);
      if (route.status !== "draft" && route.status !== "in_progress") {
        throw new AppError({
          message: "Stops can only be deleted while a route is in draft or in-progress status.",
          statusCode: 400,
          code: "ROUTE_NOT_MUTABLE",
        });
      }

      const stopSnapshot = await transaction.get(stopRef);
      if (!stopSnapshot.exists) {
        throw new AppError({
          message: "Stop not found.",
          statusCode: 404,
          code: "STOP_NOT_FOUND",
        });
      }

      transaction.delete(stopRef);

      const remainingStopsSnapshot = await transaction.get(routeRef.collection("stops"));
      const remainingStops = remainingStopsSnapshot.docs
        .filter((document) => document.id !== stopId)
        .sort((left, right) => Number(left.data().sequence) - Number(right.data().sequence));

      remainingStops.forEach((document, index) => {
        transaction.set(
          routeRef.collection("stops").doc(document.id),
          {
            sequence: index + 1,
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true },
        );
      });

      transaction.set(
        routeRef,
        {
          stopCount: Math.max(route.stopCount - 1, 0),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
    });
  }

  async reorderStops(routeId: string, stopIds: string[]) {
    if (!isAdminAvailable()) {
      throw new AppError({
        message: "Firebase Admin is not configured.",
        statusCode: 500,
      });
    }

    const routeRef = getAdminDb().collection("daily_routes").doc(routeId);

    await getAdminDb().runTransaction(async (transaction) => {
      const routeSnapshot = await transaction.get(routeRef);
      if (!routeSnapshot.exists) {
        throw new AppError({
          message: "Route not found.",
          statusCode: 404,
          code: "ROUTE_NOT_FOUND",
        });
      }

      const route = mapRouteDocument(routeSnapshot.id, routeSnapshot.data()!);
      if (route.status !== "draft" && route.status !== "in_progress") {
        throw new AppError({
          message: "Stops can only be reordered while a route is in draft or in-progress status.",
          statusCode: 400,
          code: "ROUTE_NOT_MUTABLE",
        });
      }

      const stopSnapshots = await transaction.get(routeRef.collection("stops"));
      const availableIds = new Set(stopSnapshots.docs.map((document) => document.id));

      if (
        stopIds.length !== stopSnapshots.size ||
        stopIds.some((stopId) => !availableIds.has(stopId))
      ) {
        throw new AppError({
          message: "Reorder payload does not match the current stop list.",
          statusCode: 400,
          code: "INVALID_REORDER_PAYLOAD",
        });
      }

      stopIds.forEach((stopId, index) => {
        transaction.set(
          routeRef.collection("stops").doc(stopId),
          {
            sequence: index + 1,
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true },
        );
      });
    });
  }

  async getStopProofUrl(routeId: string, stopId: string) {
    if (!isAdminAvailable()) {
      throw new AppError({
        message: "Firebase Admin is not configured.",
        statusCode: 500,
      });
    }

    let stopSnapshot;
    try {
      stopSnapshot = await getAdminDb()
        .collection("daily_routes")
        .doc(routeId)
        .collection("stops")
        .doc(stopId)
        .get();
    } catch (error) {
      this.normalizeReadError(error);
    }

    if (!stopSnapshot.exists) {
      throw new AppError({
        message: "Stop not found.",
        statusCode: 404,
        code: "STOP_NOT_FOUND",
      });
    }

    const stop = mapStopDocument(routeId, stopSnapshot.id, stopSnapshot.data()!);

    if (!stop.proofImagePath) {
      throw new AppError({
        message: "No proof image is available for this stop.",
        statusCode: 404,
        code: "PROOF_NOT_FOUND",
      });
    }

    const [url] = await getAdminStorage()
      .bucket()
      .file(stop.proofImagePath)
      .getSignedUrl({
        action: "read",
        expires: Date.now() + 15 * 60 * 1000,
      });

    return url;
  }

  async listStopsForRoutes(routeIds: string[]) {
    if (!isAdminAvailable()) {
      return new Map<string, DeliveryStop[]>();
    }

    try {
      const results = await Promise.all(
        routeIds.map(async (routeId) => {
          const snapshot = await getAdminDb()
            .collection("daily_routes")
            .doc(routeId)
            .collection("stops")
            .orderBy("sequence")
            .get();

          return [
            routeId,
            snapshot.docs.map((document) =>
              mapStopDocument(routeId, document.id, document.data()),
            ),
          ] as const;
        }),
      );

      return new Map(results);
    } catch (error) {
      this.normalizeReadError(error);
    }
  }
}
