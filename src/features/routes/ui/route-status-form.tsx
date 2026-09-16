"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { useToast } from "@/core/context/toast-context";
import { useThrottleWithCooldown } from "@/core/hooks/use-throttle";
import {
  ROUTE_STATUSES,
  canTransitionRouteStatus,
  type RouteStatus,
} from "@/features/routes/domain/models";
import { Button } from "@/shared/components/button";
import { SpecialProgressOverlay } from "@/shared/components/special-progress";
import { FormField, SelectInput } from "@/shared/forms/form-field";

const routeStatusLabels: Record<string, string> = {
  draft: "Taslak",
  assigned: "Atandı",
  in_progress: "Devam Ediyor",
  completed: "Tamamlandı",
  cancelled: "İptal Edildi",
};

export function RouteStatusForm({
  routeId,
  currentStatus,
}: {
  routeId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const { showError, showSuccess, showToast } = useToast();
  const [status, setStatus] = useState<RouteStatus>(currentStatus as RouteStatus);
  const [isPending, setIsPending] = useState(false);

  // Yalnızca geçerli geçişler listelenir; aksi halde kaydet sunucu hatası döner.
  const selectableStatuses = useMemo(
    () =>
      ROUTE_STATUSES.filter((routeStatus) =>
        canTransitionRouteStatus(currentStatus, routeStatus),
      ),
    [currentStatus],
  );

  async function submitInner() {
    setIsPending(true);

    try {
      const response = await fetch(`/api/admin/routes/${routeId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const payload = await response.json();

      if (!response.ok || !payload.ok) {
        showError(
          "Durum güncellenemedi",
          payload.error?.message ?? "Beklenmeyen bir hata oluştu.",
        );
        return;
      }

      showSuccess(
        "Rota durumu güncellendi",
        `Yeni durum: ${routeStatusLabels[status] ?? status}.`,
      );
      router.refresh();
    } catch {
      showError("Durum güncellenemedi", "Sunucuya ulaşılamadı, tekrar deneyin.");
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
        description="Yeni durum kaydediliyor."
        open={isPending}
        title="Rota durumu güncelleniyor"
      />
      <FormField
        label="Rota durumu"
        hint="Sadece geçerli bir sonraki durumlar listelenir."
      >
        <SelectInput
          value={status}
          onChange={(event) => setStatus(event.target.value as RouteStatus)}
        >
          {selectableStatuses.map((routeStatus) => (
            <option key={routeStatus} value={routeStatus}>
              {routeStatusLabels[routeStatus] ?? routeStatus}
            </option>
          ))}
        </SelectInput>
      </FormField>
      <Button
        disabled={isPending || status === currentStatus}
        onClick={submit}
        type="button"
      >
        {isPending ? "Kaydediliyor..." : "Durumu güncelle"}
      </Button>
    </div>
  );
}
