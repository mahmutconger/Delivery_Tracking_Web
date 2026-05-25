import { describe, expect, it, vi } from "vitest";

import { createBounds, isLocationStale } from "@/core/utils/geo";

describe("geo utilities", () => {
  it("marks locations stale after the default threshold", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-20T10:15:00.000Z"));

    expect(isLocationStale(Date.parse("2026-05-20T10:00:01.000Z"))).toBe(false);
    expect(isLocationStale(Date.parse("2026-05-20T09:59:59.000Z"))).toBe(true);

    vi.useRealTimers();
  });

  it("builds bounds from stop coordinates", () => {
    expect(
      createBounds([
        { latitude: 41.1, longitude: 29.2 },
        { latitude: 40.8, longitude: 28.7 },
        { latitude: 41.4, longitude: 29.6 },
      ]),
    ).toEqual({
      north: 41.4,
      south: 40.8,
      east: 29.6,
      west: 28.7,
    });
  });
});
