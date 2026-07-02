import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { formatPrice } from "@/lib/format";
import type { Order, OrderStatus } from "@/lib/supabase/types";

const STATUS_BADGE: Record<OrderStatus, { label: string; cls: string }> = {
  pending:    { label: "Menunggu",     cls: "bg-yellow-500/10 text-yellow-500" },
  confirmed:  { label: "Dikonfirmasi", cls: "bg-blue-500/10 text-blue-500" },
  paid:       { label: "Dibayar",      cls: "bg-indigo-500/10 text-indigo-500" },
  processing: { label: "Diproses",     cls: "bg-purple-500/10 text-purple-500" },
  completed:  { label: "Selesai",      cls: "bg-emerald-500/10 text-emerald-500" },
  cancelled:  { label: "Dibatalkan",   cls: "bg-red-500/10 text-red-500" },
};

type OrderWithItems = Order & {
  order_items: { game_name_snapshot: string; price: number }[];
};

export const metadata = {
  title: "Pesanan Saya — Link Yu",
};

export default async function PesananSayaPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createClient();

  const { data: orders } = await supabase
    .from("orders")
    .select("*, order_items(game_name_snapshot, price)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const list = (orders ?? []) as OrderWithItems[];

  return (
    <main className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-foreground mb-1">Pesanan Saya</h1>
      <p className="text-xs text-muted mb-6">Riwayat semua pesanan akun ini.</p>

      {list.length === 0 ? (
        <div className="text-center py-20 bg-surface rounded-2xl border border-border-subtle">
          <p className="text-3xl mb-2">📦</p>
          <p className="text-sm font-semibold text-foreground">Belum ada pesanan</p>
          <p className="text-xs text-muted mt-1 mb-4">
            Pesanan yang dibuat saat login akan muncul di sini.
          </p>
          <Link
            href="/"
            className="inline-block bg-accent text-accent-foreground text-sm font-bold px-5 py-2.5 rounded-xl hover:opacity-90 transition"
          >
            Jelajahi Katalog
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((order) => {
            const badge = STATUS_BADGE[order.status] ?? STATUS_BADGE.pending;
            return (
              <div
                key={order.id}
                className="bg-surface border border-border-subtle rounded-2xl p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-mono text-sm font-bold text-foreground">
                      {order.order_number}
                    </p>
                    <p className="text-xs text-muted mt-0.5">
                      {new Date(order.created_at).toLocaleString("id-ID", {
                        timeZone: "Asia/Jakarta",
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-lg flex-shrink-0 ${badge.cls}`}
                  >
                    {badge.label}
                  </span>
                </div>

                <div className="space-y-0.5 border-t border-border-subtle pt-2">
                  {order.order_items.map((item, i) => (
                    <p key={i} className="text-xs text-foreground truncate">
                      {item.game_name_snapshot}
                    </p>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-border-subtle">
                  <span className="text-accent font-bold text-sm">
                    {formatPrice(order.total)}
                  </span>
                  <Link
                    href={`/cek-pesanan?no=${order.order_number}`}
                    className="text-xs text-muted hover:text-accent font-semibold transition"
                  >
                    Lihat Detail →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
