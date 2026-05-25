import Link from "next/link";
import { notFound } from "next/navigation";

import { formatDateTime } from "@/core/utils/date";
import { getCurrentSession } from "@/core/auth/session";
import { getDriverDetail } from "@/features/drivers/application/get-driver-data";
import { DriverLiveLocation } from "@/features/drivers/ui/driver-live-location";
import { Button } from "@/shared/components/button";
import { Card, CardTitle } from "@/shared/components/card";
import { PageHeader } from "@/shared/components/page-header";
import { SetupState } from "@/shared/components/setup-state";
import { StatusBadge } from "@/shared/components/status-badge";

function getSingle(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function DriverDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ driverId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { driverId } = await params;
  const query = await searchParams;
  const routeDate = getSingle(query.routeDate) ?? new Date().toISOString().slice(0, 10);
  const detail = await getDriverDetail(driverId, routeDate);
  const session = await getCurrentSession();

  if (detail.status === "setup_required") {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Sürücü detayı"
          title="Sürücü verisi kullanılamıyor"
          description="Sürücü detay görünümü Firebase verilerinin hazır olmasını bekliyor."
        />
        <SetupState description={detail.message} />
      </div>
    );
  }

  if (!detail.data) {
    notFound();
  }

  const driverDetail = detail.data;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Sürücü detayı"
        title={driverDetail.driver.displayName}
        description={`Sürücü ID: ${driverDetail.driver.id}`}
        actions={
          driverDetail.assignedRouteId ? (
            <Link href={`/routes/${driverDetail.assignedRouteId}`}>
              <Button>Atanan rotayı aç</Button>
            </Link>
          ) : null
        }
      />

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardTitle>Profil</CardTitle>
          <div className="mt-5 space-y-4 text-sm text-slate-700">
            <div className="flex flex-wrap gap-3">
              <StatusBadge value={driverDetail.driver.active ? "active" : "inactive"} />
              <StatusBadge
                value={driverDetail.assignedRouteId ? "assigned" : "unassigned"}
              />
            </div>
            <div className="space-y-1">
              <p className="text-slate-500">E-posta</p>
              <p>{driverDetail.driver.email}</p>
            </div>
            <div className="space-y-1">
              <p className="text-slate-500">Son oturum</p>
              <p>{formatDateTime(driverDetail.driver.lastSessionAt)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-slate-500">{routeDate} tarihindeki atama</p>
              <p>{driverDetail.assignedRouteId ?? "Atanmış rota yok"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-slate-500">Telefon numarası</p>
              <p>{driverDetail.driver.phoneNumber ?? "Eklenmemiş"}</p>
            </div>
            {session?.role === "admin" ? (
              <div className="space-y-3 pt-2">
                <form action={`/api/admin/drivers/${driverDetail.driver.id}`} method="post">
                  <input
                    name="active"
                    type="hidden"
                    value={driverDetail.driver.active ? "false" : "true"}
                  />
                  <Button type="submit" variant="secondary">
                    {driverDetail.driver.active ? "Pasif yap" : "Aktif yap"}
                  </Button>
                </form>
                <form
                  action={`/api/admin/drivers/${driverDetail.driver.id}`}
                  className="flex gap-2"
                  method="post"
                >
                  <input
                    className="h-10 flex-1 rounded-xl border border-slate-300 px-3 text-sm"
                    defaultValue={driverDetail.driver.phoneNumber ?? ""}
                    name="phoneNumber"
                    placeholder="+905xxxxxxxxx"
                    type="tel"
                  />
                  <Button type="submit" variant="secondary">
                    Kaydet
                  </Button>
                </form>
              </div>
            ) : null}
          </div>
        </Card>

        <DriverLiveLocation
          driverId={driverDetail.driver.id}
          initialLocation={driverDetail.location}
        />
      </div>
    </div>
  );
}
