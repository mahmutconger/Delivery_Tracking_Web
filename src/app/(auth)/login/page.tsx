import { redirect } from "next/navigation";

import { getCurrentSession } from "@/core/auth/session";
import { LoginForm } from "@/features/auth/ui/login-form";
import { BrandLogo } from "@/shared/components/brand-logo";

export default async function LoginPage() {
  const session = await getCurrentSession();
  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.16),_transparent_30%),linear-gradient(180deg,#fff7ed_0%,#f8fafc_55%,#e2e8f0_100%)] px-4 py-10">
      <div className="grid w-full max-w-5xl gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-[2rem] border border-white/60 bg-slate-950 px-8 py-10 text-white shadow-2xl shadow-slate-900/10">
          <div className="flex items-center gap-4">
            <BrandLogo className="size-14 rounded-2xl ring-white/20" />
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">
              Teslimat operasyonları
            </p>
          </div>
          <h1 className="mt-6 max-w-xl text-4xl font-semibold tracking-tight">
            Rotaları yönetin, teslimat kanıtlarını takip edin, sürücü operasyonlarını düzenleyin.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
            Bu yönetici paneli, Firebase altyapılı Android sürücü uygulamasıyla çalışan
            rota planlayıcıları ve sevkiyat ekipleri için tasarlanmıştır.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm font-medium text-white">Güvenli yazma sınırı</p>
              <p className="mt-2 text-sm text-slate-300">
                Tüm yönetici işlemleri korumalı sunucu taraflı uç noktalara yönlendirilir.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm font-medium text-white">Maliyet odaklı veri okuma</p>
              <p className="mt-2 text-sm text-slate-300">
                Okumalar büyük ölçüde isteğe bağlıdır; canlı dinleyiciler yalnızca sürücü takibi için devreye girer.
              </p>
            </div>
          </div>
        </section>
        <div className="flex items-center justify-center">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
