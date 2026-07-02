"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useCart } from "@/components/cart-context";
import { createClient } from "@/lib/supabase/client";
import { checkoutSchema } from "@/lib/validation";
import { formatPrice } from "@/lib/format";
import type { CartItem } from "@/components/cart-context";

function CheckoutForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const directId = searchParams.get("direct");

  const { items: cartItems, total: cartTotal, clear } = useCart();

  const [directItem, setDirectItem] = useState<CartItem | null>(null);
  const [directLoading, setDirectLoading] = useState(!!directId);

  const [guestName, setGuestName] = useState("");
  const [guestWhatsapp, setGuestWhatsapp] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    if (!directId) return;
    const supabase = createClient();
    supabase
      .from("games")
      .select("id, slug, name, price, cover_url")
      .eq("id", directId)
      .eq("status", "active")
      .maybeSingle()
      .then(({ data }) => {
        if (!data) {
          router.replace("/");
          return;
        }
        setDirectItem({
          gameId: data.id,
          slug: data.slug,
          name: data.name,
          price: data.price,
          coverUrl: data.cover_url,
        });
        setDirectLoading(false);
      });
  }, [directId, router]);

  const isDirect = !!directId;
  const items = isDirect ? (directItem ? [directItem] : []) : cartItems;
  const total = items.reduce((sum, i) => sum + i.price, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);

    const parsed = checkoutSchema.safeParse({ guestName, guestWhatsapp });
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
      p_player_id: parsed.data.guestWhatsapp,
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
        playerId: parsed.data.guestWhatsapp,
        items,
        total,
      })
    );

    if (!isDirect) clear();
    router.push(`/checkout/${order.order_number}`);
  }

  if (directLoading) {
    return (
      <main className="container mx-auto px-4 py-8 max-w-xl text-center">
        <p className="text-muted text-sm py-20">Memuat detail game...</p>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="container mx-auto px-4 py-8 max-w-xl text-center">
        <p className="text-muted text-sm py-20">
          Keranjang kosong, tidak ada yang bisa di-checkout.
        </p>
        <Link href="/" className="text-accent font-semibold hover:underline">
          Kembali ke katalog
        </Link>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8 max-w-xl">
      <h1 className="text-2xl font-bold text-foreground mb-6">🔒 Checkout</h1>

      <div className="bg-surface p-4 rounded-xl border border-border-subtle mb-6">
        <p className="text-xs font-bold text-muted mb-2 uppercase">Rincian Item:</p>
        <div className="text-xs text-foreground space-y-1 max-h-[140px] overflow-y-auto">
          {items.map((item, idx) => (
            <p key={item.gameId}>
              {idx + 1}. {item.name}
            </p>
          ))}
        </div>
        <div className="flex justify-between items-center mt-3 pt-3 border-t border-border-subtle font-bold">
          <span className="text-xs text-muted">Total Akhir:</span>
          <span className="text-sm text-accent font-extrabold">{formatPrice(total)}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-muted uppercase mb-2">
            Nama Lengkap
          </label>
          <input
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            placeholder="Nama Anda"
            className="w-full bg-surface border border-border-subtle rounded-xl p-3 text-sm text-foreground focus:outline-none focus:border-accent transition"
          />
          {errors.guestName && <p className="text-red-500 text-xs mt-1">{errors.guestName}</p>}
        </div>

        <div>
          <label className="block text-xs font-bold text-muted uppercase mb-2">
            Nomor WhatsApp
          </label>
          <input
            value={guestWhatsapp}
            onChange={(e) => setGuestWhatsapp(e.target.value)}
            placeholder="0812xxxxxxxx"
            className="w-full bg-surface border border-border-subtle rounded-xl p-3 text-sm text-foreground focus:outline-none focus:border-accent transition"
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

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <main className="container mx-auto px-4 py-8 max-w-xl text-center">
        <p className="text-muted text-sm py-20">Memuat...</p>
      </main>
    }>
      <CheckoutForm />
    </Suspense>
  );
}
