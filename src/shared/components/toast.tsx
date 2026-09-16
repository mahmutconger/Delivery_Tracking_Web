"use client";

import { CheckCircle2, Info, TriangleAlert, X, XCircle } from "lucide-react";
import type { ComponentType } from "react";

import { cn } from "@/shared/utils/cn";

export type ToastTone = "success" | "error" | "warning" | "info";

export interface ToastItem {
  id: string;
  tone: ToastTone;
  title: string;
  description?: string;
}

const toneStyles: Record<ToastTone, { card: string; icon: string }> = {
  success: {
    card: "border-emerald-200 bg-emerald-50 text-emerald-900",
    icon: "text-emerald-600",
  },
  error: {
    card: "border-rose-200 bg-rose-50 text-rose-900",
    icon: "text-rose-600",
  },
  warning: {
    card: "border-amber-200 bg-amber-50 text-amber-900",
    icon: "text-amber-600",
  },
  info: {
    card: "border-slate-200 bg-white text-slate-900",
    icon: "text-slate-600",
  },
};

const toneIcons: Record<ToastTone, ComponentType<{ className?: string }>> = {
  success: CheckCircle2,
  error: XCircle,
  warning: TriangleAlert,
  info: Info,
};

/**
 * @brief Tek bir bildirim kartını çizer.
 * @param toast Gösterilecek bildirim verisi.
 * @param onDismiss Kapat butonuna basıldığında çağrılır.
 */
export function ToastCard({
  toast,
  onDismiss,
}: {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}) {
  const styles = toneStyles[toast.tone];
  const Icon = toneIcons[toast.tone];

  return (
    <div
      className={cn(
        "pointer-events-auto flex w-full items-start gap-3 rounded-2xl border p-4 shadow-lg toast-enter",
        styles.card,
      )}
      role={toast.tone === "error" ? "alert" : "status"}
    >
      <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", styles.icon)} />
      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-sm font-semibold">{toast.title}</p>
        {toast.description ? (
          <p className="text-sm opacity-80">{toast.description}</p>
        ) : null}
      </div>
      <button
        aria-label="Bildirimi kapat"
        className="shrink-0 rounded-lg p-1 opacity-60 transition hover:opacity-100"
        onClick={() => onDismiss(toast.id)}
        type="button"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

/**
 * @brief Ekranın sağ üst köşesinde bildirim yığınını konumlandırır.
 * @param toasts Gösterilecek bildirimler (en yenisi en üstte).
 * @param onDismiss Bir bildirim kapatıldığında çağrılır.
 */
export function ToastViewport({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}) {
  if (toasts.length === 0) {
    return null;
  }

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-4 top-4 z-[70] flex flex-col gap-3 sm:inset-x-auto sm:right-6 sm:top-6 sm:w-96"
    >
      {toasts.map((toast) => (
        <ToastCard key={toast.id} onDismiss={onDismiss} toast={toast} />
      ))}
    </div>
  );
}
