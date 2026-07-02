"use client";

import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/components/cart-context";
import { formatPrice } from "@/lib/format";

export default function CartPage() {
  const { items, removeItem, total } = useCart();

  return (
    <main className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-2xl font-bold text-foreground mb-6">🛒 Keranjang Anda</h1>

      {items.length === 0 ? (
        <div className="text-center py-20 text-muted text-sm">
          Keranjang belanja kosong.
          <div className="mt-4">
            <Link href="/" className="text-accent font-semibold hover:underline">
              Jelajahi katalog
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.gameId}
                className="flex items-center gap-4 bg-surface p-3 rounded-xl border border-border-subtle"
              >
                <div className="relative h-16 w-12 flex-shrink-0 rounded-lg overflow-hidden bg-border-subtle">
                  {item.coverUrl && (
                    <Image src={item.coverUrl} alt={item.name} fill className="object-cover" />
                  )}
                </div>
                <Link
                  href={`/game/${item.slug}`}
                  className="flex-grow font-bold text-foreground text-sm hover:text-accent truncate"
                >
                  {item.name}
                </Link>
                <span className="text-accent font-bold text-sm whitespace-nowrap">
                  {formatPrice(item.price)}
                </span>
                <button
                  onClick={() => removeItem(item.gameId)}
                  aria-label="Hapus dari keranjang"
                  className="flex items-center justify-center w-11 h-11 text-muted hover:text-red-500 font-bold text-xl rounded-lg transition"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>

          <div className="border-t border-border-subtle pt-4 mt-6">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm font-semibold text-muted">Total:</span>
              <span className="text-lg font-extrabold text-accent">{formatPrice(total)}</span>
            </div>
            <Link
              href="/checkout"
              className="block w-full bg-accent text-accent-foreground py-3 rounded-xl font-bold text-sm text-center hover:opacity-90 transition"
            >
              Lanjutkan Pembayaran
            </Link>
          </div>
        </>
      )}
    </main>
  );
}
