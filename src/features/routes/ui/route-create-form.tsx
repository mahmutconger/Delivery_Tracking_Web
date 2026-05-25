"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { useThrottle } from "@/core/hooks/use-throttle";
import { routeCreateSchema } from "@/features/routes/domain/schemas";
import type { Driver } from "@/features/drivers/domain/models";
import { Button } from "@/shared/components/button";
import { Card, CardTitle } from "@/shared/components/card";
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
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const form = useForm<RouteCreateValues>({
    resolver: zodResolver(routeCreateSchema),
    defaultValues: {
      routeDate: defaultDate,
      routeName: "",
      driverId: null,
      status: "draft",
      encodedPolyline: "",
      bounds: null,
    },
  });

  async function onSubmitInner(values: RouteCreateValues) {
    setServerError(null);
    setIsPending(true);

    const response = await fetch("/api/admin/routes", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ...values,
        driverId: values.driverId || null,
        encodedPolyline: values.encodedPolyline || null,
      }),
    });

    let payload: { ok: boolean; error?: { message?: string }; data?: { routeId: string } } | null = null;
    try {
      payload = await response.json();
    } catch {
      setServerError("Sunucu hatası. Lütfen tekrar deneyin.");
      setIsPending(false);
      return;
    }
    if (!response.ok || !payload?.ok) {
      setServerError(payload?.error?.message ?? "Rota oluşturulamadı.");
      setIsPending(false);
      return;
    }

    router.push(`/routes/${payload.data!.routeId}`);
    router.refresh();
  }

  const throttledSubmit = useThrottle(
    (values: RouteCreateValues) => void onSubmitInner(values),
    3000,
  );

  function onSubmit(values: RouteCreateValues) {
    throttledSubmit(values);
  }

  return (
    <Card className="max-w-3xl">
      <CardTitle>Rota oluştur</CardTitle>
      <form className="mt-5 grid gap-4 md:grid-cols-2" onSubmit={form.handleSubmit(onSubmit)}>
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
        <FormField label="Durum">
          <SelectInput {...form.register("status")}>
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
