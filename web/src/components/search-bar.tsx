"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useEffect, useRef, useState, useTransition, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

type GameHit = {
  slug: string;
  name: string;
  price: number;
  original_price: number | null;
  cover_url: string | null;
};

const supabase = createClient();

export function SearchBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [value, setValue] = useState(searchParams.get("q") ?? "");
  const [hits, setHits] = useState<GameHit[]>([]);
  const [open, setOpen] = useState(false);
  const isMounted = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Real-time dropdown — query Supabase directly, zero server round-trip
  const fetchHits = useCallback(async (q: string) => {
    if (!q.trim()) { setHits([]); setOpen(false); return; }

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    let query = supabase
      .from("games")
      .select("slug, name, price, original_price, cover_url")
      .eq("status", "active");

    const trimmedQ = q.trim();
    const lowerQ = trimmedQ.toLowerCase();
    if (lowerQ.includes("gta")) {
      const expanded = trimmedQ.replace(/gta/gi, "grand theft auto");
      query = query.or(`name.ilike.%${trimmedQ}%,name.ilike.%${expanded}%`);
    } else if (lowerQ.includes("grand theft auto")) {
      const contracted = trimmedQ.replace(/grand theft auto/gi, "gta");
      query = query.or(`name.ilike.%${trimmedQ}%,name.ilike.%${contracted}%`);
    } else {
      query = query.ilike("name", `%${trimmedQ}%`);
    }

    const { data } = await query
      .order("is_new", { ascending: false })
      .order("name", { ascending: true })
      .limit(8);

    setHits(data ?? []);
    setOpen(true);
  }, []);

  useEffect(() => {
    fetchHits(value);
  }, [value, fetchHits]);

  // Update URL for full catalog (only on user-driven changes, not on mount)
  useEffect(() => {
    if (!isMounted.current) { isMounted.current = true; return; }
    const handle = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) { params.set("q", value); } else { params.delete("q"); }
      params.delete("page");
      startTransition(() => { router.replace(`${pathname}?${params.toString()}`); });
    }, 200);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setOpen(false);
    const params = new URLSearchParams(searchParams.toString());
    if (value.trim()) { params.set("q", value.trim()); } else { params.delete("q"); }
    params.delete("page");
    startTransition(() => { router.push(`${pathname}?${params.toString()}`); });
  }

  const discount = (g: GameHit) =>
    g.original_price && g.original_price > g.price
      ? Math.round((1 - g.price / g.original_price) * 100)
      : null;

  return (
    <div ref={containerRef} className="relative mb-4 max-w-4xl">
      <form onSubmit={onSubmit} role="search">
        <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-muted pointer-events-none z-10">
          {isPending ? (
            <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          )}
        </span>
        <input
          type="search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => { if (hits.length > 0) setOpen(true); }}
          placeholder="Cari game..."
          aria-label="Cari game"
          autoComplete="off"
          className="w-full bg-surface border border-border-subtle rounded-2xl py-3.5 pl-11 pr-4 text-sm text-foreground placeholder-muted focus:outline-none focus:border-accent transition"
        />
      </form>

      {/* Real-time dropdown */}
      {open && hits.length > 0 && (
        <div className="absolute top-full mt-2 w-full bg-surface border border-border-subtle rounded-2xl shadow-xl z-50 overflow-hidden">
          {hits.map((g) => {
            const pct = discount(g);
            return (
              <Link
                key={g.slug}
                href={`/game/${g.slug}`}
                onClick={() => { setOpen(false); setValue(""); }}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-border-subtle transition-colors group"
              >
                {/* Cover thumbnail */}
                <div className="w-12 h-16 rounded-lg overflow-hidden flex-none bg-border-subtle">
                  {g.cover_url ? (
                    <Image src={g.cover_url} alt={g.name} width={48} height={64}
                      className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full" />
                  )}
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate group-hover:text-accent transition-colors">
                    {g.name}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {pct && (
                      <span className="text-xs font-bold text-emerald-400">-{pct}%</span>
                    )}
                    <span className="text-xs text-muted">
                      Rp {g.price.toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
          {/* Footer: lihat semua */}
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              setOpen(false);
              const params = new URLSearchParams();
              if (value.trim()) params.set("q", value.trim());
              startTransition(() => { router.push(`${pathname}?${params.toString()}`); });
            }}
            className="w-full px-4 py-3 text-xs text-accent font-semibold border-t border-border-subtle hover:bg-border-subtle transition-colors text-center"
          >
            Lihat semua hasil untuk &ldquo;{value}&rdquo; →
          </button>
        </div>
      )}
    </div>
  );
}
