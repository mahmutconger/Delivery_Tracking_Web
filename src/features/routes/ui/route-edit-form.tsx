"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { useToast } from "@/core/context/toast-context";
import { Button } from "@/shared/components/button";
import { Card, CardTitle } from "@/shared/components/card";
import { SpecialProgressOverlay } from "@/shared/components/special-progress";
import { FormField, TextInput } from "@/shared/forms/form-field";

const routeEditSchema = z.object({
  routeName: z.string().trim().min(3).max(120),
  routeDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  encodedPolyline: z.string().trim().optional(),
});

type RouteEditValues = z.input<typeof routeEditSchema>;

export function RouteEditForm({
  routeId,
  defaultValues,
}: {
  routeId: string;
  defaultValues: { routeName: string; routeDate: string; encodedPolyline?: string | null };
}) {
  const router = useRouter();
  const { showError, showSuccess } = useToast();
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const form = useForm<RouteEditValues>({
    resolver: zodResolver(routeEditSchema),
    defaultValues: {
      routeName: defaultValues.routeName,
      routeDate: defaultValues.routeDate,
      encodedPolyline: defaultValues.encodedPolyline ?? "",
    },
  });

  async function onSubmit(values: RouteEditValues) {
    setServerError(null);
    setSuccessMessage(null);
    setIsPending(true);

    let payload: { ok: boolean; error?: { message?: string } } | null = null;
    try {
      const response = await fetch(`/api/admin/routes/${routeId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          routeName: values.routeName,
          routeDate: values.routeDate,
          encodedPolyline: values.encodedPolyline || null,
        }),
      });
      payload = await response.json();

      if (!response.ok || !payload?.ok) {
        const message = payload?.error?.message ?? "Rota güncellenemedi.";
        setServerError(message);
        showError("Rota güncellenemedi", message);
        setIsPending(false);
        return;
      }
    } catch {
      const message = "Sunucu hatası. Lütfen tekrar deneyin.";
      setServerError(message);
      showError("Rota güncellenemedi", message);
      setIsPending(false);
      return;
    }

    setSuccessMessage("Rota güncellendi.");
    setIsPending(false);
    showSuccess("Rota güncellendi", `${values.routeName} kaydedildi.`);
    router.refresh();
  }

  return (
    <Card>
      <SpecialProgressOverlay
        description="Rota bilgileri kaydediliyor."
        open={isPending}
        title="Rota güncelleniyor"
      />
      <CardTitle>Rotayı düzenle</CardTitle>
      <p className="mt-1 text-sm text-slate-600">
        Yalnızca taslak veya devam ediyor durumundaki rotalar düzenlenebilir.
      </p>
      <form className="mt-5 grid gap-4 md:grid-cols-2" onSubmit={form.handleSubmit(onSubmit)}>
        <FormField label="Rota adı" error={form.formState.errors.routeName?.message}>
          <TextInput {...form.register("routeName")} />
        </FormField>
        <FormField label="Rota tarihi" error={form.formState.errors.routeDate?.message}>
          <TextInput type="date" {...form.register("routeDate")} />
        </FormField>
        <div className="md:col-span-2">
          <FormField
            label="Rota geometrisi (polyline)"
            hint="İsteğe bağlı. Boş bırakılırsa mevcut değer silinir."
          >
            <TextInput placeholder="Rota geometrisi" {...form.register("encodedPolyline")} />
          </FormField>
        </div>
        {serverError ? (
          <p className="md:col-span-2 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {serverError}
          </p>
        ) : null}
        {successMessage ? (
          <p className="md:col-span-2 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {successMessage}
          </p>
        ) : null}
        <div className="md:col-span-2">
          <Button disabled={isPending} type="submit">
            {isPending ? "Kaydediliyor..." : "Değişiklikleri kaydet"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
