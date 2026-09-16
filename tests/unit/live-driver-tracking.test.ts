// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const onSnapshotMock = vi.fn(() => vi.fn());
const onIdTokenChangedMock = vi.fn();

vi.mock("firebase/firestore", () => ({
  collection: vi.fn(() => ({ path: "drivers_location" })),
  onSnapshot: (...args: unknown[]) => onSnapshotMock(...(args as [])),
}));

vi.mock("firebase/auth", () => ({
  onIdTokenChanged: (...args: unknown[]) => {
    onIdTokenChangedMock(...(args as []));
    return () => {};
  },
}));

vi.mock("@/lib/firebase/client", () => ({
  getClientAuth: vi.fn(() => ({ name: "auth" })),
  getClientDb: vi.fn(() => ({ name: "db" })),
}));

vi.mock("@/core/env/public", () => ({
  isFirebaseClientConfigured: () => true,
  publicEnv: {},
}));

const { describeAuthStatus } = await import(
  "@/features/auth/application/use-firebase-client-user"
);
const { useDriverLocations } = await import(
  "@/features/drivers/application/use-driver-locations"
);
const { useDriverMarkers } = await import(
  "@/features/maps/application/use-driver-markers"
);

type AuthCallback = (user: unknown) => Promise<void> | void;

/** onIdTokenChanged'e verilen geri çağırmayı test içinden tetiklemeyi sağlar. */
function getAuthCallback(): AuthCallback {
  const call = onIdTokenChangedMock.mock.calls.at(-1);
  if (!call) throw new Error("onIdTokenChanged hiç çağrılmadı");
  return call[1] as AuthCallback;
}

function userWithRole(role: unknown) {
  return {
    uid: "driver-user",
    getIdTokenResult: vi.fn(async () => ({ claims: { role } })),
  };
}

beforeEach(() => {
  onSnapshotMock.mockClear();
  onIdTokenChangedMock.mockClear();
});

describe("useDriverLocations kimlik doğrulama kapısı", () => {
  it("istemci oturumu hazır olmadan Firestore'a abone olmaz", () => {
    renderHook(() => useDriverLocations(true));

    // Bu, permission-denied hatasının kök nedeniydi: jeton hazır olmadan
    // gönderilen istekler kurallar tarafından reddediliyordu.
    expect(onSnapshotMock).not.toHaveBeenCalled();
    expect(onIdTokenChangedMock).toHaveBeenCalledTimes(1);
  });

  it("rollü jeton hazır olduğunda abone olur", async () => {
    const { result } = renderHook(() => useDriverLocations(true));

    await act(async () => {
      await getAuthCallback()(userWithRole("dispatcher"));
    });

    expect(onSnapshotMock).toHaveBeenCalledTimes(1);
    expect(result.current.error).toBeNull();
  });

  it("canlı mod kapalıyken rollü jetonla bile abone olmaz", async () => {
    renderHook(() => useDriverLocations(false));

    await act(async () => {
      await getAuthCallback()(userWithRole("admin"));
    });

    expect(onSnapshotMock).not.toHaveBeenCalled();
  });

  it("tarayıcıda oturum yoksa izin hatası yerine oturum hatası gösterir", async () => {
    const { result } = renderHook(() => useDriverLocations(true));

    await act(async () => {
      await getAuthCallback()(null);
    });

    expect(onSnapshotMock).not.toHaveBeenCalled();
    expect(result.current.error?.message).toBe("Tarayıcı oturumu bulunamadı.");
  });

  it("rol talebi eksikse jetonu bir kez zorla yeniler ve rol hatası gösterir", async () => {
    const { result } = renderHook(() => useDriverLocations(true));
    const user = userWithRole(undefined);

    await act(async () => {
      await getAuthCallback()(user);
    });

    // İlk okuma önbellekten, ikincisi zorla yenilemeden.
    expect(user.getIdTokenResult).toHaveBeenCalledTimes(2);
    expect(user.getIdTokenResult).toHaveBeenLastCalledWith(true);
    expect(result.current.error?.message).toBe(
      "Hesabınızda admin veya dispatcher rolü tanımlı değil.",
    );
    expect(onSnapshotMock).not.toHaveBeenCalled();
  });
});

describe("describeAuthStatus", () => {
  it("sorunsuz durumlar için mesaj üretmez", () => {
    expect(describeAuthStatus("ready")).toBeNull();
    expect(describeAuthStatus("loading")).toBeNull();
  });

  it("her sorun durumu için ipuçlu mesaj üretir", () => {
    for (const status of ["unconfigured", "signed_out", "missing_role"] as const) {
      const described = describeAuthStatus(status);
      expect(described?.message).toBeTruthy();
      expect(described?.hint).toBeTruthy();
    }
  });
});

describe("useDriverMarkers", () => {
  const profile = {
    id: "driver-2",
    displayName: "Ayşe Yılmaz",
    email: "ayse@example.com",
    phoneNumber: "+905550000000",
    active: true,
    assignedRouteId: "route-1",
    assignedRouteName: "Kadıköy Sabah",
  };

  it("konumları sürücü künyeleriyle eşleştirip ada göre sıralar", () => {
    const locations = new Map([
      [
        "driver-1",
        {
          driverId: "driver-1",
          latitude: 41,
          longitude: 29,
          accuracyMeters: 12.4,
          speedMetersPerSecond: 10,
          recordedAtMillis: Date.now(),
        },
      ],
      [
        "driver-2",
        {
          driverId: "driver-2",
          latitude: 40.9,
          longitude: 29.1,
          accuracyMeters: null,
          speedMetersPerSecond: null,
          recordedAtMillis: Date.now(),
        },
      ],
    ]);

    const { result } = renderHook(() =>
      useDriverMarkers(locations, new Map([["driver-2", profile]])),
    );

    // "Ayşe Yılmaz" < "driver-1" (künyesi olmayan sürücü ham kimliğiyle listelenir).
    expect(result.current.map((marker) => marker.label)).toEqual([
      "Ayşe Yılmaz",
      "driver-1",
    ]);

    const [known, unknown] = result.current;
    expect(known.profile).toBe(profile);
    expect(known.speedKmh).toBeNull();
    expect(unknown.profile).toBeNull();
    // 10 m/s ≈ 36 km/sa
    expect(unknown.speedKmh).toBe(36);
    expect(unknown.accuracyMeters).toBe(12.4);
  });

  it("eski zaman damgalı konumu bayat olarak işaretler", () => {
    const locations = new Map([
      [
        "driver-3",
        {
          driverId: "driver-3",
          latitude: 41,
          longitude: 29,
          accuracyMeters: null,
          speedMetersPerSecond: null,
          recordedAtMillis: Date.now() - 30 * 60 * 1000,
        },
      ],
    ]);

    const { result } = renderHook(() => useDriverMarkers(locations, new Map()));

    expect(result.current[0].isStale).toBe(true);
  });
});
