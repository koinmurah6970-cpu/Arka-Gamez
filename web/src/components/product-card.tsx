"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatPrice, discountPercent } from "@/lib/format";
import { useCart } from "./cart-context";
import { WishlistButton } from "./wishlist-button";
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

export function ProductCard({ game, priority = false }: { game: GameCardData; priority?: boolean }) {
  const router = useRouter();
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

  function handleBuyNow(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/checkout?direct=${game.id}`);
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
        <WishlistButton gameId={game.id} variant="compact" />
        {game.cover_url ? (
          <>
            {/* Blurred background layer — same sizes as foreground so browser cache hits */}
            <Image
              src={game.cover_url}
              alt=""
              fill
              aria-hidden="true"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
              className="object-cover scale-110 blur-lg opacity-60"
            />
            <div className="absolute inset-0 bg-black/20" />
            {/* Actual cover — object-contain so nothing gets cropped */}
            <Image
              src={game.cover_url}
              alt={game.name}
              fill
              priority={priority}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
              className="object-contain relative z-[2]"
            />
          </>
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

          <div className="flex gap-1.5">
            <button
              onClick={handleAddToCart}
              aria-label={inCart ? "Sudah di keranjang" : "Tambah ke keranjang"}
              title={inCart ? "Sudah di keranjang" : "Tambah ke keranjang"}
              className={`flex-none flex items-center justify-center w-11 h-11 rounded-xl border transition ${
                inCart
                  ? "border-accent/30 bg-accent/10 text-accent"
                  : "border-border-subtle bg-surface hover:border-accent/40 hover:text-accent text-muted"
              }`}
            >
              {inCart ? (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                </svg>
              )}
            </button>

            <button
              onClick={handleBuyNow}
              className="flex-1 flex items-center justify-center py-2 rounded-xl bg-accent text-accent-foreground text-[12px] font-bold hover:opacity-90 transition"
            >
              Beli Sekarang
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
