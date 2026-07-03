"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useEffect, useTransition } from "react";
import { useSortPending } from "./sort-pending-context";

const SORT_OPTIONS = [
  { value: "relevan",    label: "Relevan" },
  { value: "terbaru",   label: "Terbaru" },
  { value: "harga-asc", label: "Harga Terendah" },
  { value: "harga-desc",label: "Harga Tertinggi" },
  { value: "diskon",    label: "Diskon Terbesar" },
  { value: "nama-az",   label: "Nama A–Z" },
] as const;

export type SortValue = (typeof SORT_OPTIONS)[number]["value"];

export function SortSelect() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const active = (searchParams.get("sort") ?? "relevan") as SortValue;
  const { notify } = useSortPending();

  useEffect(() => { notify(isPending); }, [isPending, notify]);

  function onChange(val: SortValue) {
    const params = new URLSearchParams(searchParams.toString());
    if (val === "relevan") { params.delete("sort"); } else { params.set("sort", val); }
    params.delete("page");
    startTransition(() => { router.replace(`${pathname}?${params.toString()}`); });
  }

  return (
    <div className={`flex items-center gap-2 transition-opacity ${isPending ? "opacity-50" : ""}`}>
      <span className="text-xs text-muted font-medium whitespace-nowrap">Urutkan:</span>
      <select
        value={active}
        onChange={(e) => onChange(e.target.value as SortValue)}
        className="text-xs font-semibold bg-surface border border-border-subtle rounded-xl px-3 py-2 text-foreground focus:outline-none focus:border-accent cursor-pointer transition"
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}
