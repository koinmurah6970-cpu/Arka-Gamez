"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import type { Genre } from "@/lib/supabase/types";

const GENRE_ALL = "semua";

export function GenreFilter({ genres }: { genres: Genre[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const active = searchParams.get("genre") ?? GENRE_ALL;

  function select(slug: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (slug === GENRE_ALL) {
      params.delete("genre");
    } else {
      params.set("genre", slug);
    }
    params.delete("page");
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`);
    });
  }

  return (
    <div
      className={`flex gap-2 overflow-x-auto md:flex-wrap md:overflow-visible pb-4 no-scrollbar w-full max-w-4xl transition-opacity ${
        isPending ? "opacity-50" : ""
      }`}
    >
      <button
        onClick={() => select(GENRE_ALL)}
        aria-pressed={active === GENRE_ALL}
        className={`category-tag ${active === GENRE_ALL ? "active" : ""}`}
      >
        Semua Genre
      </button>
      {genres.map((g) => (
        <button
          key={g.id}
          onClick={() => select(g.slug)}
          aria-pressed={active === g.slug}
          className={`category-tag ${active === g.slug ? "active" : ""}`}
        >
          {g.name}
        </button>
      ))}
      <div className="w-4 flex-shrink-0 md:hidden" />
    </div>
  );
}
