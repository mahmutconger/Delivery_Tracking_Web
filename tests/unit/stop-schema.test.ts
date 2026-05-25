import { describe, expect, it } from "vitest";

import { stopCreateSchema } from "@/features/stops/domain/schemas";

describe("stopCreateSchema", () => {
  it("accepts a valid stop payload", () => {
    const parsed = stopCreateSchema.parse({
      customerName: "Jane Doe",
      address: "123 Main Street, Istanbul",
      latitude: 41.0082,
      longitude: 28.9784,
      status: "pending",
      proofUploadState: "none",
    });

    expect(parsed.customerName).toBe("Jane Doe");
  });

  it("rejects invalid coordinates", () => {
    expect(() =>
      stopCreateSchema.parse({
        customerName: "Jane Doe",
        address: "123 Main Street, Istanbul",
        latitude: 141.0082,
        longitude: 28.9784,
        status: "pending",
        proofUploadState: "none",
      }),
    ).toThrow(/Latitude/);
  });
});
