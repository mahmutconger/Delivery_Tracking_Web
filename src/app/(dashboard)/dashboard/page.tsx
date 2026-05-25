import { getDashboardSnapshot } from "@/features/dashboard/application/get-dashboard-snapshot";
import { DashboardOverview } from "@/features/dashboard/ui/dashboard-overview";
import { PageHeader } from "@/shared/components/page-header";
import { SetupState } from "@/shared/components/setup-state";

export default async function DashboardPage() {
  const snapshot = await getDashboardSnapshot();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Operasyonlar"
        title="Sevkiyat paneli"
        description="Bugünkü rota ilerlemesi, teslimat kanıtı durumu ve sürücü konum sinyallerinin özet görünümü."
      />
      {snapshot.status === "setup_required" ? (
        <SetupState description={snapshot.message} />
      ) : (
        <DashboardOverview snapshot={snapshot.data} />
      )}
    </div>
  );
}
