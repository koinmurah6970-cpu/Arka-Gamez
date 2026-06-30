"use client";

import Link from "next/link";
import { useCart } from "./cart-context";

export function Navbar() {
  const { count } = useCart();

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
            <Link href="/" className="text-blue-600 border-b-2 border-blue-600 pb-1">
              BERANDA
            </Link>
            <span className="hover:text-gray-900 transition cursor-not-allowed opacity-60">
              PROMO
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
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
        </div>
      </div>
    </nav>
  );
}
