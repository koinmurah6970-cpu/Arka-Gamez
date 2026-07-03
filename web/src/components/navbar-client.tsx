"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "./cart-context";
import { createClient } from "@/lib/supabase/client";
import { ThemeToggle } from "./theme-toggle";

type GameHit = {
  slug: string;
  name: string;
  price: number;
  original_price: number | null;
  cover_url: string | null;
};

const supabase = createClient();

export function NavbarClient({
  user,
}: {
  user: { displayName: string; role: string } | null;
}) {
  const { count } = useCart();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [hits, setHits] = useState<GameHit[]>([]);
  const [dropOpen, setDropOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  const fetchHits = useCallback(async (q: string) => {
    if (!q.trim()) { setHits([]); setDropOpen(false); return; }
    const { data } = await supabase
      .from("games")
      .select("slug, name, price, original_price, cover_url")
      .eq("status", "active")
      .ilike("name", `%${q}%`)
      .order("is_new", { ascending: false })
      .order("name", { ascending: true })
      .limit(8);
    setHits(data ?? []);
    setDropOpen(true);
  }, []);

  useEffect(() => { fetchHits(searchValue); }, [searchValue, fetchHits]);

  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setDropOpen(false);
      }
      if (mobileSearchRef.current && !mobileSearchRef.current.contains(e.target as Node)) {
        setMobileSearchOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  function openMobileSearch() {
    setMobileSearchOpen(true);
    setTimeout(() => mobileInputRef.current?.focus(), 50);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = searchValue.trim();
    setDropOpen(false);
    router.push(q ? `/?q=${encodeURIComponent(q)}` : "/");
  }

  const discount = (g: GameHit) =>
    g.original_price && g.original_price > g.price
      ? Math.round((1 - g.price / g.original_price) * 100)
      : null;

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setMenuOpen(false);
    router.push("/");
    router.refresh();
  }

  return (
    <nav className="bg-background/60 backdrop-blur-xl border-b border-border-subtle p-4 sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center max-w-7xl">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 bg-[#0b0f19] rounded-lg flex items-center justify-center font-black text-white italic text-lg">
              L
            </div>
            <span className="text-lg font-extrabold tracking-tight text-foreground">
              Link <span className="text-muted font-medium">Yu</span>
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm font-semibold text-muted">
            <Link href="/" className="hover:text-accent transition">
              BERANDA
            </Link>
            <Link href="/promo" className="hover:text-accent transition">
              PROMO
            </Link>
            <Link href="/cek-pesanan" className="hover:text-accent transition">
              CEK PESANAN
            </Link>
          </div>
        </div>

        <div ref={searchRef} className="hidden md:block flex-1 max-w-xs mx-4 relative">
          <form onSubmit={handleSearch}>
            <input
              type="search"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onFocus={() => { if (hits.length > 0) setDropOpen(true); }}
              placeholder="Cari game..."
              aria-label="Cari game"
              autoComplete="off"
              className="w-full bg-border-subtle border border-transparent rounded-xl px-3.5 py-2 text-sm text-foreground focus:outline-none focus:border-accent transition"
            />
          </form>

          {dropOpen && hits.length > 0 && (
            <div className="absolute top-full mt-2 w-80 bg-surface border border-border-subtle rounded-2xl shadow-xl z-50 overflow-hidden">
              {hits.map((g) => {
                const pct = discount(g);
                return (
                  <Link
                    key={g.slug}
                    href={`/game/${g.slug}`}
                    onClick={() => { setDropOpen(false); setSearchValue(""); }}
                    className="flex items-center gap-3 px-3 py-2.5 hover:bg-border-subtle transition-colors group"
                  >
                    <div className="w-10 h-14 rounded-lg overflow-hidden flex-none bg-border-subtle">
                      {g.cover_url ? (
                        <Image src={g.cover_url} alt={g.name} width={40} height={56}
                          className="w-full h-full object-cover" />
                      ) : <div className="w-full h-full" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate group-hover:text-accent transition-colors">
                        {g.name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {pct && <span className="text-xs font-bold text-emerald-400">-{pct}%</span>}
                        <span className="text-xs text-muted">Rp {g.price.toLocaleString("id-ID")}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
              <button
                onMouseDown={(e) => {
                  e.preventDefault();
                  setDropOpen(false);
                  router.push(searchValue.trim() ? `/?q=${encodeURIComponent(searchValue.trim())}` : "/");
                }}
                className="w-full px-4 py-2.5 text-xs text-accent font-semibold border-t border-border-subtle hover:bg-border-subtle transition-colors text-center"
              >
                Lihat semua hasil untuk &ldquo;{searchValue}&rdquo; →
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Search icon — mobile only */}
          <button
            onClick={openMobileSearch}
            className="md:hidden p-2 text-muted hover:text-foreground hover:bg-border-subtle rounded-xl transition"
            aria-label="Cari game"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
          <ThemeToggle />

          <Link
            href="/cart"
            className="relative p-2 text-muted hover:text-foreground hover:bg-border-subtle rounded-xl transition"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 0a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            {count > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                {count}
              </span>
            )}
          </Link>

          {user ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 bg-border-subtle hover:opacity-80 rounded-xl px-3 py-2 text-sm font-semibold text-foreground transition"
              >
                <span className="h-6 w-6 bg-accent text-accent-foreground rounded-full flex items-center justify-center text-xs font-bold">
                  {user.displayName.charAt(0).toUpperCase()}
                </span>
                <span className="hidden sm:inline max-w-[120px] truncate">{user.displayName}</span>
                <svg className="h-4 w-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 mt-2 w-48 bg-surface border border-border-subtle rounded-xl shadow-lg z-50 py-1">
                    <p className="px-4 py-2 text-xs text-muted truncate">{user.displayName}</p>
                    <div className="border-t border-border-subtle" />
                    <Link
                      href="/pesanan-saya"
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2.5 text-sm text-foreground hover:bg-border-subtle"
                    >
                      Pesanan Saya
                    </Link>
                    <Link
                      href="/wishlist"
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2.5 text-sm text-foreground hover:bg-border-subtle"
                    >
                      Wishlist
                    </Link>
                    {user.role === "admin" && (
                      <Link
                        href="/admin"
                        onClick={() => setMenuOpen(false)}
                        className="block px-4 py-2.5 text-sm text-accent font-semibold hover:bg-border-subtle"
                      >
                        Dashboard Admin
                      </Link>
                    )}
                    <div className="border-t border-border-subtle" />
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-border-subtle"
                    >
                      Keluar
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="bg-accent text-accent-foreground text-sm font-bold px-4 py-2 rounded-xl hover:opacity-90 transition"
            >
              Masuk
            </Link>
          )}
        </div>
      </div>
      {/* Mobile search bar — slides in below navbar */}
      {mobileSearchOpen && (
        <div ref={mobileSearchRef} className="md:hidden border-t border-border-subtle bg-background/95 backdrop-blur-xl px-4 py-3 relative">
          <form onSubmit={(e) => { e.preventDefault(); setMobileSearchOpen(false); router.push(searchValue.trim() ? `/?q=${encodeURIComponent(searchValue.trim())}` : "/"); }}>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted pointer-events-none">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                ref={mobileInputRef}
                type="search"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="Cari game..."
                autoComplete="off"
                className="w-full bg-surface border border-border-subtle rounded-xl pl-10 pr-10 py-2.5 text-sm text-foreground focus:outline-none focus:border-accent transition"
              />
              <button type="button" onClick={() => setMobileSearchOpen(false)}
                className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-muted hover:text-foreground">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </form>

          {/* Mobile dropdown */}
          {hits.length > 0 && searchValue && (
            <div className="mt-2 bg-surface border border-border-subtle rounded-2xl overflow-hidden shadow-xl">
              {hits.map((g) => {
                const pct = discount(g);
                return (
                  <Link key={g.slug} href={`/game/${g.slug}`}
                    onClick={() => { setMobileSearchOpen(false); setSearchValue(""); }}
                    className="flex items-center gap-3 px-3 py-2.5 hover:bg-border-subtle transition-colors group">
                    <div className="w-10 h-14 rounded-lg overflow-hidden flex-none bg-border-subtle">
                      {g.cover_url
                        ? <Image src={g.cover_url} alt={g.name} width={40} height={56} className="w-full h-full object-cover" />
                        : <div className="w-full h-full" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate group-hover:text-accent transition-colors">{g.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {pct && <span className="text-xs font-bold text-emerald-400">-{pct}%</span>}
                        <span className="text-xs text-muted">Rp {g.price.toLocaleString("id-ID")}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
              <button onMouseDown={(e) => { e.preventDefault(); setMobileSearchOpen(false); router.push(`/?q=${encodeURIComponent(searchValue.trim())}`); }}
                className="w-full px-4 py-2.5 text-xs text-accent font-semibold border-t border-border-subtle hover:bg-border-subtle text-center">
                Lihat semua hasil untuk &ldquo;{searchValue}&rdquo; →
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
