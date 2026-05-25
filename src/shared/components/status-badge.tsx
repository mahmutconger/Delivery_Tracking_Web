import { cn } from "@/shared/utils/cn";

const toneMap: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  inactive: "bg-slate-100 text-slate-600 ring-slate-200",
  assigned: "bg-blue-50 text-blue-700 ring-blue-200",
  unassigned: "bg-amber-50 text-amber-700 ring-amber-200",
  draft: "bg-slate-100 text-slate-700 ring-slate-200",
  in_progress: "bg-blue-50 text-blue-700 ring-blue-200",
  completed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  cancelled: "bg-rose-50 text-rose-700 ring-rose-200",
  delivered: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  pending: "bg-amber-50 text-amber-700 ring-amber-200",
  uploaded: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  uploading: "bg-blue-50 text-blue-700 ring-blue-200",
  failed: "bg-rose-50 text-rose-700 ring-rose-200",
  stale: "bg-rose-50 text-rose-700 ring-rose-200",
  fresh: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  sent: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  sms: "bg-slate-100 text-slate-700 ring-slate-200",
  whatsapp: "bg-emerald-50 text-emerald-700 ring-emerald-200",
};

const labelMap: Record<string, string> = {
  active: "Aktif",
  inactive: "Pasif",
  assigned: "Atandı",
  unassigned: "Atanmadı",
  draft: "Taslak",
  in_progress: "Devam ediyor",
  completed: "Tamamlandı",
  cancelled: "İptal edildi",
  delivered: "Teslim edildi",
  pending: "Bekliyor",
  uploaded: "Yüklendi",
  uploading: "Yükleniyor",
  failed: "Başarısız",
  stale: "Güncel değil",
  fresh: "Güncel",
  none: "Yok",
  sent: "Gönderildi",
  sms: "SMS",
  whatsapp: "WhatsApp",
};

export function StatusBadge({
  value,
  className,
}: {
  value: string;
  className?: string;
}) {
  const normalized = value.toLowerCase();

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
        toneMap[normalized] ?? "bg-slate-100 text-slate-700 ring-slate-200",
        className,
      )}
    >
      {labelMap[value.toLowerCase()] ?? value.replaceAll("_", " ")}
    </span>
  );
}
