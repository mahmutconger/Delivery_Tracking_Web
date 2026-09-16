"use client";

import { useEffect, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";

import { useToast } from "@/core/context/toast-context";
import { useDebounce } from "@/core/hooks/use-debounce";
import { useThrottleWithCooldown } from "@/core/hooks/use-throttle";
import { publicEnv } from "@/core/env/public";
import { toDateTimeLocalInput } from "@/core/utils/date";
import type { DeliveryStop } from "@/features/stops/domain/models";
import {
  PROOF_UPLOAD_STATES,
  STOP_STATUSES,
} from "@/features/stops/domain/models";
import { stopCreateSchema } from "@/features/stops/domain/schemas";
import {
  CoordinatePicker,
  type CoordinateFocus,
} from "@/features/maps/ui/coordinate-picker";
import { Button } from "@/shared/components/button";
import { Card, CardTitle } from "@/shared/components/card";
import {
  SpecialProgressInline,
  SpecialProgressOverlay,
} from "@/shared/components/special-progress";
import {
  FormField,
  SelectInput,
  TextArea,
  TextInput,
} from "@/shared/forms/form-field";

const stopStatusLabels: Record<string, string> = {
  pending: "Bekliyor",
  in_progress: "Devam Ediyor",
  delivered: "Teslim Edildi",
  failed: "Başarısız",
};

const proofUploadStateLabels: Record<string, string> = {
  none: "Yok",
  pending: "Bekliyor",
  uploaded: "Yüklendi",
  failed: "Başarısız",
};

const mapTileUrl =
  publicEnv.NEXT_PUBLIC_MAP_TILE_URL ??
  "https://tile.openstreetmap.de/{z}/{x}/{y}.png";
const mapAttribution =
  publicEnv.NEXT_PUBLIC_MAP_ATTRIBUTION ??
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

const fallbackLatitude = 41.0082;
const fallbackLongitude = 28.9784;

type StopValues = z.input<typeof stopCreateSchema>;

interface GeocodeResult {
  displayName: string;
  latitude: number;
  longitude: number;
}

/**
 * @brief Formun başlangıç değerlerini üretir.
 * @param stop Düzenlenen durak; yeni durak eklenirken null/undefined.
 * @param newStopDeliveredAt Yeni durak için ön-doldurulacak teslim tarihi (SSR'da null geçilir).
 * @returns react-hook-form için değer nesnesi.
 */
function toStopFormValues(
  stop: DeliveryStop | null | undefined,
  newStopDeliveredAt: string | null,
): StopValues {
  if (!stop) {
    return {
      sequence: undefined,
      customerName: "",
      address: "",
      latitude: fallbackLatitude,
      longitude: fallbackLongitude,
      status: "pending",
      deliveredAt: newStopDeliveredAt,
      proofImagePath: null,
      proofUploadState: "none",
    };
  }

  return {
    sequence: stop.sequence,
    customerName: stop.customerName,
    address: stop.address,
    latitude: stop.latitude,
    longitude: stop.longitude,
    status: (stop.status as StopValues["status"]) ?? "pending",
    deliveredAt: stop.deliveredAt
      ? toDateTimeLocalInput(new Date(stop.deliveredAt))
      : null,
    proofImagePath: stop.proofImagePath ?? null,
    proofUploadState:
      (stop.proofUploadState as StopValues["proofUploadState"]) ?? "none",
  };
}

/**
 * @brief Durak ekleme ve düzenleme formu.
 *
 * Not: Başka bir durağa geçerken çağıran taraf `key={stop?.id ?? "new-stop"}` vermelidir;
 * form alanları böylece yeni durağın verileriyle sıfırdan doldurulur (bkz. StopsPanel).
 *
 * @param routeId Durağın bağlı olduğu rota kimliği.
 * @param stop Düzenlenecek durak; verilmezse form ekleme modunda çalışır.
 * @param onSaved Kayıt başarılı olduğunda çağrılır (ekleme mi güncelleme mi olduğunu bildirir).
 * @param onCancelEdit Düzenleme iptal edildiğinde çağrılır.
 */
export function StopForm({
  routeId,
  stop,
  onSaved,
  onCancelEdit,
}: {
  routeId: string;
  stop?: DeliveryStop | null;
  onSaved?: (result: { mode: "create" | "update"; stopId?: string }) => void;
  onCancelEdit?: () => void;
}) {
  const router = useRouter();
  const { showError, showSuccess, showToast } = useToast();
  const [serverError, setServerError] = useState<string | null>(null);
  const [geocodeResults, setGeocodeResults] = useState<GeocodeResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [addressQuery, setAddressQuery] = useState(stop?.address ?? "");
  const [mapFocus, setMapFocus] = useState<CoordinateFocus | null>(null);
  const debouncedQuery = useDebounce(addressQuery, 500);
  const focusTokenRef = useRef(0);
  // Programatik olarak yazılan sorgular için otomatik arama tetiklenmez.
  const suppressedQueryRef = useRef<string | null>(stop?.address ?? "");

  const form = useForm<StopValues>({
    // İlk render sunucuda da çalıştığı için burada "şu an" kullanılmaz;
    // yeni duraktaki teslim tarihi mount sonrası effect ile doldurulur.
    defaultValues: toStopFormValues(stop, null),
    resolver: zodResolver(stopCreateSchema),
  });
  const latitude = useWatch({ control: form.control, name: "latitude" });
  const longitude = useWatch({ control: form.control, name: "longitude" });

  function focusMap(nextLatitude: number, nextLongitude: number, zoom?: number) {
    focusTokenRef.current += 1;
    setMapFocus({
      latitude: nextLatitude,
      longitude: nextLongitude,
      zoom,
      token: focusTokenRef.current,
    });
  }

  function setAddressQuerySilently(value: string) {
    suppressedQueryRef.current = value;
    setAddressQuery(value);
  }

  function resetToStop(nextStop: DeliveryStop | null | undefined) {
    form.reset(toStopFormValues(nextStop, toDateTimeLocalInput()));
    setAddressQuerySilently(nextStop?.address ?? "");
    setGeocodeResults([]);
    setServerError(null);

    // Pin nereye taşındıysa harita da oraya baksın.
    if (nextStop) {
      focusMap(nextStop.latitude, nextStop.longitude);
    } else {
      focusMap(fallbackLatitude, fallbackLongitude, 12);
    }
  }

  // Teslim tarihi bugünle ön-doldurulur. Bu değer sunucu ve istemcide farklı
  // olabileceğinden hydration uyuşmazlığını önlemek için mount sonrasında yazılır.
  useEffect(() => {
    if (stop) return;
    form.setValue("deliveredAt", toDateTimeLocalInput());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Kullanıcı yazmayı bıraktığında (500 ms) adresi otomatik ara.
  useEffect(() => {
    if (suppressedQueryRef.current === debouncedQuery) return;
    if (debouncedQuery.trim().length < 3) return;

    void searchAddress(debouncedQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery]);

  async function searchAddress(query = addressQuery) {
    if (query.trim().length < 3) {
      showToast({
        tone: "warning",
        title: "Arama çok kısa",
        description: "Aramak için en az 3 karakter girin.",
      });
      return;
    }

    setIsSearching(true);
    setGeocodeResults([]);
    setServerError(null);

    try {
      const response = await fetch(
        `/api/admin/geocode/search?q=${encodeURIComponent(query)}`,
      );
      const payload = await response.json();

      if (!response.ok || !payload.ok) {
        const message = payload.error?.message ?? "Adres araması başarısız.";
        setServerError(message);
        showError("Adres bulunamadı", message);
        return;
      }

      const results: GeocodeResult[] = payload.data.results ?? [];
      setGeocodeResults(results);

      if (results.length === 0) {
        showToast({
          tone: "info",
          title: "Sonuç yok",
          description: "Bu adres için kayıt bulunamadı, aramayı değiştirin.",
        });
      }
    } catch {
      const message = "Adres servisine ulaşılamadı. Tekrar deneyin.";
      setServerError(message);
      showError("Adres bulunamadı", message);
    } finally {
      setIsSearching(false);
    }
  }

  function selectGeocodeResult(result: GeocodeResult) {
    form.setValue("address", result.displayName, { shouldValidate: true });
    form.setValue("latitude", result.latitude, { shouldValidate: true });
    form.setValue("longitude", result.longitude, { shouldValidate: true });
    setAddressQuerySilently(result.displayName);
    setGeocodeResults([]);
    focusMap(result.latitude, result.longitude);
  }

  async function onSubmitInner(values: StopValues) {
    setServerError(null);
    setIsPending(true);

    const isUpdate = Boolean(stop);
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

    let payload: {
      ok: boolean;
      error?: { message?: string };
      data?: { stopId?: string };
    } | null = null;

    try {
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
      payload = await response.json();

      if (!response.ok || !payload?.ok) {
        const message = payload?.error?.message ?? "Durak kaydedilemedi.";
        setServerError(message);
        showError(
          isUpdate ? "Durak güncellenemedi" : "Durak eklenirken hata oluştu",
          message,
        );
        return;
      }
    } catch {
      const message = "Sunucuya ulaşılamadı. Bağlantınızı kontrol edin.";
      setServerError(message);
      showError(
        isUpdate ? "Durak güncellenemedi" : "Durak eklenirken hata oluştu",
        message,
      );
      return;
    } finally {
      setIsPending(false);
    }

    if (isUpdate) {
      showSuccess("Durak güncellendi", `${values.customerName} kaydedildi.`);
    } else {
      // Ekleme modunda form bir sonraki durak için tamamen temizlenir.
      resetToStop(null);
      showSuccess("Durak başarıyla eklendi", `${values.customerName} rotaya eklendi.`);
    }

    onSaved?.({
      mode: isUpdate ? "update" : "create",
      stopId: stop?.id ?? payload?.data?.stopId,
    });
    router.refresh();
  }

  const { call: callSubmit, getRemainingMs } = useThrottleWithCooldown(
    (values: StopValues) => void onSubmitInner(values),
    3000,
  );

  function onSubmit(values: StopValues) {
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
    <Card>
      <SpecialProgressOverlay
        description={
          stop ? "Değişiklikler kaydediliyor." : "Durak rotaya ekleniyor."
        }
        open={isPending}
        title={stop ? "Durak güncelleniyor" : "Durak ekleniyor"}
      />

      <CardTitle>{stop ? "Durağı düzenle" : "Durak ekle"}</CardTitle>
      {stop ? (
        <p className="mt-1 text-sm text-slate-600">
          {stop.sequence}. sıradaki durak düzenleniyor.
        </p>
      ) : null}

      <form
        className="mt-5 space-y-4"
        onSubmit={form.handleSubmit(onSubmit, onInvalid)}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            label="Sıra numarası"
            error={form.formState.errors.sequence?.message}
            hint={
              stop
                ? "Sırayı değiştirmek için “Durakları sırala” bölümünü kullanın."
                : "Sona eklemek için boş bırakın."
            }
          >
            <TextInput
              type="number"
              min={1}
              readOnly={Boolean(stop)}
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
              onChange={(event) => {
                suppressedQueryRef.current = null;
                setAddressQuery(event.target.value);
              }}
              placeholder="Adrese göre ara"
            />
            <Button
              className="shrink-0"
              disabled={isSearching}
              onClick={() => void searchAddress()}
              type="button"
            >
              {isSearching ? "Aranıyor..." : "Ara"}
            </Button>
          </div>
        </FormField>

        {/* Arama yazarken tetiklendiği için engellemeyen satır içi gösterge kullanılır. */}
        {isSearching ? <SpecialProgressInline label="Adres aranıyor…" /> : null}

        {geocodeResults.length > 0 ? (
          <div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            {geocodeResults.map((result) => (
              <button
                key={`${result.latitude}-${result.longitude}`}
                className="block w-full rounded-xl bg-white px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-100"
                onClick={() => selectGeocodeResult(result)}
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

        <div className="space-y-2">
          <CoordinatePicker
            value={{
              latitude,
              longitude,
            }}
            onChange={(value) => {
              form.setValue("latitude", value.latitude, { shouldValidate: true });
              form.setValue("longitude", value.longitude, { shouldValidate: true });
            }}
            tileUrl={mapTileUrl}
            attribution={mapAttribution}
            focus={mapFocus}
          />
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-slate-500">
              Konumu haritaya tıklayarak da seçebilirsiniz.
            </p>
            <button
              className="text-sm font-medium text-slate-900 underline underline-offset-2 disabled:text-slate-400 disabled:no-underline"
              disabled={!Number.isFinite(latitude) || !Number.isFinite(longitude)}
              onClick={() => focusMap(latitude, longitude)}
              type="button"
            >
              Pine yaklaş
            </button>
          </div>
        </div>

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
          <FormField
            label="Teslim tarihi"
            error={form.formState.errors.deliveredAt?.message}
            hint="Bugünün tarihi ile gelir, değiştirebilirsiniz."
          >
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
            {isPending
              ? "Kaydediliyor..."
              : stop
                ? "Durağı güncelle"
                : "Durak ekle"}
          </Button>
          {stop ? (
            <Button
              disabled={isPending}
              onClick={() => onCancelEdit?.()}
              type="button"
              variant="secondary"
            >
              Düzenlemeyi iptal et
            </Button>
          ) : (
            <Button
              disabled={isPending}
              onClick={() => resetToStop(null)}
              type="button"
              variant="ghost"
            >
              Formu temizle
            </Button>
          )}
        </div>
      </form>
    </Card>
  );
}
