import { NextResponse } from "next/server";

import { AppError, normalizeError } from "@/core/errors/app-error";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, data }, init);
}

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

export function assert(condition: unknown, message: string, statusCode = 400) {
  if (!condition) {
    throw new AppError({ message, statusCode, code: "ASSERTION_FAILED" });
  }
}
