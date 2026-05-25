import Link from "next/link";
import { Suspense } from "react";

import type { SessionUser } from "@/core/auth/session";
import { Button } from "@/shared/components/button";
import { StatusBadge } from "@/shared/components/status-badge";
import { AppDatePicker } from "@/shared/layout/app-date-picker";

const navItems = [
  { href: "/dashboard", label: "Panel" },
  { href: "/drivers", label: "Sürücüler" },
  { href: "/routes", label: "Rotalar" },
];

export function AppShell({
  user,
  children,
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.18),_transparent_24%),linear-gradient(180deg,#fffdf8_0%,#f8fafc_45%,#eef2ff_100%)]">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-6 rounded-3xl border border-white/70 bg-white/80 px-6 py-5 shadow-sm backdrop-blur">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <Link href="/dashboard" className="text-xl font-semibold text-slate-950">
                Sevkiyat Yönetim Paneli
              </Link>
              <p className="text-sm text-slate-600">
                Rota planlama, sürücü atama, durak yönetimi ve canlı takip.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Suspense fallback={null}>
                <AppDatePicker />
              </Suspense>
              <StatusBadge value={user.role ?? "unknown"} />
              <span className="text-sm text-slate-600">{user.email ?? user.uid}</span>
              <form action="/api/auth/logout" method="post">
                <Button variant="secondary" type="submit">
                  Çıkış yap
                </Button>
              </form>
            </div>
          </div>
          <nav className="mt-5 flex flex-wrap gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </header>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
