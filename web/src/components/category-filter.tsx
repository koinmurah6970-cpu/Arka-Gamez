"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { CATEGORY_ALL } from "@/lib/constants";
import type { Category } from "@/lib/supabase/types";

export function CategoryFilter({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const active = searchParams.get("kategori") ?? CATEGORY_ALL;

  function select(name: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (name === CATEGORY_ALL) {
      params.delete("kategori");
    } else {
      params.set("kategori", name);
    }
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  const tags = [CATEGORY_ALL, ...categories.map((c) => c.name)];

  return (
    <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar max-w-4xl">
      {tags.map((tag) => (
        <div
          key={tag}
          onClick={() => select(tag)}
          className={`category-tag ${active === tag ? "active" : ""}`}
        >
          {tag === CATEGORY_ALL ? "🏷️ Semua" : tag}
        </div>
      ))}
    </div>
  );
}
