"use client";

import { useState } from "react";

import { toRouteDate } from "@/core/utils/date";
import { Button } from "@/shared/components/button";
import { SpecialProgressOverlay } from "@/shared/components/special-progress";

function firstDayOfMonth(today: string) {
  return today.slice(0, 8) + "01";
}

export function RouteExportForm() {
  const today = toRouteDate(new Date());
  const [startDate, setStartDate] = useState(firstDayOfMonth(today));
  const [endDate, setEndDate] = useState(today);
  const [phase, setPhase] = useState<"idle" | "loading" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleExport(e: React.FormEvent) {
    e.preventDefault();
    setPhase("loading");
    setErrorMsg(null);

    try {
      const url = `/api/admin/routes/export?startDate=${startDate}&endDate=${endDate}`;
      const res = await fetch(url);

      if (!res.ok) {
        const json = (await res.json()) as { error?: { message: string } };
        setErrorMsg(json.error?.message ?? "Dışa aktarma başarısız.");
        setPhase("error");
        return;
      }

      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = `rotalar_${startDate}_${endDate}.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
      setPhase("idle");
    } catch {
      setErrorMsg("Ağ hatası oluştu, tekrar deneyin.");
      setPhase("error");
    }
  }

  return (
    <form
      className="flex flex-wrap items-end gap-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
      onSubmit={(e) => void handleExport(e)}
    >
      <SpecialProgressOverlay
        description="Seçilen tarih aralığı CSV olarak hazırlanıyor."
        open={phase === "loading"}
        title="Dışa aktarılıyor"
      />
      <label className="space-y-1.5 text-sm font-medium text-slate-800">
        <span>Başlangıç tarihi</span>
        <input
          className="block h-10 rounded-xl border border-slate-300 px-3 text-sm"
          max={endDate}
          onChange={(e) => setStartDate(e.target.value)}
          required
          type="date"
          value={startDate}
        />
      </label>
      <label className="space-y-1.5 text-sm font-medium text-slate-800">
        <span>Bitiş tarihi</span>
        <input
          className="block h-10 rounded-xl border border-slate-300 px-3 text-sm"
          min={startDate}
          max={today}
          onChange={(e) => setEndDate(e.target.value)}
          required
          type="date"
          value={endDate}
        />
      </label>
      <div className="flex flex-col gap-1">
        <Button disabled={phase === "loading"} type="submit">
          {phase === "loading" ? "Hazırlanıyor…" : "CSV indir"}
        </Button>
        {phase === "error" && errorMsg && (
          <p className="text-xs text-rose-600">{errorMsg}</p>
        )}
      </div>
    </form>
  );
}
