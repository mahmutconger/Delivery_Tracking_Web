import Link from "next/link";

import { formatDateTime, getRelativeTime } from "@/core/utils/date";
import { isLocationStale } from "@/core/utils/geo";
import { getDriversOverview } from "@/features/drivers/application/get-driver-data";
import { EmptyState } from "@/shared/components/empty-state";
import { PageHeader } from "@/shared/components/page-header";
import { SetupState } from "@/shared/components/setup-state";
import { StatusBadge } from "@/shared/components/status-badge";
import { DataTable } from "@/shared/table/data-table";

function getSingle(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function DriversPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const routeDate = getSingle(params.routeDate) ?? new Date().toISOString().slice(0, 10);
  const activeFilter = getSingle(params.active) ?? "all";
  const assignmentFilter = getSingle(params.assignment) ?? "all";
  const driversResult = await getDriversOverview(routeDate);
  const filteredDrivers = driversResult.data.filter((driver) => {
    const matchesActive =
      activeFilter === "all" ||
      (activeFilter === "active" ? driver.active : !driver.active);
    const matchesAssignment =
      assignmentFilter === "all" ||
      (assignmentFilter === "assigned" ? driver.assigned : !driver.assigned);
    return matchesActive && matchesAssignment;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Sürücüler"
        title="Sürücü listesi"
        description="Aktivite ve günlük atama durumuna göre filtreleyin."
      />
      <form className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-3">
        <label className="space-y-2 text-sm font-medium text-slate-800">
          <span>Tarih</span>
          <input
            className="h-11 w-full rounded-xl border border-slate-300 px-3"
            defaultValue={routeDate}
            name="routeDate"
            type="date"
          />
        </label>
        <label className="space-y-2 text-sm font-medium text-slate-800">
          <span>Aktiflik durumu</span>
          <select className="h-11 w-full rounded-xl border border-slate-300 px-3" defaultValue={activeFilter} name="active">
            <option value="all">Tümü</option>
            <option value="active">Aktif</option>
            <option value="inactive">Pasif</option>
          </select>
        </label>
        <label className="space-y-2 text-sm font-medium text-slate-800">
          <span>Atama durumu</span>
          <select className="h-11 w-full rounded-xl border border-slate-300 px-3" defaultValue={assignmentFilter} name="assignment">
            <option value="all">Tümü</option>
            <option value="assigned">Atandı</option>
            <option value="unassigned">Atanmadı</option>
          </select>
        </label>
        <button className="h-11 rounded-xl bg-slate-900 px-4 text-sm font-medium text-white md:col-span-3 md:w-fit" type="submit">
          Filtreleri uygula
        </button>
      </form>

      {driversResult.status === "setup_required" ? (
        <SetupState description={driversResult.message} />
      ) : null}

      {driversResult.status === "ready" && filteredDrivers.length === 0 ? (
        <EmptyState
          title="Seçili filtrelere uyan sürücü bulunamadı"
          description="Bu tarih için aktiflik veya atama filtrelerini değiştirin."
        />
      ) : driversResult.status === "ready" ? (
        <DataTable
          columns={[
            {
              key: "driver",
              header: "Sürücü",
              cell: (driver) => (
                <div className="space-y-1">
                  <Link className="font-medium text-slate-950 underline-offset-2 hover:underline" href={`/drivers/${driver.id}?routeDate=${routeDate}`}>
                    {driver.displayName}
                  </Link>
                  <p className="text-slate-500">{driver.email}</p>
                </div>
              ),
            },
            {
              key: "status",
              header: "Durum",
              cell: (driver) => (
                <div className="space-y-2">
                  <StatusBadge value={driver.active ? "active" : "inactive"} />
                  <StatusBadge value={driver.assigned ? "assigned" : "unassigned"} />
                </div>
              ),
            },
            {
              key: "location",
              header: "Son konum",
              cell: (driver) =>
                driver.location ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <StatusBadge
                        value={
                          isLocationStale(driver.location.recordedAtMillis)
                            ? "stale"
                            : "fresh"
                        }
                      />
                      <span>{getRelativeTime(driver.location.recordedAtMillis)}</span>
                    </div>
                    <p className="text-slate-500">
                      {driver.location.latitude.toFixed(5)},{" "}
                      {driver.location.longitude.toFixed(5)}
                    </p>
                  </div>
                ) : (
                  "Konum verisi yok"
                ),
            },
            {
              key: "timestamps",
              header: "Oturum / Konum",
              cell: (driver) => (
                <div className="space-y-1 text-slate-500">
                  <p>Son oturum: {formatDateTime(driver.lastSessionAt)}</p>
                  <p>
                    Son GPS: {formatDateTime(driver.location?.recordedAtMillis)}
                  </p>
                </div>
              ),
            },
          ]}
          getRowKey={(driver) => driver.id}
          rows={filteredDrivers}
        />
      ) : null}
    </div>
  );
}
