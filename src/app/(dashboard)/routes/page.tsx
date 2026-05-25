import Link from "next/link";

import { formatRouteDate } from "@/core/utils/date";
import { getRoutesOverview } from "@/features/routes/application/get-route-data";
import { RouteExportForm } from "@/features/routes/ui/route-export-form";
import { Button } from "@/shared/components/button";
import { EmptyState } from "@/shared/components/empty-state";
import { PageHeader } from "@/shared/components/page-header";
import { SetupState } from "@/shared/components/setup-state";
import { StatusBadge } from "@/shared/components/status-badge";
import { DataTable } from "@/shared/table/data-table";

function getSingle(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function RoutesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const routeDate = getSingle(params.routeDate);
  const status = getSingle(params.status);
  const driverId = getSingle(params.driverId);
  const data = await getRoutesOverview({ routeDate, status, driverId });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Rotalar"
        title="Günlük rotalar"
        description="Tarih filtreli rota yönetimi, açık atama ve güvenli durum geçişleri."
        actions={
          <Link href={`/routes/new?routeDate=${data.data.routeDate}`}>
            <Button>Rota oluştur</Button>
          </Link>
        }
      />

      <form className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-3">
        <label className="space-y-2 text-sm font-medium text-slate-800">
          <span>Rota tarihi</span>
          <input
            className="h-11 w-full rounded-xl border border-slate-300 px-3"
            defaultValue={data.data.routeDate}
            name="routeDate"
            type="date"
          />
        </label>
        <label className="space-y-2 text-sm font-medium text-slate-800">
          <span>Durum</span>
          <select className="h-11 w-full rounded-xl border border-slate-300 px-3" defaultValue={status ?? ""} name="status">
            <option value="">Tüm durumlar</option>
            <option value="draft">Taslak</option>
            <option value="assigned">Atandı</option>
            <option value="in_progress">Devam ediyor</option>
            <option value="completed">Tamamlandı</option>
            <option value="cancelled">İptal edildi</option>
          </select>
        </label>
        <label className="space-y-2 text-sm font-medium text-slate-800">
          <span>Sürücü</span>
          <select className="h-11 w-full rounded-xl border border-slate-300 px-3" defaultValue={driverId ?? ""} name="driverId">
            <option value="">Tüm sürücüler</option>
            {data.data.drivers.map((driver) => (
              <option key={driver.id} value={driver.id}>
                {driver.displayName}
              </option>
            ))}
          </select>
        </label>
        <button className="h-11 rounded-xl bg-slate-900 px-4 text-sm font-medium text-white md:col-span-3 md:w-fit" type="submit">
          Filtreleri uygula
        </button>
      </form>

      <RouteExportForm />

      {data.status === "setup_required" ? (
        <SetupState description={data.message} />
      ) : data.data.routes.length === 0 ? (
        <EmptyState
          title="Rota bulunamadı"
          description="Seçili gün için rota oluşturun veya filtreleri genişletin."
        />
      ) : (
        <DataTable
          columns={[
            {
              key: "name",
              header: "Rota",
              cell: (route) => (
                <div className="space-y-1">
                  <Link className="font-medium text-slate-950 underline-offset-2 hover:underline" href={`/routes/${route.id}`}>
                    {route.routeName}
                  </Link>
                  <p className="text-slate-500">{route.id}</p>
                </div>
              ),
            },
            {
              key: "date",
              header: "Tarih",
              cell: (route) => formatRouteDate(route.routeDate),
            },
            {
              key: "driver",
              header: "Sürücü",
              cell: (route) => route.driverName,
            },
            {
              key: "status",
              header: "Durum",
              cell: (route) => <StatusBadge value={route.status} />,
            },
            {
              key: "stops",
              header: "Duraklar",
              cell: (route) => route.stopCount,
            },
          ]}
          getRowKey={(route) => route.id}
          rows={data.data.routes}
        />
      )}
    </div>
  );
}
