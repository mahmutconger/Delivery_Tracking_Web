"use client";

import { useRef, useState } from "react";

import type { DeliveryStop } from "@/features/stops/domain/models";
import { StopDeleteButton } from "@/features/stops/ui/stop-delete-button";
import { StopForm } from "@/features/stops/ui/stop-form";
import { StopReorderForm } from "@/features/stops/ui/stop-reorder-form";
import { Button } from "@/shared/components/button";
import { Card, CardTitle } from "@/shared/components/card";
import { StatusBadge } from "@/shared/components/status-badge";
import { DataTable } from "@/shared/table/data-table";

/**
 * @brief Durak listesi, sıralama ve durak formunu tek bir istemci adasında birleştirir.
 *
 * "Düzenle" düğmesi artık sunucuya gidip gelmeden formu anında doldurur; bu sayede
 * düzenleme ve ekleme arasında geçiş yapmak için sayfa yenilemek gerekmez.
 *
 * @param routeId Rota kimliği.
 * @param stops Rotanın sıralı durakları.
 * @param canMutate Rota durumu durak ekleme/düzenlemeye izin veriyor mu.
 * @param initialEditStopId `?editStop=` bağlantısıyla gelindiğinde açılacak durak.
 */
export function StopsPanel({
  routeId,
  stops,
  canMutate,
  initialEditStopId,
}: {
  routeId: string;
  stops: DeliveryStop[];
  canMutate: boolean;
  initialEditStopId?: string | null;
}) {
  const [editingStopId, setEditingStopId] = useState<string | null>(
    initialEditStopId ?? null,
  );
  const formSectionRef = useRef<HTMLDivElement>(null);

  // Düzenlenen durak silinmiş veya rota kilitlenmişse form kendiliğinden ekleme moduna döner.
  const editingStop =
    canMutate && editingStopId
      ? stops.find((stop) => stop.id === editingStopId) ?? null
      : null;

  function startEditing(stopId: string) {
    setEditingStopId(stopId);
    formSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  return (
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
            <StatusBadge value={`${stops.length} toplam`} />
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
                      <Button
                        disabled={!canMutate}
                        onClick={() => startEditing(stop.id)}
                        type="button"
                        variant={editingStopId === stop.id ? "primary" : "secondary"}
                      >
                        {editingStopId === stop.id ? "Düzenleniyor" : "Düzenle"}
                      </Button>
                      <StopDeleteButton
                        customerName={stop.customerName}
                        disabled={!canMutate}
                        routeId={routeId}
                        stopId={stop.id}
                      />
                    </div>
                  ),
                },
              ]}
              getRowKey={(stop) => stop.id}
              rows={stops}
            />
          </div>
        </Card>

        {canMutate && stops.length > 1 ? (
          <Card>
            <CardTitle>Durakları sırala</CardTitle>
            <p className="mt-1 text-sm text-slate-600">
              Sıralama doğru göründüğünde kaydedin.
            </p>
            <div className="mt-5">
              <StopReorderForm routeId={routeId} stops={stops} />
            </div>
          </Card>
        ) : null}
      </div>

      <div ref={formSectionRef}>
        {canMutate ? (
          <StopForm
            key={editingStop?.id ?? "new-stop"}
            onCancelEdit={() => setEditingStopId(null)}
            onSaved={({ mode }) => {
              if (mode === "update") {
                setEditingStopId(null);
              }
            }}
            routeId={routeId}
            stop={editingStop}
          />
        ) : (
          <Card>
            <CardTitle>Durak ekle</CardTitle>
            <p className="mt-2 text-sm text-slate-600">
              Durak eklemek veya düzenlemek için rotanın taslak veya devam ediyor
              durumunda olması gerekir.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
