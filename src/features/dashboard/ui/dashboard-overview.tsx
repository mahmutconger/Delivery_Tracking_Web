import { Card, CardTitle } from "@/shared/components/card";
import type { DashboardSnapshot } from "@/features/dashboard/application/get-dashboard-snapshot";
import { LiveMapSection } from "@/features/dashboard/ui/live-map-section";

export function DashboardOverview({
  snapshot,
}: {
  snapshot: DashboardSnapshot;
}) {
  const cards = [
    {
      label: "Bugünkü rotalar",
      value: snapshot.routeCount,
      tone: "from-slate-950 to-slate-700 text-white",
    },
    {
      label: "Teslim edilen duraklar",
      value: snapshot.deliveredStops,
      tone: "from-emerald-500 to-emerald-600 text-white",
    },
    {
      label: "Bekleyen duraklar",
      value: snapshot.pendingStops,
      tone: "from-amber-400 to-amber-500 text-slate-950",
    },
    {
      label: "Güncel olmayan sürücü konumları",
      value: snapshot.staleDrivers,
      tone: "from-rose-400 to-rose-500 text-white",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <article
            key={card.label}
            className={`rounded-3xl bg-gradient-to-br p-6 shadow-sm ${card.tone}`}
          >
            <p className="text-sm font-medium opacity-90">{card.label}</p>
            <p className="mt-6 text-4xl font-semibold tracking-tight">{card.value}</p>
          </article>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <Card>
          <CardTitle>Durum dağılımı</CardTitle>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {Object.entries(snapshot.statusCounts).map(([status, count]) => (
              <div
                key={status}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >
                <p className="text-sm text-slate-500">{status.replaceAll("_", " ")}</p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">{count}</p>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <CardTitle>Kanıt yükleme takibi</CardTitle>
          <div className="mt-4 space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Devam eden duraklar</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">
                {snapshot.inProgressStops}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Başarısız kanıt yüklemeleri</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">
                {snapshot.failedProofUploads}
              </p>
            </div>
          </div>
        </Card>
      </div>
      <Card>
        <LiveMapSection />
      </Card>
    </div>
  );
}
