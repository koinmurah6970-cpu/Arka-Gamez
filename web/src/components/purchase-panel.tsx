"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatPrice, discountPercent } from "@/lib/format";
import { useCart } from "./cart-context";
import type { Game } from "@/lib/supabase/types";

export function PurchasePanel({ game }: { game: Game }) {
  const router = useRouter();
  const { addItem, items } = useCart();
  const inCart = items.some((i) => i.gameId === game.id);
  const discount = discountPercent(game.price, game.original_price);
  const [copied, setCopied] = useState(false);

  function ensureInCart() {
    if (!inCart) {
      addItem({
        gameId: game.id,
        slug: game.slug,
        name: game.name,
        price: game.price,
        coverUrl: game.cover_url,
      });
    }
  }

  function handleBuyNow() {
    ensureInCart();
    router.push("/checkout");
  }

  async function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: game.name, url });
        return;
      } catch {
        // user cancelled share sheet, fall through to clipboard copy
      }
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-xl flex flex-col gap-4">
      <div>
        <span className="bg-emerald-50 text-emerald-600 text-[11px] font-bold px-2.5 py-1 rounded-md border border-emerald-200/50">
          Tersedia
        </span>
      </div>

      <h2 className="text-xl font-bold text-gray-900 tracking-tight">{game.name}</h2>

      <div className="flex items-center gap-2 text-xs text-gray-500">
        <span className="text-yellow-500 flex items-center gap-1">⭐ {game.rating ?? 4.5}</span>
        <span>•</span>
        <span>{game.category?.name ?? "Game"}</span>
        {game.size_label && (
          <>
            <span>•</span>
            <span>{game.size_label}</span>
          </>
        )}
      </div>

      <div className="flex items-baseline gap-2 mt-1">
        <span className="text-2xl font-bold text-blue-600">{formatPrice(game.price)}</span>
        <span className="text-xs text-gray-400 line-through">
          {formatPrice(game.original_price)}
        </span>
      </div>
      {discount > 0 && (
        <div className="text-xs font-bold text-emerald-600">Hemat {discount}%</div>
      )}

      <div className="flex flex-col gap-2.5 mt-2">
        <button
          onClick={handleBuyNow}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-xl font-semibold hover:bg-blue-700 transition text-sm flex items-center justify-center gap-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
            />
          </svg>
          Beli Sekarang
        </button>
        <button
          onClick={ensureInCart}
          disabled={inCart}
          className="w-full bg-white border border-gray-200 text-gray-700 py-3 px-4 rounded-xl font-semibold hover:bg-gray-50 transition text-sm flex items-center justify-center gap-2 disabled:opacity-60"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
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
          {inCart ? "Sudah di Keranjang" : "Tambah ke Keranjang"}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 text-xs font-medium text-gray-500 mt-2 pt-2 border-t border-gray-100">
        <button onClick={handleShare} className="flex items-center justify-center gap-1.5 hover:text-gray-900">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-3.5 w-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
            />
          </svg>
          {copied ? "Link disalin!" : "Bagikan"}
        </button>
      </div>

      <div className="mt-2 space-y-2 border-t border-gray-100 pt-3 text-[11px] text-gray-500">
        <div className="flex items-center gap-2">
          <span className="text-blue-500 font-bold">⚡</span> Aktivasi instan setelah pembayaran
        </div>
        <div className="flex items-center gap-2">
          <span className="text-emerald-500 font-bold">🛡️</span> Pembayaran aman & instan
        </div>
      </div>
    </div>
  );
}
