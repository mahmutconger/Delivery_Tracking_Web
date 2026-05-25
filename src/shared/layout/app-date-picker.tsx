"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { useOperationDate } from "@/core/context/operation-date-context";

export function AppDatePicker() {
  const { date, setDate } = useOperationDate();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newDate = e.target.value;
    if (!newDate) return;

    setDate(newDate);

    // Propagate to URL so server components re-fetch with the new date
    const params = new URLSearchParams(searchParams.toString());
    params.set("routeDate", newDate);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <label className="flex items-center gap-2 text-sm text-slate-600">
      <span className="hidden sm:inline">Tarih</span>
      <input
        className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 shadow-sm"
        onChange={handleChange}
        type="date"
        value={date}
      />
    </label>
  );
}
