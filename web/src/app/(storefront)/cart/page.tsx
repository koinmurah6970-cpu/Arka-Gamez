"use client";

import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/components/cart-context";
import { formatPrice } from "@/lib/format";

export default function CartPage() {
  const { items, removeItem, total } = useCart();

  return (
    <main className="container mx-auto px-4 py-8 max-w-3xl">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">🛒 Keranjang Anda</h2>

      {items.length === 0 ? (
        <div className="text-center py-20 text-gray-400 text-sm">
          Keranjang belanja kosong.
          <div className="mt-4">
            <Link href="/" className="text-blue-600 font-semibold hover:underline">
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
                className="flex items-center gap-4 bg-gray-50 p-3 rounded-xl border border-gray-100"
              >
                <div className="relative h-16 w-12 flex-shrink-0 rounded-lg overflow-hidden bg-gray-200">
                  {item.coverUrl && (
                    <Image src={item.coverUrl} alt={item.name} fill className="object-cover" />
                  )}
                </div>
                <Link
                  href={`/game/${item.slug}`}
                  className="flex-grow font-bold text-gray-700 text-sm hover:text-blue-600 truncate"
                >
                  {item.name}
                </Link>
                <span className="text-blue-600 font-bold text-sm whitespace-nowrap">
                  {formatPrice(item.price)}
                </span>
                <button
                  onClick={() => removeItem(item.gameId)}
                  aria-label="Hapus dari keranjang"
                  className="text-gray-400 hover:text-red-500 font-bold text-xl"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>

          <div className="border-t pt-4 mt-6">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm font-semibold text-gray-500">Total:</span>
              <span className="text-lg font-extrabold text-blue-600">{formatPrice(total)}</span>
            </div>
            <Link
              href="/checkout"
              className="block w-full bg-blue-600 text-white py-3 rounded-xl font-bold text-sm text-center hover:bg-blue-700 transition"
            >
              Lanjutkan Pembayaran
            </Link>
          </div>
        </>
      )}
    </main>
  );
}
