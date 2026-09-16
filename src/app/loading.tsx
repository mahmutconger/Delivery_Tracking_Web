import { SpecialProgressBlock } from "@/shared/components/special-progress";

export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <SpecialProgressBlock className="bg-transparent" label="Yükleniyor…" />
    </div>
  );
}
