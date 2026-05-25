import Link from "next/link";
import { notFound } from "next/navigation";

import { publicEnv } from "@/core/env/public";
import { formatRouteDate } from "@/core/utils/date";
import { getRouteDetail } from "@/features/routes/application/get-route-data";
import { getNotificationsForRoute } from "@/features/notifications/application/send-notification";
import { NotificationList } from "@/features/notifications/ui/notification-list";
import { RouteMap } from "@/features/maps/ui/route-map";
import { RouteAssignmentForm } from "@/features/routes/ui/route-assignment-form";
import { RouteEditForm } from "@/features/routes/ui/route-edit-form";
import { RouteStatusForm } from "@/features/routes/ui/route-status-form";
import { StopDeleteButton } from "@/features/stops/ui/stop-delete-button";
import { StopForm } from "@/features/stops/ui/stop-form";
import { StopImportForm } from "@/features/stops/ui/stop-import-form";
import { StopReorderForm } from "@/features/stops/ui/stop-reorder-form";
import { Button } from "@/shared/components/button";
import { Card, CardTitle } from "@/shared/components/card";
import { PageHeader } from "@/shared/components/page-header";
import { SetupState } from "@/shared/components/setup-state";
import { StatusBadge } from "@/shared/components/status-badge";
import { DataTable } from "@/shared/table/data-table";

function getSingle(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

const mapTileUrl =
  publicEnv.NEXT_PUBLIC_MAP_TILE_URL ??
  "https://tile.openstreetmap.de/{z}/{x}/{y}.png";
const mapAttribution =
  publicEnv.NEXT_PUBLIC_MAP_ATTRIBUTION ??
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

export default async function RouteDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ routeId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { routeId } = await params;
  const query = await searchParams;
  const editStopId = getSingle(query.editStop);
  const [data, notifications] = await Promise.all([
    getRouteDetail(routeId),
    getNotificationsForRoute(routeId).catch(() => []),
  ]);

  if (data.status === "setup_required") {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Rota detayı"
          title="Rota verisi kullanılamıyor"
          description="Rota detay görünümü Firebase verilerinin hazır olmasını bekliyor."
        />
        <SetupState description={data.message} />
      </div>
    );
  }

  if (!data.data) {
    notFound();
  }

  const routeDetail = data.data;

  const editStop = editStopId
    ? routeDetail.stops.find((stop) => stop.id === editStopId) ?? null
    : null;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Rota detayı"
        title={routeDetail.route.routeName}
        description={`${formatRouteDate(routeDetail.route.routeDate)} • ${routeDetail.route.stopCount} durak`}
        actions={
          <div className="flex items-center gap-3">
            <StatusBadge value={routeDetail.route.status} />
            <Link href="/routes">
              <Button variant="secondary">Rotalara dön</Button>
            </Link>
          </div>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <p className="text-sm text-slate-500">Rota ID</p>
              <p className="font-medium text-slate-950">{routeDetail.route.id}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-slate-500">Atanan sürücü</p>
              <p className="font-medium text-slate-950">
                {routeDetail.drivers.find((driver) => driver.id === routeDetail.route.driverId)
                  ?.displayName ?? "Atanmadı"}
              </p>
            </div>
          </div>
          <RouteAssignmentForm
            routeId={routeDetail.route.id}
            driverId={routeDetail.route.driverId}
            drivers={routeDetail.drivers}
          />
          <RouteStatusForm
            routeId={routeDetail.route.id}
            currentStatus={String(routeDetail.route.status)}
          />
        </Card>

        <RouteMap
          attribution={mapAttribution}
          route={routeDetail.route}
          stops={routeDetail.stops}
          tileUrl={mapTileUrl}
        />
      </div>

      {routeDetail.route.status === "draft" ? (
        <RouteEditForm
          routeId={routeDetail.route.id}
          defaultValues={{
            routeName: routeDetail.route.routeName,
            routeDate: routeDetail.route.routeDate,
            encodedPolyline: routeDetail.route.encodedPolyline,
          }}
        />
      ) : null}

      <div className="grid gap-6 2xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <Card>
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle>Duraklar</CardTitle>
                <p className="mt-1 text-sm text-slate-600">
                  Durak düzenleme ve silme taslak veya devam eden rotalarda kullanılabilir.
                </p>
              </div>
              <StatusBadge value={`${routeDetail.route.stopCount} toplam`} />
            </div>
            <div className="mt-5">
              <DataTable
                columns={[
                  {
                    key: "sequence",
                    header: "Sıra",
                    cell: (stop) => stop.sequence,
                  },
                  {
                    key: "customer",
                    header: "Müşteri",
                    cell: (stop) => (
                      <div className="space-y-1">
                        <p className="font-medium text-slate-950">{stop.customerName}</p>
                        <p className="text-slate-500">{stop.address}</p>
                      </div>
                    ),
                  },
                  {
                    key: "status",
                    header: "Durum",
                    cell: (stop) => (
                      <div className="space-y-2">
                        <StatusBadge value={stop.status} />
                        <StatusBadge value={stop.proofUploadState} />
                      </div>
                    ),
                  },
                  {
                    key: "proof",
                    header: "Kanıt",
                    cell: (stop) =>
                      stop.proofImagePath ? (
                        <a
                          className="font-medium text-slate-900 underline underline-offset-2"
                          href={`/api/admin/proofs/${routeId}/${stop.id}`}
                          rel="noreferrer"
                          target="_blank"
                        >
                          Kanıtı görüntüle
                        </a>
                      ) : (
                        "Kanıt yok"
                      ),
                  },
                  {
                    key: "actions",
                    header: "İşlemler",
                    cell: (stop) => (
                      <div className="flex flex-wrap gap-2">
                        <Link href={`/routes/${routeId}?editStop=${stop.id}`}>
                          <Button variant="secondary">Düzenle</Button>
                        </Link>
                        <StopDeleteButton
                          disabled={routeDetail.route.status !== "draft" && routeDetail.route.status !== "in_progress"}
                          routeId={routeId}
                          stopId={stop.id}
                        />
                      </div>
                    ),
                  },
                ]}
                getRowKey={(stop) => stop.id}
                rows={routeDetail.stops}
              />
            </div>
          </Card>

          {routeDetail.route.status === "draft" || routeDetail.route.status === "in_progress" ? (
            <Card>
              <CardTitle>Durakları sırala</CardTitle>
              <p className="mt-1 text-sm text-slate-600">
                Sıralama doğru göründüğünde kaydedin.
              </p>
              <div className="mt-5">
                <StopReorderForm routeId={routeId} stops={routeDetail.stops} />
              </div>
            </Card>
          ) : null}
        </div>

        {routeDetail.route.status === "draft" || routeDetail.route.status === "in_progress" ? (
          <StopForm routeId={routeId} stop={editStop} />
        ) : (
          <Card>
            <CardTitle>{editStop ? "Durağı düzenle" : "Durak ekle"}</CardTitle>
            <p className="mt-2 text-sm text-slate-600">
              Durak eklemek veya düzenlemek için rotanın taslak veya devam ediyor durumunda olması gerekir.
            </p>
          </Card>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {(routeDetail.route.status === "draft" || routeDetail.route.status === "in_progress") && (
          <StopImportForm routeId={routeId} />
        )}
        <NotificationList notifications={notifications} />
      </div>
    </div>
  );
}
