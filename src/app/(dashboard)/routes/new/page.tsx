import { getRoutesOverview } from "@/features/routes/application/get-route-data";
import { RouteCreateForm } from "@/features/routes/ui/route-create-form";
import { PageHeader } from "@/shared/components/page-header";
import { SetupState } from "@/shared/components/setup-state";

function getSingle(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function NewRoutePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const routeDate = getSingle(params.routeDate) ?? new Date().toISOString().slice(0, 10);
  const routesData = await getRoutesOverview({ routeDate });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Rota oluşturma"
        title="Günlük rota oluştur"
        description="Durak planlaması devam ediyorsa taslak rota kullanın; roster hazırsa hemen atayın."
      />
      {routesData.status === "setup_required" ? (
        <SetupState description={routesData.message} />
      ) : (
        <RouteCreateForm defaultDate={routeDate} drivers={routesData.data.drivers} />
      )}
    </div>
  );
}
