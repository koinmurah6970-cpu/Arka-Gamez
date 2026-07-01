import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/format";
import type { Order, OrderItem, OrderStatus } from "@/lib/supabase/types";
import { OrderSearchForm } from "./search-form";

const STATUS_STEPS: { key: OrderStatus; label: string }[] = [
  { key: "pending", label: "Menunggu" },
  { key: "confirmed", label: "Dikonfirmasi" },
  { key: "paid", label: "Dibayar" },
  { key: "processing", label: "Diproses" },
  { key: "completed", label: "Selesai" },
];

function statusIndex(status: OrderStatus) {
  if (status === "cancelled") return -1;
  return STATUS_STEPS.findIndex((s) => s.key === status);
}

export default async function CekPesananPage({
  searchParams,
}: {
  searchParams: Promise<{ no?: string }>;
}) {
  const { no } = await searchParams;
  const q = no?.trim() ?? "";

  let order: Order | null = null;
  let items: OrderItem[] | null = null;
  let notFound = false;

  if (q) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("orders")
      .select("*")
      .eq("order_number", q)
      .single();

    if (!data) {
      notFound = true;
    } else {
      order = data;
      const { data: orderItems } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", data.id);
      items = orderItems;
    }
  }

  const currentStep = order ? statusIndex(order.status) : -1;
  const isCancelled = order?.status === "cancelled";

  return (
    <main className="container mx-auto px-4 py-8 max-w-xl">
      <h1 className="text-2xl font-bold text-foreground mb-1">Cek Pesanan</h1>
      <p className="text-xs text-muted mb-6">
        Masukkan nomor pesanan untuk melihat status terbaru.
      </p>

      <OrderSearchForm defaultValue={q} />

      {notFound && (
        <div className="mt-6 text-center py-12 bg-surface rounded-2xl border border-border-subtle">
          <p className="text-3xl mb-2">🔍</p>
          <p className="text-sm text-foreground font-semibold">Pesanan tidak ditemukan.</p>
          <p className="text-xs text-muted mt-1">
            Pastikan nomor pesanan sudah benar (contoh: GAM-XXXXXX).
          </p>
        </div>
      )}

      {order && (
        <div className="mt-6 space-y-4">
          <div className="bg-surface border border-border-subtle rounded-2xl p-5">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="font-mono text-sm font-bold text-foreground">
                  {order.order_number}
                </p>
                <p className="text-xs text-muted mt-0.5">
                  {new Date(order.created_at).toLocaleString("id-ID")}
                </p>
              </div>
              {isCancelled && (
                <span className="text-xs font-bold bg-red-500/10 text-red-500 px-2.5 py-1 rounded-lg">
                  Dibatalkan
                </span>
              )}
            </div>

            {!isCancelled && (
              <div className="flex items-center gap-1 mb-6">
                {STATUS_STEPS.map((step, idx) => {
                  const done = idx <= currentStep;
                  const active = idx === currentStep;
                  return (
                    <div key={step.key} className="flex-1 flex flex-col items-center">
                      <div
                        className={`h-3 w-3 rounded-full border-2 mb-1.5 ${
                          active
                            ? "border-accent bg-accent ring-4 ring-accent/20"
                            : done
                              ? "border-emerald-500 bg-emerald-500"
                              : "border-border-subtle bg-background"
                        }`}
                      />
                      <span
                        className={`text-[10px] font-semibold text-center leading-tight ${
                          active ? "text-accent" : done ? "text-emerald-500" : "text-muted"
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {isCancelled && (
              <p className="text-sm text-red-500 bg-red-500/10 rounded-xl px-4 py-3 mb-4">
                Pesanan ini telah dibatalkan oleh admin. Silakan hubungi admin jika ada pertanyaan.
              </p>
            )}
          </div>

          <div className="bg-surface border border-border-subtle rounded-2xl p-5">
            <h3 className="text-xs font-bold text-muted uppercase mb-3">Item Pesanan</h3>
            <div className="space-y-2">
              {(items ?? []).map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-foreground">{item.game_name_snapshot}</span>
                  <span className="text-muted">{formatPrice(item.price)}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center mt-3 pt-3 border-t border-border-subtle font-bold">
              <span className="text-xs text-muted">Total</span>
              <span className="text-accent">{formatPrice(order.total)}</span>
            </div>
          </div>

          <div className="bg-surface border border-border-subtle rounded-2xl p-5">
            <h3 className="text-xs font-bold text-muted uppercase mb-3">Data Pemesanan</h3>
            <dl className="grid grid-cols-2 gap-y-2 text-sm">
              <dt className="text-muted">Nama</dt>
              <dd className="text-foreground">{order.guest_name ?? "-"}</dd>
              <dt className="text-muted">Player ID</dt>
              <dd className="text-foreground">{order.player_id}</dd>
            </dl>
          </div>
        </div>
      )}
    </main>
  );
}
