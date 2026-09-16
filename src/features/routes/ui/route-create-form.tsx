"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { useToast } from "@/core/context/toast-context";
import { useThrottleWithCooldown } from "@/core/hooks/use-throttle";
import { routeCreateSchema } from "@/features/routes/domain/schemas";
import type { Driver } from "@/features/drivers/domain/models";
import { Button } from "@/shared/components/button";
import { Card, CardTitle } from "@/shared/components/card";
import { SpecialProgressOverlay } from "@/shared/components/special-progress";
import { FormField, SelectInput, TextInput } from "@/shared/forms/form-field";

type RouteCreateValues = z.input<typeof routeCreateSchema>;

export function RouteCreateForm({
  drivers,
  defaultDate,
}: {
  drivers: Driver[];
  defaultDate: string;
}) {
  const router = useRouter();
  const { showError, showSuccess, showToast } = useToast();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const form = useForm<RouteCreateValues>({
    resolver: zodResolver(routeCreateSchema),
    defaultValues: {
      routeDate: defaultDate,
      routeName: "",
      driverId: null,
      // Yeni rota doğrudan düzenlenebilir durumda açılır.
      status: "in_progress",
      encodedPolyline: "",
      bounds: null,
    },
  });

  async function onSubmitInner(values: RouteCreateValues) {
    setServerError(null);
    setIsPending(true);

    let payload: { ok: boolean; error?: { message?: string }; data?: { routeId: string } } | null = null;
    try {
      const response = await fetch("/api/admin/routes", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...values,
          driverId: values.driverId || null,
          encodedPolyline: values.encodedPolyline || null,
        }),
      });
      payload = await response.json();

      if (!response.ok || !payload?.ok) {
        const message = payload?.error?.message ?? "Rota oluşturulamadı.";
        setServerError(message);
        showError("Rota oluşturulamadı", message);
        setIsPending(false);
        return;
      }
    } catch {
      const message = "Sunucu hatası. Lütfen tekrar deneyin.";
      setServerError(message);
      showError("Rota oluşturulamadı", message);
      setIsPending(false);
      return;
    }

    showSuccess("Rota oluşturuldu", `${values.routeName} açıldı, durak ekleyebilirsiniz.`);
    router.push(`/routes/${payload.data!.routeId}`);
    router.refresh();
  }

  const { call: callSubmit, getRemainingMs } = useThrottleWithCooldown(
    (values: RouteCreateValues) => void onSubmitInner(values),
    3000,
  );

  function onSubmit(values: RouteCreateValues) {
    if (isPending) return;

    if (!callSubmit(values)) {
      showToast({
        tone: "warning",
        title: "Çok hızlı",
        description: `Lütfen ${Math.ceil(getRemainingMs() / 1000)} saniye sonra tekrar deneyin.`,
      });
    }
  }

  function onInvalid() {
    showError("Form eksik", "İşaretli alanları düzeltip tekrar kaydedin.");
  }

  return (
    <Card className="max-w-3xl">
      <CardTitle>Rota oluştur</CardTitle>
      <SpecialProgressOverlay
        description="Rota kaydediliyor, lütfen bekleyin."
        open={isPending}
        title="Rota oluşturuluyor"
      />
      <form className="mt-5 grid gap-4 md:grid-cols-2" onSubmit={form.handleSubmit(onSubmit, onInvalid)}>
        <FormField label="Rota adı" error={form.formState.errors.routeName?.message}>
          <TextInput placeholder="Şehir merkezi sabah rotası" {...form.register("routeName")} />
        </FormField>
        <FormField label="Rota tarihi" error={form.formState.errors.routeDate?.message}>
          <TextInput type="date" {...form.register("routeDate")} />
        </FormField>
        <FormField label="Sürücü">
          <SelectInput
            defaultValue=""
            {...form.register("driverId", {
              setValueAs: (value) => value || null,
            })}
          >
            <option value="">Atanmadı</option>
            {drivers.map((driver) => (
              <option key={driver.id} value={driver.id} disabled={!driver.active}>
                {driver.displayName}{driver.active ? "" : " (pasif)"}
              </option>
            ))}
          </SelectInput>
        </FormField>
        <FormField
          label="Durum"
          hint="Durak ekleyebilmek için rota taslak veya devam ediyor olmalıdır."
        >
          <SelectInput {...form.register("status")}>
            <option value="in_progress">Devam Ediyor</option>
            <option value="draft">Taslak</option>
            <option value="assigned">Atandı</option>
          </SelectInput>
        </FormField>
        <div className="md:col-span-2">
          <FormField label="Rota geometrisi (polyline)" hint="İsteğe bağlı. Rota geometrisi hazır değilse boş bırakın.">
            <TextInput placeholder="Rota geometrisi" {...form.register("encodedPolyline")} />
          </FormField>
        </div>
        {serverError ? (
          <p className="md:col-span-2 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {serverError}
          </p>
        ) : null}
        <div className="md:col-span-2">
          <Button disabled={isPending} type="submit">
            {isPending ? "Oluşturuluyor..." : "Rota oluştur"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
