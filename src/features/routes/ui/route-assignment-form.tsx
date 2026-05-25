"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useThrottle } from "@/core/hooks/use-throttle";
import type { Driver } from "@/features/drivers/domain/models";
import { Button } from "@/shared/components/button";
import { FormField, SelectInput } from "@/shared/forms/form-field";

export function RouteAssignmentForm({
  routeId,
  driverId,
  drivers,
}: {
  routeId: string;
  driverId: string | null;
  drivers: Driver[];
}) {
  const router = useRouter();
  const [nextDriverId, setNextDriverId] = useState(driverId ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const throttledSubmit = useThrottle(() => void submitInner(), 3000);

  async function submit() {
    throttledSubmit();
  }

  async function submitInner() {
    setMessage(null);
    setIsPending(true);

    const response = await fetch(`/api/admin/routes/${routeId}/assign`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        driverId: nextDriverId || null,
      }),
    });
    const payload = await response.json();

    if (!response.ok || !payload.ok) {
      setMessage(payload.error?.message ?? "Atama güncellenemedi.");
      setIsPending(false);
      return;
    }

    setMessage("Atama güncellendi.");
    setIsPending(false);
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <FormField label="Atanan sürücü">
        <SelectInput value={nextDriverId} onChange={(event) => setNextDriverId(event.target.value)}>
          <option value="">Atanmadı</option>
          {drivers.map((driver) => (
            <option key={driver.id} value={driver.id} disabled={!driver.active}>
              {driver.displayName}{driver.active ? "" : " (pasif)"}
            </option>
          ))}
        </SelectInput>
      </FormField>
      {message ? <p className="text-sm text-slate-600">{message}</p> : null}
      <Button disabled={isPending} onClick={submit} type="button">
        {isPending ? "Kaydediliyor..." : "Atamayı kaydet"}
      </Button>
    </div>
  );
}
