"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/format";
import { STORE_NAME } from "@/lib/constants";
import type { CartItem } from "@/components/cart-context";

interface LastOrder {
  orderNumber: string;
  playerId: string;
  items: CartItem[];
  total: number;
}

function buildWhatsAppMessage(order: LastOrder) {
  const lines = order.items.map((item, i) => `${i + 1}. ${item.name}`).join("\n");
  return (
    `Halo Admin ${STORE_NAME},\n\n` +
    `Saya ingin memesan koleksi game berikut:\n\n${lines}\n\n` +
    `*Data Akun Player:*\n• ID Akun: ${order.playerId}\n\n` +
    `*Rincian Transaksi:*\n• No. Pesanan: ${order.orderNumber}\n` +
    `• Total Item: ${order.items.length} Game\n` +
    `• Total Bayar: ${formatPrice(order.total)}\n\n` +
    `Mohon info kelanjutan pembayarannya ya min. Terima kasih!`
  );
}

export default function OrderConfirmationClient({
  params,
  waAdminNumber,
}: {
  params: Promise<{ orderNumber: string }>;
  waAdminNumber: string;
}) {
  const { orderNumber } = use(params);
  const [order, setOrder] = useState<LastOrder | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // One-time read of the handoff payload the checkout page stashed right
    // before navigating here -- sessionStorage only exists client-side.
    try {
      const raw = sessionStorage.getItem("last-order");
      if (raw) {
        const parsed: LastOrder = JSON.parse(raw);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (parsed.orderNumber === orderNumber) setOrder(parsed);
      }
    } catch {
      // sessionStorage unavailable -- fall back to the generic confirmation below
    }
    setChecked(true);
  }, [orderNumber]);

  if (!checked) return null;

  const waUrl = order
    ? `https://wa.me/${waAdminNumber}?text=${encodeURIComponent(buildWhatsAppMessage(order))}`
    : `https://wa.me/${waAdminNumber}?text=${encodeURIComponent(
        `Halo Admin ${STORE_NAME}, saya ingin konfirmasi pesanan dengan nomor ${orderNumber}.`
      )}`;

  return (
    <main className="container mx-auto px-4 py-8 max-w-xl text-center">
      <div className="text-5xl mb-4">✅</div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Pesanan Dibuat!</h2>
      <p className="text-sm text-gray-500 mb-6">
        Nomor pesanan kamu: <span className="font-bold text-gray-800">{orderNumber}</span>
      </p>

      {order && (
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6 text-left">
          <p className="text-xs font-bold text-gray-500 mb-2 uppercase">Rincian Item:</p>
          <div className="text-xs text-gray-700 space-y-1">
            {order.items.map((item, idx) => (
              <p key={item.gameId}>
                {idx + 1}. {item.name}
              </p>
            ))}
          </div>
          <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-200 font-bold">
            <span className="text-xs text-gray-500">Total Akhir:</span>
            <span className="text-sm text-blue-600 font-extrabold">
              {formatPrice(order.total)}
            </span>
          </div>
        </div>
      )}

      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full bg-emerald-600 text-white py-3 rounded-xl font-bold text-sm text-center mb-3"
      >
        Hubungi Admin Via WhatsApp
      </a>
      <Link href="/" className="text-blue-600 font-semibold text-sm hover:underline">
        Kembali ke katalog
      </Link>
    </main>
  );
}
