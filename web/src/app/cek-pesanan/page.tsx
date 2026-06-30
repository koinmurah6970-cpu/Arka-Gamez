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
      <h2 className="text-2xl font-bold text-gray-900 mb-1">Cek Pesanan</h2>
      <p className="text-xs text-gray-400 mb-6">
        Masukkan nomor pesanan untuk melihat status terbaru.
      </p>

      <OrderSearchForm defaultValue={q} />

      {notFound && (
        <div className="mt-6 text-center py-12 bg-gray-50 rounded-2xl border border-gray-200">
          <p className="text-3xl mb-2">🔍</p>
          <p className="text-sm text-gray-500 font-semibold">Pesanan tidak ditemukan.</p>
          <p className="text-xs text-gray-400 mt-1">
            Pastikan nomor pesanan sudah benar (contoh: GAM-XXXXXX).
          </p>
        </div>
      )}

      {order && (
        <div className="mt-6 space-y-4">
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="font-mono text-sm font-bold text-gray-800">
                  {order.order_number}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {new Date(order.created_at).toLocaleString("id-ID")}
                </p>
              </div>
              {isCancelled && (
                <span className="text-xs font-bold bg-red-50 text-red-600 px-2.5 py-1 rounded-lg">
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
                            ? "border-blue-600 bg-blue-600 ring-4 ring-blue-100"
                            : done
                              ? "border-emerald-500 bg-emerald-500"
                              : "border-gray-200 bg-white"
                        }`}
                      />
                      <span
                        className={`text-[10px] font-semibold text-center leading-tight ${
                          active ? "text-blue-600" : done ? "text-emerald-600" : "text-gray-300"
                        }`}
                      >
                        {step.label}
                      </span>
                      {idx < STATUS_STEPS.length - 1 && (
                        <div
                          className={`hidden ${
                            done ? "bg-emerald-400" : "bg-gray-200"
                          }`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {isCancelled && (
              <p className="text-sm text-red-500 bg-red-50 rounded-xl px-4 py-3 mb-4">
                Pesanan ini telah dibatalkan oleh admin. Silakan hubungi admin jika ada pertanyaan.
              </p>
            )}
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <h3 className="text-xs font-bold text-gray-500 uppercase mb-3">Item Pesanan</h3>
            <div className="space-y-2">
              {(items ?? []).map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-gray-700">{item.game_name_snapshot}</span>
                  <span className="text-gray-400">{formatPrice(item.price)}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100 font-bold">
              <span className="text-xs text-gray-500">Total</span>
              <span className="text-blue-600">{formatPrice(order.total)}</span>
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <h3 className="text-xs font-bold text-gray-500 uppercase mb-3">Data Pemesanan</h3>
            <dl className="grid grid-cols-2 gap-y-2 text-sm">
              <dt className="text-gray-400">Nama</dt>
              <dd className="text-gray-800">{order.guest_name ?? "-"}</dd>
              <dt className="text-gray-400">Player ID</dt>
              <dd className="text-gray-800">{order.player_id}</dd>
            </dl>
          </div>
        </div>
      )}
    </main>
  );
}

