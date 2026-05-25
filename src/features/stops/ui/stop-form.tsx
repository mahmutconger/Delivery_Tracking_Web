"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { useDebounce } from "@/core/hooks/use-debounce";
import { useThrottle } from "@/core/hooks/use-throttle";
import { publicEnv } from "@/core/env/public";
import type { DeliveryStop } from "@/features/stops/domain/models";
import {
  PROOF_UPLOAD_STATES,
  STOP_STATUSES,
} from "@/features/stops/domain/models";

const stopStatusLabels: Record<string, string> = {
  pending: "Bekliyor",
  delivered: "Teslim Edildi",
  failed: "Başarısız",
};

const proofUploadStateLabels: Record<string, string> = {
  none: "Yok",
  uploaded: "Yüklendi",
  failed: "Başarısız",
};
import { stopCreateSchema } from "@/features/stops/domain/schemas";
import { CoordinatePicker } from "@/features/maps/ui/coordinate-picker";
import { Button } from "@/shared/components/button";
import { Card, CardTitle } from "@/shared/components/card";
import {
  FormField,
  SelectInput,
  TextArea,
  TextInput,
} from "@/shared/forms/form-field";

const mapTileUrl =
  publicEnv.NEXT_PUBLIC_MAP_TILE_URL ??
  "https://tile.openstreetmap.de/{z}/{x}/{y}.png";
const mapAttribution =
  publicEnv.NEXT_PUBLIC_MAP_ATTRIBUTION ??
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

type StopValues = z.input<typeof stopCreateSchema>;

interface GeocodeResult {
  displayName: string;
  latitude: number;
  longitude: number;
}

export function StopForm({
  routeId,
  stop,
}: {
  routeId: string;
  stop?: DeliveryStop | null;
}) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [geocodeResults, setGeocodeResults] = useState<GeocodeResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [addressQuery, setAddressQuery] = useState(stop?.address ?? "");
  const debouncedQuery = useDebounce(addressQuery, 500);
  const form = useForm<StopValues>({
    resolver: zodResolver(stopCreateSchema),
    defaultValues: {
      sequence: stop?.sequence,
      customerName: stop?.customerName ?? "",
      address: stop?.address ?? "",
      latitude: stop?.latitude ?? 41.0082,
      longitude: stop?.longitude ?? 28.9784,
      status: (stop?.status as StopValues["status"]) ?? "pending",
      deliveredAt: stop?.deliveredAt
        ? new Date(stop.deliveredAt).toISOString().slice(0, 16)
        : null,
      proofImagePath: stop?.proofImagePath ?? null,
      proofUploadState:
        (stop?.proofUploadState as StopValues["proofUploadState"]) ?? "none",
    },
  });
  const latitude = useWatch({ control: form.control, name: "latitude" });
  const longitude = useWatch({ control: form.control, name: "longitude" });

  // Auto-search when user stops typing (debounced at 500 ms)
  useEffect(() => {
    if (debouncedQuery.length >= 3) {
      void searchAddress(debouncedQuery);
    }
  }, [debouncedQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  async function searchAddress(query = addressQuery) {
    setIsSearching(true);
    setGeocodeResults([]);
    setServerError(null);

    const response = await fetch(
      `/api/admin/geocode/search?q=${encodeURIComponent(query)}`,
    );
    const payload = await response.json();

    if (!response.ok || !payload.ok) {
      setServerError(payload.error?.message ?? "Adres araması başarısız.");
      setIsSearching(false);
      return;
    }

    setGeocodeResults(payload.data.results);
    setIsSearching(false);
  }

  async function onSubmitInner(values: StopValues) {
    setServerError(null);
    setIsPending(true);

    const payloadBody = {
      ...values,
      sequence:
        values.sequence === undefined || Number.isNaN(values.sequence)
          ? undefined
          : values.sequence,
      deliveredAt: values.deliveredAt
        ? new Date(values.deliveredAt).toISOString()
        : null,
      proofImagePath: values.proofImagePath || null,
    };

    const response = await fetch(
      stop
        ? `/api/admin/routes/${routeId}/stops/${stop.id}`
        : `/api/admin/routes/${routeId}/stops`,
      {
        method: stop ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payloadBody),
      },
    );
    const payload = await response.json();

    if (!response.ok || !payload.ok) {
      setServerError(payload.error?.message ?? "Durak kaydedilemedi.");
      setIsPending(false);
      return;
    }

    router.push(`/routes/${routeId}`);
    router.refresh();
  }

  const throttledSubmit = useThrottle((values: StopValues) => void onSubmitInner(values), 3000);

  function onSubmit(values: StopValues) {
    throttledSubmit(values);
  }

  return (
    <Card>
      <CardTitle>{stop ? "Durağı düzenle" : "Durak ekle"}</CardTitle>
      <form className="mt-5 space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            label="Sıra numarası"
            error={form.formState.errors.sequence?.message}
            hint="Sona eklemek için boş bırakın."
          >
            <TextInput
              type="number"
              min={1}
              {...form.register("sequence", {
                setValueAs: (value) =>
                  value === "" || value === undefined ? undefined : Number(value),
              })}
            />
          </FormField>
          <FormField
            label="Müşteri adı"
            error={form.formState.errors.customerName?.message}
          >
            <TextInput {...form.register("customerName")} />
          </FormField>
        </div>

        <FormField label="Adres arama">
          <div className="flex gap-2">
            <TextInput
              value={addressQuery}
              onChange={(event) => setAddressQuery(event.target.value)}
              placeholder="Adrese göre ara"
            />
            <Button disabled={isSearching} onClick={() => void searchAddress()} type="button">
              {isSearching ? "Aranıyor..." : "Ara"}
            </Button>
          </div>
        </FormField>

        {geocodeResults.length > 0 ? (
          <div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            {geocodeResults.map((result) => (
              <button
                key={`${result.latitude}-${result.longitude}`}
                className="block w-full rounded-xl bg-white px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-100"
                onClick={() => {
                  form.setValue("address", result.displayName);
                  form.setValue("latitude", result.latitude);
                  form.setValue("longitude", result.longitude);
                }}
                type="button"
              >
                {result.displayName}
              </button>
            ))}
          </div>
        ) : null}

        <FormField label="Adres" error={form.formState.errors.address?.message}>
          <TextArea {...form.register("address")} />
        </FormField>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            label="Enlem"
            error={form.formState.errors.latitude?.message}
          >
            <TextInput
              type="number"
              step="0.000001"
              {...form.register("latitude", { valueAsNumber: true })}
            />
          </FormField>
          <FormField
            label="Boylam"
            error={form.formState.errors.longitude?.message}
          >
            <TextInput
              type="number"
              step="0.000001"
              {...form.register("longitude", { valueAsNumber: true })}
            />
          </FormField>
        </div>

        <CoordinatePicker
          value={{
            latitude,
            longitude,
          }}
          onChange={(value) => {
            form.setValue("latitude", value.latitude);
            form.setValue("longitude", value.longitude);
          }}
          tileUrl={mapTileUrl}
          attribution={mapAttribution}
        />

        <div className="grid gap-4 md:grid-cols-3">
          <FormField label="Durum">
            <SelectInput {...form.register("status")}>
              {STOP_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {stopStatusLabels[status] ?? status}
                </option>
              ))}
            </SelectInput>
          </FormField>
          <FormField label="Kanıt yükleme durumu">
            <SelectInput {...form.register("proofUploadState")}>
              {PROOF_UPLOAD_STATES.map((state) => (
                <option key={state} value={state}>
                  {proofUploadStateLabels[state] ?? state}
                </option>
              ))}
            </SelectInput>
          </FormField>
          <FormField label="Teslim tarihi">
            <TextInput type="datetime-local" {...form.register("deliveredAt")} />
          </FormField>
        </div>

        <FormField label="Kanıt resmi yolu">
          <TextInput {...form.register("proofImagePath")} placeholder="proofs/route-id/stop-id.jpg" />
        </FormField>

        {serverError ? (
          <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {serverError}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <Button disabled={isPending} type="submit">
            {isPending ? "Kaydediliyor..." : stop ? "Durağı güncelle" : "Durak ekle"}
          </Button>
          {stop ? (
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.push(`/routes/${routeId}`)}
            >
              Düzenlemeyi iptal et
            </Button>
          ) : null}
        </div>
      </form>
    </Card>
  );
}
