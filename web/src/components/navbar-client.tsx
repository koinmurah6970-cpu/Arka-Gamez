"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "./cart-context";
import { createClient } from "@/lib/supabase/client";

export function NavbarClient({
  user,
}: {
  user: { displayName: string; role: string } | null;
}) {
  const { count } = useCart();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setMenuOpen(false);
    router.push("/");
    router.refresh();
  }

  return (
    <nav className="bg-white border-b border-gray-100 p-4 sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto flex justify-between items-center max-w-7xl">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 bg-[#0b0f19] rounded-lg flex items-center justify-center font-black text-white italic text-lg">
              G
            </div>
            <h1 className="text-lg font-extrabold tracking-tight text-gray-900">
              GAMOS <span className="text-gray-500 font-medium">GAMES</span>
            </h1>
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm font-semibold text-gray-500">
            <Link href="/" className="hover:text-blue-600 transition">
              BERANDA
            </Link>
            <Link href="/cek-pesanan" className="hover:text-blue-600 transition">
              CEK PESANAN
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/cart"
            className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition"
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
                className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 rounded-xl px-3 py-2 text-sm font-semibold text-gray-700 transition"
              >
                <span className="h-6 w-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  {user.displayName.charAt(0).toUpperCase()}
                </span>
                <span className="hidden sm:inline max-w-[120px] truncate">{user.displayName}</span>
                <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-lg z-50 py-1">
                    <p className="px-4 py-2 text-xs text-gray-400 truncate">{user.displayName}</p>
                    <div className="border-t border-gray-100" />
                    <Link
                      href="/cek-pesanan"
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Pesanan Saya
                    </Link>
                    {user.role === "admin" && (
                      <Link
                        href="/admin"
                        onClick={() => setMenuOpen(false)}
                        className="block px-4 py-2.5 text-sm text-blue-600 font-semibold hover:bg-blue-50"
                      >
                        Dashboard Admin
                      </Link>
                    )}
                    <div className="border-t border-gray-100" />
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50"
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
              className="bg-blue-600 text-white text-sm font-bold px-4 py-2 rounded-xl hover:bg-blue-700 transition"
            >
              Masuk
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
