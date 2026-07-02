"use client";

import Image from "next/image";
import Link from "next/link";
import { formatPrice, discountPercent } from "@/lib/format";
import { useCart } from "./cart-context";
import type { Game } from "@/lib/supabase/types";

export type GameCardData = Pick<
  Game,
  "id" | "slug" | "name" | "price" | "original_price" | "cover_url" | "is_new" | "size_label"
> & {
  category?: { name: string } | null;
};

const CATEGORY_STYLE: Record<string, string> = {
  Berat: "bg-red-500/15 text-red-500",
  "Agak Berat": "bg-orange-500/15 text-orange-500",
  Sedang: "bg-blue-500/15 text-blue-500",
  Ringan: "bg-green-500/15 text-green-500",
};

export function ProductCard({ game }: { game: GameCardData }) {
  const { addItem, items } = useCart();
  const inCart = items.some((i) => i.gameId === game.id);
  const discount = discountPercent(game.price, game.original_price);
  const catName = game.category?.name ?? null;
  const catStyle = catName ? (CATEGORY_STYLE[catName] ?? "bg-border-subtle text-muted") : null;

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (inCart) return;
    addItem({
      gameId: game.id,
      slug: game.slug,
      name: game.name,
      price: game.price,
      coverUrl: game.cover_url,
    });
  }

  return (
    <Link
      href={`/game/${game.slug}`}
      className="bg-surface rounded-2xl overflow-hidden border border-border-subtle flex flex-col h-full relative group transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-accent/10 hover:border-accent/30"
    >
      <div className="cover-container">
        {game.is_new && (
          <span className="absolute top-2 left-2 z-10 bg-accent text-accent-foreground text-[10px] font-bold px-2 py-1 rounded-md">
            BARU
          </span>
        )}
        {game.cover_url ? (
          <Image
            src={game.cover_url}
            alt={game.name}
            fill
            unoptimized
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
            className="cover-img object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted text-xs font-semibold">
            No Cover
          </div>
        )}
      </div>

      <div className="p-3 flex flex-col flex-grow gap-2">
        <h3 className="text-[13px] font-bold text-foreground line-clamp-2 leading-tight">
          {game.name}
        </h3>

        {(game.size_label || catName) && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {game.size_label && (
              <span className="text-[10px] font-semibold text-muted">
                {game.size_label}
              </span>
            )}
            {game.size_label && catName && (
              <span className="text-muted text-[10px]">·</span>
            )}
            {catName && catStyle && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${catStyle}`}>
                {catName.toUpperCase()}
              </span>
            )}
          </div>
        )}

        <div className="mt-auto pt-1">
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            <span className="text-accent font-bold text-sm">{formatPrice(game.price)}</span>
            <span className="text-muted text-[11px] line-through">
              {formatPrice(game.original_price)}
            </span>
          </div>
          {discount > 0 && (
            <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-wide mb-2">
              DISKON {discount}%
            </div>
          )}

          <button
            onClick={handleAddToCart}
            aria-label="Tambah ke keranjang"
            className={`w-full py-2 rounded-xl text-[12px] font-bold transition ${
              inCart
                ? "bg-accent/15 text-accent border border-accent/30"
                : "bg-accent text-accent-foreground hover:opacity-90"
            }`}
          >
            {inCart ? "✓ Di Keranjang" : "Beli"}
          </button>
        </div>
      </div>
    </Link>
  );
}
