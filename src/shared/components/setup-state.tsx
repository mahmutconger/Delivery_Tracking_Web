import { Card } from "@/shared/components/card";

export function SetupState({
  title = "Firebase kurulumu tamamlanmamış",
  description,
}: {
  title?: string;
  description: string;
}) {
  return (
    <Card className="border-amber-200 bg-amber-50/70">
      <div className="space-y-2 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">
          Kurulum gerekli
        </p>
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        <p className="text-sm text-slate-700">{description}</p>
      </div>
    </Card>
  );
}
