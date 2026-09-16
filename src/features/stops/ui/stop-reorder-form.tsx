"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useToast } from "@/core/context/toast-context";
import type { DeliveryStop } from "@/features/stops/domain/models";
import { Button } from "@/shared/components/button";
import { SpecialProgressOverlay } from "@/shared/components/special-progress";

/**
 * Listeyi sunucudan gelen veriyle karşılaştırmak için kullanılan imza.
 * Sunucu her render'da yeni bir dizi döndürdüğü için referans yerine içerik karşılaştırılır.
 */
function toSignature(stops: DeliveryStop[]) {
  return stops.map((stop) => `${stop.id}:${stop.sequence}`).join("|");
}

export function StopReorderForm({
  routeId,
  stops,
}: {
  routeId: string;
  stops: DeliveryStop[];
}) {
  const router = useRouter();
  const { showError, showSuccess } = useToast();
  const [items, setItems] = useState(stops);
  const [syncedSignature, setSyncedSignature] = useState(() => toSignature(stops));
  const [isPending, setIsPending] = useState(false);
  const serverSignature = toSignature(stops);

  // Durak eklendiğinde/silindiğinde liste sunucu verisiyle senkronlanır; aksi halde
  // yeni duraklar ancak sayfa elle yenilenince görünürdü. (Render sırasında düzeltme:
  // https://react.dev/learn/you-might-not-need-an-effect)
  if (syncedSignature !== serverSignature) {
    setSyncedSignature(serverSignature);
    setItems(stops);
  }

  const hasChanges = toSignature(items) !== serverSignature;

  function move(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= items.length) {
      return;
    }

    const nextItems = [...items];
    const current = nextItems[index];
    nextItems[index] = nextItems[nextIndex];
    nextItems[nextIndex] = current;
    setItems(nextItems);
  }

  async function save() {
    setIsPending(true);

    try {
      const response = await fetch(
        `/api/admin/routes/${routeId}/stops/reorder`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            stopIds: items.map((item) => item.id),
          }),
        },
      );
      const payload = await response.json();

      if (!response.ok || !payload.ok) {
        showError(
          "Duraklar sıralanamadı",
          payload.error?.message ?? "Beklenmeyen bir hata oluştu.",
        );
        return;
      }

      showSuccess("Durak sırası güncellendi");
      router.refresh();
    } catch {
      showError("Duraklar sıralanamadı", "Sunucuya ulaşılamadı, tekrar deneyin.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="space-y-4">
      <SpecialProgressOverlay
        description="Yeni durak sırası kaydediliyor."
        open={isPending}
        title="Sıralama güncelleniyor"
      />
      <ol className="space-y-2">
        {items.map((stop, index) => (
          <li
            key={stop.id}
            className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
          >
            <div className="min-w-0">
              <p className="font-medium text-slate-950">
                {index + 1}. {stop.customerName}
              </p>
              <p className="text-sm text-slate-600">{stop.address}</p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button
                disabled={index === 0}
                onClick={() => move(index, -1)}
                type="button"
                variant="secondary"
              >
                Yukarı
              </Button>
              <Button
                disabled={index === items.length - 1}
                onClick={() => move(index, 1)}
                type="button"
                variant="secondary"
              >
                Aşağı
              </Button>
            </div>
          </li>
        ))}
      </ol>
      <div className="flex flex-wrap items-center gap-3">
        <Button
          disabled={isPending || !hasChanges}
          onClick={() => void save()}
          type="button"
        >
          {isPending ? "Kaydediliyor..." : "Sıralamayı kaydet"}
        </Button>
        {hasChanges ? (
          <Button
            disabled={isPending}
            onClick={() => setItems(stops)}
            type="button"
            variant="ghost"
          >
            Değişiklikleri geri al
          </Button>
        ) : null}
      </div>
    </div>
  );
}
