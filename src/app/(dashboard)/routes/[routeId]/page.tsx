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
import { StopImportForm } from "@/features/stops/ui/stop-import-form";
import { StopsPanel } from "@/features/stops/ui/stops-panel";
import { Button } from "@/shared/components/button";
import { Card } from "@/shared/components/card";
import { PageHeader } from "@/shared/components/page-header";
import { SetupState } from "@/shared/components/setup-state";
import { StatusBadge } from "@/shared/components/status-badge";

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
  const routeStatus = String(routeDetail.route.status);
  const canMutateStops = routeStatus === "draft" || routeStatus === "in_progress";

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Rota detayı"
        title={routeDetail.route.routeName}
        description={`${formatRouteDate(routeDetail.route.routeDate)} • ${routeDetail.stops.length} durak`}
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
          {/* key: sunucudan yeni değer geldiğinde seçim kutuları bayat kalmasın diye sıfırlanır. */}
          <RouteAssignmentForm
            key={`assign-${routeDetail.route.driverId ?? "unassigned"}`}
            routeId={routeDetail.route.id}
            driverId={routeDetail.route.driverId}
            drivers={routeDetail.drivers}
          />
          <RouteStatusForm
            key={`status-${routeStatus}`}
            routeId={routeDetail.route.id}
            currentStatus={routeStatus}
          />
        </Card>

        <RouteMap
          attribution={mapAttribution}
          route={routeDetail.route}
          stops={routeDetail.stops}
          tileUrl={mapTileUrl}
        />
      </div>

      {canMutateStops ? (
        <RouteEditForm
          routeId={routeDetail.route.id}
          defaultValues={{
            routeName: routeDetail.route.routeName,
            routeDate: routeDetail.route.routeDate,
            encodedPolyline: routeDetail.route.encodedPolyline,
          }}
        />
      ) : null}

      <StopsPanel
        canMutate={canMutateStops}
        initialEditStopId={editStopId ?? null}
        routeId={routeId}
        stops={routeDetail.stops}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {canMutateStops && <StopImportForm routeId={routeId} />}
        <NotificationList notifications={notifications} />
      </div>
    </div>
  );
}
