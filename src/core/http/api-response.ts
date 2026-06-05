import { NextResponse } from "next/server";

import { AppError, normalizeError } from "@/core/errors/app-error";

/**
 * @brief Başarılı bir API yanıtı oluşturur.
 * @param data Yanıt gövdesine yerleştirilecek veri.
 * @param init Ek yanıt başlıkları veya seçenekleri.
 * @returns { ok: true, data } içeren JSON NextResponse.
 */
export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, data }, init);
}

/**
 * @brief Bir hatayı normalize edilmiş JSON hata yanıtına dönüştürür.
 * @param error Herhangi bir türde hata nesnesi.
 * @returns { ok: false, error: { code, message, details } } içeren JSON NextResponse; durum kodu AppError'dan alınır.
 */
export function fail(error: unknown) {
  const normalized = normalizeError(error);

  return NextResponse.json(
    {
      ok: false,
      error: {
        code: normalized.code,
        message: normalized.message,
        details: normalized.details,
      },
    },
    { status: normalized.statusCode },
  );
}

/**
 * @brief Bir koşulun doğruluğunu doğrular; yanlışsa AppError fırlatır.
 * @param condition Doğrulanacak koşul.
 * @param message Koşul sağlanmadığında kullanılacak hata mesajı.
 * @param statusCode Fırlatılacak hatanın HTTP durum kodu. Varsayılan: 400.
 * @throws ASSERTION_FAILED kodlu AppError, koşul falsy ise.
 */
export function assert(condition: unknown, message: string, statusCode = 400) {
  if (!condition) {
    throw new AppError({ message, statusCode, code: "ASSERTION_FAILED" });
  }
}
