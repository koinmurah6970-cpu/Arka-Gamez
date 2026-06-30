"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/components/cart-context";
import { createClient } from "@/lib/supabase/client";
import { checkoutSchema } from "@/lib/validation";
import { formatPrice } from "@/lib/format";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, total, clear } = useCart();
  const [playerId, setPlayerId] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestWhatsapp, setGuestWhatsapp] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);

    const parsed = checkoutSchema.safeParse({ playerId, guestName, guestWhatsapp });
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        fieldErrors[String(issue.path[0])] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setSubmitting(true);

    const supabase = createClient();
    const { data: order, error } = await supabase.rpc("create_order", {
      p_player_id: parsed.data.playerId,
      p_guest_name: parsed.data.guestName,
      p_guest_whatsapp: parsed.data.guestWhatsapp,
      p_items: items.map((i) => ({ game_id: i.gameId, name: i.name, price: i.price })),
    });

    setSubmitting(false);

    if (error || !order) {
      setServerError("Gagal membuat pesanan, coba lagi sebentar lagi.");
      return;
    }

    sessionStorage.setItem(
      "last-order",
      JSON.stringify({
        orderNumber: order.order_number,
        playerId: parsed.data.playerId,
        items,
        total,
      })
    );
    clear();
    router.push(`/checkout/${order.order_number}`);
  }

  if (items.length === 0) {
    return (
      <main className="container mx-auto px-4 py-8 max-w-xl text-center">
        <p className="text-gray-400 text-sm py-20">
          Keranjang kosong, tidak ada yang bisa di-checkout.
        </p>
        <Link href="/" className="text-blue-600 font-semibold hover:underline">
          Kembali ke katalog
        </Link>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8 max-w-xl">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">🔒 Checkout</h2>

      <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6">
        <p className="text-xs font-bold text-gray-500 mb-2 uppercase">Rincian Item:</p>
        <div className="text-xs text-gray-700 space-y-1 max-h-[140px] overflow-y-auto">
          {items.map((item, idx) => (
            <p key={item.gameId}>
              {idx + 1}. {item.name}
            </p>
          ))}
        </div>
        <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-200 font-bold">
          <span className="text-xs text-gray-500">Total Akhir:</span>
          <span className="text-sm text-blue-600 font-extrabold">{formatPrice(total)}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
            Player ID Akun Game
          </label>
          <input
            value={playerId}
            onChange={(e) => setPlayerId(e.target.value)}
            placeholder="Contoh: RezaID#12345"
            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-blue-500 transition"
          />
          {errors.playerId && <p className="text-red-500 text-xs mt-1">{errors.playerId}</p>}
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
            Nama Lengkap
          </label>
          <input
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            placeholder="Nama Anda"
            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-blue-500 transition"
          />
          {errors.guestName && <p className="text-red-500 text-xs mt-1">{errors.guestName}</p>}
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
            Nomor WhatsApp
          </label>
          <input
            value={guestWhatsapp}
            onChange={(e) => setGuestWhatsapp(e.target.value)}
            placeholder="0812xxxxxxxx"
            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-blue-500 transition"
          />
          {errors.guestWhatsapp && (
            <p className="text-red-500 text-xs mt-1">{errors.guestWhatsapp}</p>
          )}
        </div>

        {serverError && <p className="text-red-500 text-xs">{serverError}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold text-sm text-center disabled:opacity-60"
        >
          {submitting ? "Memproses..." : "Buat Pesanan"}
        </button>
      </form>
    </main>
  );
}
