"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { CATEGORY_ALL } from "@/lib/constants";
import type { Category } from "@/lib/supabase/types";

export function CategoryFilter({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const active = searchParams.get("kategori") ?? CATEGORY_ALL;

  function select(name: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (name === CATEGORY_ALL) {
      params.delete("kategori");
    } else {
      params.set("kategori", name);
    }
    params.delete("page");
    // replace (not push) so flipping through categories doesn't pile up
    // back-button history; wrapped in startTransition so the active tag
    // can show pending feedback instantly instead of feeling frozen.
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`);
    });
  }

  const tags = [CATEGORY_ALL, ...categories.map((c) => c.name)];

  return (
    <div
      className={`flex flex-wrap gap-2 w-full max-w-4xl transition-opacity ${
        isPending ? "opacity-50" : ""
      }`}
    >
      {tags.map((tag) => (
        <button
          key={tag}
          onClick={() => select(tag)}
          aria-pressed={active === tag}
          className={`category-tag ${active === tag ? "active" : ""}`}
        >
          {tag === CATEGORY_ALL ? "Semua Kategori" : tag}
        </button>
      ))}
    </div>
  );
}
