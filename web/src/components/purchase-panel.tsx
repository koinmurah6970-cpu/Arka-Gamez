"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatPrice, discountPercent } from "@/lib/format";
import { useCart } from "./cart-context";
import { WishlistButton } from "./wishlist-button";
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

  function handleShareWA() {
    const url = window.location.href;
    const text = `Cek game *${game.name}* di Link Yu! 🎮\n${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener");
  }

  async function handleCopyLink() {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="bg-surface border border-border-subtle rounded-2xl p-6 shadow-xl flex flex-col gap-4">
      <div>
        <span className="bg-emerald-500/10 text-emerald-500 text-[11px] font-bold px-2.5 py-1 rounded-md border border-emerald-500/20">
          Tersedia
        </span>
      </div>

      <h1 className="text-xl font-bold text-foreground tracking-tight">{game.name}</h1>

      <div className="flex items-center gap-2 text-xs text-muted">
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
        <span className="text-2xl font-bold text-accent">{formatPrice(game.price)}</span>
        <span className="text-xs text-muted line-through">
          {formatPrice(game.original_price)}
        </span>
      </div>
      {discount > 0 && (
        <div className="text-xs font-bold text-emerald-500">Hemat {discount}%</div>
      )}

      <div className="flex flex-col gap-2.5 mt-2">
        <button
          onClick={handleBuyNow}
          className="w-full bg-accent text-accent-foreground py-3 px-4 rounded-xl font-semibold hover:opacity-90 transition text-sm flex items-center justify-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
          Beli Sekarang
        </button>
        <button
          onClick={ensureInCart}
          disabled={inCart}
          className="w-full bg-background border border-border-subtle text-foreground py-3 px-4 rounded-xl font-semibold hover:bg-border-subtle transition text-sm flex items-center justify-center gap-2 disabled:opacity-60"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 0a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          {inCart ? "Sudah di Keranjang" : "Tambah ke Keranjang"}
        </button>
        <WishlistButton gameId={game.id} />
      </div>

      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border-subtle text-xs font-medium text-muted">
        <button
          onClick={handleShareWA}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl hover:bg-border-subtle hover:text-foreground transition"
        >
          <svg className="h-3.5 w-3.5 text-green-500" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.122 1.532 5.852L.057 23.267a.75.75 0 00.921.921l5.415-1.475A11.95 11.95 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.885 0-3.65-.523-5.155-1.43l-.37-.22-3.834 1.044 1.044-3.834-.22-.37A9.951 9.951 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
          </svg>
          Share WA
        </button>
        <div className="w-px h-4 bg-border-subtle" />
        <button
          onClick={handleCopyLink}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl hover:bg-border-subtle hover:text-foreground transition"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          {copied ? "Disalin!" : "Salin Link"}
        </button>
      </div>

      <div className="mt-2 space-y-2 border-t border-border-subtle pt-3 text-[11px] text-muted">
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
