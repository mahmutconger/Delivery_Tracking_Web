"use client";

import { useRef, useState } from "react";

import { Button } from "@/shared/components/button";
import { Card, CardTitle } from "@/shared/components/card";

interface ImportResult {
  imported: number;
  rejected: Array<{ rowIndex: number; rawRow: Record<string, string>; reason: string }>;
  importErrors: Array<{ stopInput: unknown; error: string }>;
}

export function StopImportForm({ routeId }: { routeId: string }) {
  const [phase, setPhase] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [result, setResult] = useState<ImportResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) return;

    setPhase("loading");
    setResult(null);
    setErrorMsg(null);

    try {
      const body = new FormData();
      body.append("file", file);

      const res = await fetch(`/api/admin/routes/${routeId}/stops/import`, {
        method: "POST",
        body,
      });

      const json = (await res.json()) as { ok: boolean; data?: ImportResult; error?: { message: string } };

      if (!res.ok) {
        setErrorMsg(json.error?.message ?? "İçe aktarma başarısız.");
        setPhase("error");
        return;
      }

      setResult(json.data!);
      setPhase("done");
      if (fileRef.current) fileRef.current.value = "";
    } catch {
      setErrorMsg("Ağ hatası oluştu, tekrar deneyin.");
      setPhase("error");
    }
  }

  return (
    <Card>
      <CardTitle>CSV ile toplu durak aktar</CardTitle>
      <p className="mt-1 text-sm text-slate-500">
        Beklenen sütunlar: <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">customerName, address, latitude, longitude</code>.
        Sıra numarası opsiyonel.
      </p>

      <form className="mt-4 space-y-3" onSubmit={(e) => void handleSubmit(e)}>
        <input
          ref={fileRef}
          accept=".csv,text/csv"
          className="block w-full text-sm text-slate-600 file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium hover:file:bg-slate-200"
          required
          type="file"
        />
        <Button disabled={phase === "loading"} type="submit">
          {phase === "loading" ? "Aktarılıyor…" : "CSV yükle"}
        </Button>
      </form>

      {phase === "done" && result && (
        <div className="mt-4 space-y-3">
          <p className="rounded-xl bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
            {result.imported} durak başarıyla eklendi.
          </p>

          {result.rejected.length > 0 && (
            <details className="rounded-xl border border-amber-200 bg-amber-50 p-3">
              <summary className="cursor-pointer text-sm font-medium text-amber-700">
                {result.rejected.length} satır reddedildi — detaylar için tıklayın
              </summary>
              <ul className="mt-2 space-y-1 text-xs text-amber-800">
                {result.rejected.map((row) => (
                  <li key={row.rowIndex}>
                    <span className="font-medium">Satır {row.rowIndex + 1}:</span> {row.reason}
                  </li>
                ))}
              </ul>
            </details>
          )}

          {result.importErrors.length > 0 && (
            <p className="text-xs text-rose-600">
              {result.importErrors.length} kayıt Firestore'a yazılamadı.
            </p>
          )}
        </div>
      )}

      {phase === "error" && errorMsg && (
        <p className="mt-3 rounded-xl bg-rose-50 px-4 py-2 text-sm text-rose-600">
          {errorMsg}
        </p>
      )}
    </Card>
  );
}
