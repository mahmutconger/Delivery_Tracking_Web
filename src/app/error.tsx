"use client";

import { Button } from "@/shared/components/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="max-w-lg space-y-4 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-600">
          Beklenmeyen hata
        </p>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-slate-950">
            Bir şeyler ters gitti
          </h1>
          <p className="text-sm text-slate-600">{error.message}</p>
        </div>
        <Button onClick={reset}>Tekrar dene</Button>
      </div>
    </div>
  );
}
