"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function OrderSearchForm({ defaultValue }: { defaultValue: string }) {
  const router = useRouter();
  const [value, setValue] = useState(defaultValue);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    startTransition(() => {
      router.push(`/cek-pesanan?no=${encodeURIComponent(trimmed)}`);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Masukkan nomor pesanan (GAM-XXXXXX)"
        className="flex-1 bg-surface border border-border-subtle rounded-xl px-4 py-3 text-sm font-mono text-foreground focus:outline-none focus:border-accent transition"
      />
      <button
        type="submit"
        disabled={isPending}
        className="bg-accent text-accent-foreground text-sm font-bold px-5 py-3 rounded-xl hover:opacity-90 transition disabled:opacity-60"
      >
        {isPending ? "..." : "Cek"}
      </button>
    </form>
  );
}
