"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { DeliveryStop } from "@/features/stops/domain/models";
import { Button } from "@/shared/components/button";

export function StopReorderForm({
  routeId,
  stops,
}: {
  routeId: string;
  stops: DeliveryStop[];
}) {
  const router = useRouter();
  const [items, setItems] = useState(stops);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

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
    setMessage(null);
    setIsPending(true);

    const response = await fetch(`/api/admin/routes/${routeId}/stops/reorder`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        stopIds: items.map((item) => item.id),
      }),
    });
    const payload = await response.json();

    if (!response.ok || !payload.ok) {
      setMessage(payload.error?.message ?? "Duraklar sıralanamadı.");
      setIsPending(false);
      return;
    }

    setMessage("Durak sırası güncellendi.");
    setIsPending(false);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <ol className="space-y-2">
        {items.map((stop, index) => (
          <li
            key={stop.id}
            className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
          >
            <div>
              <p className="font-medium text-slate-950">
                {index + 1}. {stop.customerName}
              </p>
              <p className="text-sm text-slate-600">{stop.address}</p>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => move(index, -1)}
              >
                Yukarı
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => move(index, 1)}
              >
                Aşağı
              </Button>
            </div>
          </li>
        ))}
      </ol>
      {message ? <p className="text-sm text-slate-600">{message}</p> : null}
      <Button disabled={isPending} onClick={save} type="button">
        {isPending ? "Kaydediliyor..." : "Sıralamayı kaydet"}
      </Button>
    </div>
  );
}
