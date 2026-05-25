import { describe, expect, it } from "vitest";

import {
  createFirestoreNotReadyError,
  isFirestoreReadinessError,
  toFirestoreReadinessError,
} from "@/core/errors/app-error";

describe("Firestore readiness errors", () => {
  it("classifies NOT_FOUND read failures as setup errors", () => {
    const error = toFirestoreReadinessError({
      code: 5,
      message: "5 NOT_FOUND: The database (default) does not exist for project",
    });

    expect(error?.code).toBe("FIRESTORE_NOT_READY");
    expect(isFirestoreReadinessError(error)).toBe(true);
  });

  it("leaves unrelated errors untouched", () => {
    const error = toFirestoreReadinessError(
      new Error("Permission denied while reading Firestore."),
    );

    expect(error).toBeNull();
  });

  it("recognizes pre-normalized setup errors", () => {
    const error = createFirestoreNotReadyError();

    expect(toFirestoreReadinessError(error)).toBe(error);
    expect(isFirestoreReadinessError(error)).toBe(true);
  });
});
