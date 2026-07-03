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
      <div className="flex justify-center mb-6">
        <div className="h-16 w-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </div>
      <h1 className="text-2xl font-bold text-foreground mb-2">Pesanan Dibuat!</h1>
      <p className="text-sm text-muted mb-6">
        Nomor pesanan kamu: <span className="font-bold text-foreground">{orderNumber}</span>
      </p>

      {order && (
        <div className="bg-surface p-4 rounded-xl border border-border-subtle mb-6 text-left">
          <p className="text-xs font-bold text-muted mb-2 uppercase">Rincian Item:</p>
          <div className="text-xs text-foreground space-y-1">
            {order.items.map((item, idx) => (
              <p key={item.gameId}>
                {idx + 1}. {item.name}
              </p>
            ))}
          </div>
          <div className="flex justify-between items-center mt-3 pt-3 border-t border-border-subtle font-bold">
            <span className="text-xs text-muted">Total Akhir:</span>
            <span className="text-sm text-accent font-extrabold">
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
      <Link href="/" className="text-accent font-semibold text-sm hover:underline">
        Kembali ke katalog
      </Link>
    </main>
  );
}
