"use client";

import Image from "next/image";
import Link from "next/link";
import { formatPrice, discountPercent } from "@/lib/format";
import { useCart } from "./cart-context";
import type { Game } from "@/lib/supabase/types";

// Only the fields the grid card actually renders -- keeps the catalog list
// query from pulling heavier columns (description, etc.) across 24 rows.
export type GameCardData = Pick<
  Game,
  "id" | "slug" | "name" | "price" | "original_price" | "cover_url" | "is_new"
>;

export function ProductCard({ game }: { game: GameCardData }) {
  const { addItem, items } = useCart();
  const inCart = items.some((i) => i.gameId === game.id);
  const discount = discountPercent(game.price, game.original_price);

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
      className="bg-white rounded-2xl overflow-hidden border border-gray-100 flex flex-col h-full shadow-sm hover:shadow-md transition relative group"
    >
      <div className="cover-container">
        {game.is_new && (
          <span className="absolute top-2 left-2 z-10 bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded-md">
            BARU
          </span>
        )}
        {game.cover_url ? (
          <Image
            src={game.cover_url}
            alt={game.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
            className="cover-img object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs font-semibold">
            No Cover
          </div>
        )}
      </div>
      <div className="p-3.5 flex flex-col justify-between flex-grow">
        <div>
          <h3 className="text-[13px] font-bold text-gray-800 line-clamp-2 h-9 mb-2 leading-tight">
            {game.name}
          </h3>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-blue-600 font-bold text-sm">{formatPrice(game.price)}</span>
            <span className="text-gray-400 text-[11px] line-through">
              {formatPrice(game.original_price)}
            </span>
          </div>
          {discount > 0 && (
            <div className="text-[10px] font-bold text-emerald-600 uppercase mt-0.5 tracking-wide">
              HEMAT {discount}%
            </div>
          )}
        </div>
        <div className="flex justify-end mt-3 mt-auto">
          <button
            onClick={handleAddToCart}
            aria-label="Tambah ke keranjang"
            className={`p-2 border rounded-xl transition shadow-sm ${
              inCart
                ? "bg-blue-50 border-blue-600 text-blue-600"
                : "bg-gray-50 border-gray-200 hover:border-blue-600 hover:bg-blue-50 text-gray-600 hover:text-blue-600"
            }`}
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
          </button>
        </div>
      </div>
    </Link>
  );
}
