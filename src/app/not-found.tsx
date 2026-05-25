import Link from "next/link";

import { Button } from "@/shared/components/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="max-w-lg space-y-4 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-600">
          Sayfa bulunamadı
        </p>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-slate-950">Sayfa mevcut değil</h1>
          <p className="text-sm text-slate-600">
            Aradığınız sayfa mevcut değil ya da taşınmış olabilir.
          </p>
        </div>
        <Link href="/dashboard">
          <Button>Panele dön</Button>
        </Link>
      </div>
    </div>
  );
}
