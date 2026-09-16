"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useToast } from "@/core/context/toast-context";
import { useThrottleWithCooldown } from "@/core/hooks/use-throttle";
import type { Driver } from "@/features/drivers/domain/models";
import { Button } from "@/shared/components/button";
import { SpecialProgressOverlay } from "@/shared/components/special-progress";
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
  const { showError, showSuccess, showToast } = useToast();
  const [nextDriverId, setNextDriverId] = useState(driverId ?? "");
  const [isPending, setIsPending] = useState(false);

  async function submitInner() {
    setIsPending(true);

    try {
      const response = await fetch(`/api/admin/routes/${routeId}/assign`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          driverId: nextDriverId || null,
        }),
      });
      const payload = await response.json();

      if (!response.ok || !payload.ok) {
        showError(
          "Atama güncellenemedi",
          payload.error?.message ?? "Beklenmeyen bir hata oluştu.",
        );
        return;
      }

      const driverName =
        drivers.find((driver) => driver.id === nextDriverId)?.displayName;
      showSuccess(
        "Atama güncellendi",
        driverName ? `${driverName} bu rotaya atandı.` : "Rotanın sürücüsü kaldırıldı.",
      );
      router.refresh();
    } catch {
      showError("Atama güncellenemedi", "Sunucuya ulaşılamadı, tekrar deneyin.");
    } finally {
      setIsPending(false);
    }
  }

  const { call: callSubmit, getRemainingMs } = useThrottleWithCooldown(
    () => void submitInner(),
    3000,
  );

  function submit() {
    if (isPending) return;

    if (!callSubmit()) {
      showToast({
        tone: "warning",
        title: "Çok hızlı",
        description: `Lütfen ${Math.ceil(getRemainingMs() / 1000)} saniye sonra tekrar deneyin.`,
      });
    }
  }

  return (
    <div className="space-y-3">
      <SpecialProgressOverlay
        description="Sürücü ataması kaydediliyor."
        open={isPending}
        title="Atama güncelleniyor"
      />
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
      <Button
        disabled={isPending || nextDriverId === (driverId ?? "")}
        onClick={submit}
        type="button"
      >
        {isPending ? "Kaydediliyor..." : "Atamayı kaydet"}
      </Button>
    </div>
  );
}
