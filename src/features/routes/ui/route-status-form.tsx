"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { ROUTE_STATUSES, type RouteStatus } from "@/features/routes/domain/models";

const routeStatusLabels: Record<string, string> = {
  draft: "Taslak",
  assigned: "Atandı",
  in_progress: "Devam Ediyor",
  completed: "Tamamlandı",
  cancelled: "İptal Edildi",
};
import { useThrottle } from "@/core/hooks/use-throttle";
import { Button } from "@/shared/components/button";
import { FormField, SelectInput } from "@/shared/forms/form-field";

export function RouteStatusForm({
  routeId,
  currentStatus,
}: {
  routeId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<RouteStatus>(currentStatus as RouteStatus);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const throttledSubmit = useThrottle(() => void submitInner(), 3000);

  function submit() {
    throttledSubmit();
  }

  async function submitInner() {
    setMessage(null);
    setIsPending(true);

    const response = await fetch(`/api/admin/routes/${routeId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const payload = await response.json();

    if (!response.ok || !payload.ok) {
      setMessage(payload.error?.message ?? "Durum güncellenemedi.");
      setIsPending(false);
      return;
    }

    setMessage("Durum güncellendi.");
    setIsPending(false);
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <FormField label="Rota durumu">
        <SelectInput value={status} onChange={(event) => setStatus(event.target.value as RouteStatus)}>
          {ROUTE_STATUSES.map((routeStatus) => (
            <option key={routeStatus} value={routeStatus}>
              {routeStatusLabels[routeStatus] ?? routeStatus}
            </option>
          ))}
        </SelectInput>
      </FormField>
      {message ? <p className="text-sm text-slate-600">{message}</p> : null}
      <Button disabled={isPending} onClick={submit} type="button">
        {isPending ? "Kaydediliyor..." : "Durumu güncelle"}
      </Button>
    </div>
  );
}
