import { describe, expect, it } from "vitest";

import { decodePolyline } from "@/core/utils/polyline";

describe("decodePolyline", () => {
  it("decodes a standard encoded polyline", () => {
    expect(decodePolyline("_p~iF~ps|U_ulLnnqC_mqNvxq`@")).toEqual([
      [38.5, -120.2],
      [40.7, -120.95],
      [43.252, -126.453],
    ]);
  });

  it("returns an empty list for an empty input", () => {
    expect(decodePolyline("")).toEqual([]);
  });
});
