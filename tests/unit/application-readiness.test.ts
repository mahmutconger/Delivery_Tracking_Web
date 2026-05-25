import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createFirestoreNotReadyError } from "@/core/errors/app-error";

const driverRepositoryMock = {
  listDrivers: vi.fn(),
  listDriverLocations: vi.fn(),
  getDriverById: vi.fn(),
  getDriverLocation: vi.fn(),
  buildDriverListItems: vi.fn(),
};

const routeRepositoryMock = {
  listRoutesByDate: vi.fn(),
  listStopsForRoutes: vi.fn(),
  getAssignedRouteIdsByDriver: vi.fn(),
  getRouteWithStops: vi.fn(),
};

vi.mock("@/features/drivers/data/firestore-driver-repository", () => ({
  FirestoreDriverRepository: vi
    .fn()
    .mockImplementation(function FirestoreDriverRepository() {
      return driverRepositoryMock;
    }),
}));

vi.mock("@/features/routes/data/firestore-route-repository", () => ({
  FirestoreRouteRepository: vi
    .fn()
    .mockImplementation(function FirestoreRouteRepository() {
      return routeRepositoryMock;
    }),
}));

describe("application readiness fallbacks", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns setup_required for dashboard reads when Firestore is not ready", async () => {
    routeRepositoryMock.listRoutesByDate.mockResolvedValue([]);
    driverRepositoryMock.listDriverLocations.mockRejectedValue(
      createFirestoreNotReadyError(),
    );

    const { getDashboardSnapshot } = await import(
      "@/features/dashboard/application/get-dashboard-snapshot"
    );
    const result = await getDashboardSnapshot("2026-05-20");

    expect(result.status).toBe("setup_required");
    expect(result.data.routeCount).toBe(0);
  });

  it("returns setup_required for drivers overview when Firestore is not ready", async () => {
    driverRepositoryMock.listDrivers.mockRejectedValue(
      createFirestoreNotReadyError(),
    );
    driverRepositoryMock.listDriverLocations.mockResolvedValue([]);
    routeRepositoryMock.getAssignedRouteIdsByDriver.mockResolvedValue(new Map());

    const { getDriversOverview } = await import(
      "@/features/drivers/application/get-driver-data"
    );
    const result = await getDriversOverview("2026-05-20");

    expect(result.status).toBe("setup_required");
    expect(result.data).toEqual([]);
  });

  it("returns setup_required for routes overview when Firestore is not ready", async () => {
    routeRepositoryMock.listRoutesByDate.mockRejectedValue(
      createFirestoreNotReadyError(),
    );
    driverRepositoryMock.listDrivers.mockResolvedValue([]);

    const { getRoutesOverview } = await import(
      "@/features/routes/application/get-route-data"
    );
    const result = await getRoutesOverview({ routeDate: "2026-05-20" });

    expect(result.status).toBe("setup_required");
    expect(result.data.routes).toEqual([]);
    expect(result.data.drivers).toEqual([]);
  });
});
