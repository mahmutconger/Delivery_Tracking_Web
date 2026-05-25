export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(options: {
    message: string;
    statusCode?: number;
    code?: string;
    details?: unknown;
  }) {
    super(options.message);
    this.name = "AppError";
    this.statusCode = options.statusCode ?? 500;
    this.code = options.code ?? "INTERNAL_ERROR";
    this.details = options.details;
  }
}

export function createFirestoreNotReadyError(details?: unknown) {
  return new AppError({
    message:
      "Firestore is not ready for this Firebase project yet. Enable Cloud Firestore and verify the admin credentials point to the correct project.",
    statusCode: 503,
    code: "FIRESTORE_NOT_READY",
    details,
  });
}

export function toFirestoreReadinessError(error: unknown) {
  if (
    error instanceof AppError &&
    error.code === "FIRESTORE_NOT_READY"
  ) {
    return error;
  }

  const code =
    typeof error === "object" && error !== null && "code" in error
      ? (error as { code?: unknown }).code
      : undefined;
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "";

  if (code === "FIRESTORE_NOT_READY") {
    return createFirestoreNotReadyError({
      originalCode: code,
      originalMessage: message,
    });
  }

  const looksLikeMissingDatabase =
    code === 5 ||
    code === "5" ||
    code === "NOT_FOUND" ||
    code === "not-found" ||
    message.includes("5 NOT_FOUND") ||
    message.toLowerCase().includes("database") ||
    message.toLowerCase().includes("cloud firestore api has not been used");

  return looksLikeMissingDatabase
    ? createFirestoreNotReadyError({
        originalCode: code,
        originalMessage: message,
      })
    : null;
}

export function isFirestoreReadinessError(error: unknown) {
  return error instanceof AppError && error.code === "FIRESTORE_NOT_READY";
}

export function normalizeError(error: unknown) {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    return new AppError({
      message: error.message,
      details: { name: error.name },
    });
  }

  return new AppError({
    message: "Unexpected error",
    details: error,
  });
}
