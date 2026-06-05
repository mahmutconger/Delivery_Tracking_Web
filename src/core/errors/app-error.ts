/**
 * @brief Uygulamaya özgü hata sınıfı; HTTP durum kodu ve makine tarafından okunabilir hata kodu taşır.
 */
export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly details?: unknown;

  /**
   * @brief Yeni bir AppError örneği oluşturur.
   * @param options.message İnsan tarafından okunabilir hata mesajı.
   * @param options.statusCode HTTP durum kodu. Varsayılan: 500.
   * @param options.code Makine tarafından okunabilir hata kodu. Varsayılan: "INTERNAL_ERROR".
   * @param options.details Hata ayıklama için ek bağlam verisi.
   */
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

/**
 * @brief Firestore'un henüz hazır olmadığını belirten standart bir AppError oluşturur.
 * @param details Hata ayıklama için ek bağlam verisi.
 * @returns FIRESTORE_NOT_READY kodlu, 503 durum kodlu AppError.
 */
export function createFirestoreNotReadyError(details?: unknown) {
  return new AppError({
    message:
      "Firestore is not ready for this Firebase project yet. Enable Cloud Firestore and verify the admin credentials point to the correct project.",
    statusCode: 503,
    code: "FIRESTORE_NOT_READY",
    details,
  });
}

/**
 * @brief Bilinmeyen bir hatayı Firestore hazırlık hatasına dönüştürmeye çalışır.
 * @param error Dönüştürülecek hata nesnesi.
 * @returns Hata Firestore hazırlık sorununa işaret ediyorsa AppError, aksi halde null.
 */
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

/**
 * @brief Verilen hatanın bir Firestore hazırlık hatası olup olmadığını kontrol eder.
 * @param error Kontrol edilecek hata nesnesi.
 * @returns FIRESTORE_NOT_READY kodlu bir AppError ise true.
 */
export function isFirestoreReadinessError(error: unknown) {
  return error instanceof AppError && error.code === "FIRESTORE_NOT_READY";
}

/**
 * @brief Herhangi bir türdeki hatayı AppError'a normalize eder.
 * @param error Normalize edilecek hata.
 * @returns Zaten AppError ise olduğu gibi döner; Error ise sarmalanır; aksi halde genel bir AppError oluşturulur.
 */
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
