import Link from "next/link";

import { BrandLogo } from "@/shared/components/brand-logo";
import { Button } from "@/shared/components/button";

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="max-w-lg space-y-4 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex items-center gap-3">
          <BrandLogo className="size-11" />
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-600">
            Erişim reddedildi
          </p>
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-slate-950">
            Bu panele erişim yetkiniz yok
          </h1>
          <p className="text-sm text-slate-600">
            Bir yöneticiden Firebase Auth hesabınıza <code>admin</code> veya{" "}
            <code>dispatcher</code> yetkisi atamasını isteyin.
          </p>
        </div>
        <Link href="/login">
          <Button>Girişe dön</Button>
        </Link>
      </div>
    </div>
  );
}
