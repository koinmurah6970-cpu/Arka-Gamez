"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "./cart-context";
import { createClient } from "@/lib/supabase/client";
import { ThemeToggle } from "./theme-toggle";

export function NavbarClient({
  user,
}: {
  user: { displayName: string; role: string } | null;
}) {
  const { count } = useCart();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = searchValue.trim();
    router.push(q ? `/?q=${encodeURIComponent(q)}` : "/");
  }

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
              G
            </div>
            <span className="text-lg font-extrabold tracking-tight text-foreground">
              GAMOS <span className="text-muted font-medium">GAMES</span>
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm font-semibold text-muted">
            <Link href="/" className="hover:text-accent transition">
              BERANDA
            </Link>
            <Link href="/cek-pesanan" className="hover:text-accent transition">
              CEK PESANAN
            </Link>
          </div>
        </div>

        <form onSubmit={handleSearch} className="hidden md:block flex-1 max-w-xs mx-4">
          <input
            type="search"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Cari game..."
            aria-label="Cari game"
            className="w-full bg-border-subtle border border-transparent rounded-xl px-3.5 py-2 text-sm text-foreground focus:outline-none focus:border-accent transition"
          />
        </form>

        <div className="flex items-center gap-3">
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
                      href="/cek-pesanan"
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2.5 text-sm text-foreground hover:bg-border-subtle"
                    >
                      Pesanan Saya
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
    </nav>
  );
}
