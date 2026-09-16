"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useToast } from "@/core/context/toast-context";
import { Button } from "@/shared/components/button";
import { SpecialProgressOverlay } from "@/shared/components/special-progress";

/**
 * @brief Bir durağı silen buton; sonucu toast ile bildirir.
 * @param routeId Durağın bağlı olduğu rota kimliği.
 * @param stopId Silinecek durak kimliği.
 * @param customerName Onay ve bildirim metinlerinde gösterilecek müşteri adı.
 * @param disabled Rota durumu silmeye izin vermiyorsa true.
 */
export function StopDeleteButton({
  routeId,
  stopId,
  customerName,
  disabled = false,
}: {
  routeId: string;
  stopId: string;
  customerName?: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const { showError, showSuccess } = useToast();
  const [isPending, setIsPending] = useState(false);

  async function onDelete() {
    const label = customerName ? `“${customerName}” durağını` : "Bu durağı";
    if (
      !window.confirm(
        `${label} silmek istiyor musunuz? Bu işlem geri alınamaz.`,
      )
    ) {
      return;
    }

    setIsPending(true);

    try {
      const response = await fetch(
        `/api/admin/routes/${routeId}/stops/${stopId}`,
        { method: "DELETE" },
      );

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        showError(
          "Durak silinemedi",
          payload?.error?.message ?? "Beklenmeyen bir hata oluştu.",
        );
        return;
      }

      showSuccess(
        "Durak silindi",
        customerName ? `${customerName} rotadan çıkarıldı.` : undefined,
      );
      router.refresh();
    } catch {
      showError("Durak silinemedi", "Sunucuya ulaşılamadı, tekrar deneyin.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <>
      <SpecialProgressOverlay
        description={
          customerName ? `${customerName} rotadan çıkarılıyor.` : undefined
        }
        open={isPending}
        title="Durak siliniyor"
      />
      <Button
        disabled={disabled || isPending}
        onClick={() => void onDelete()}
        type="button"
        variant="danger"
      >
        {isPending ? "Siliniyor..." : "Sil"}
      </Button>
    </>
  );
}
