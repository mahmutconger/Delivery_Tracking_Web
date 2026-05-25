"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/shared/components/button";

export function StopDeleteButton({
  routeId,
  stopId,
  disabled = false,
}: {
  routeId: string;
  stopId: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  async function onDelete() {
    if (!window.confirm("Bu durağı silmek istiyor musunuz? Bu işlem yalnızca rota taslak durumundayken mümkündür.")) {
      return;
    }

    setIsPending(true);
    const response = await fetch(`/api/admin/routes/${routeId}/stops/${stopId}`, {
      method: "DELETE",
    });

    if (response.ok) {
      router.refresh();
      return;
    }

    const payload = await response.json().catch(() => null);
    alert(payload?.error?.message ?? "Durak silinemedi.");
    setIsPending(false);
  }

  return (
    <Button disabled={disabled || isPending} onClick={onDelete} type="button" variant="danger">
      Sil
    </Button>
  );
}
