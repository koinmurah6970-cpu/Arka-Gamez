import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/format";
import { StatusSelect } from "./status-select";

function buildWhatsAppLink(phone: string, orderNumber: string, playerId: string) {
  const digits = phone.replace(/\D/g, "").replace(/^0/, "62");
  const message = `Halo, saya admin Link Yu. Mau konfirmasi pesanan ${orderNumber} (Player ID: ${playerId}).`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: order }, { data: items }] = await Promise.all([
    supabase.from("orders").select("*").eq("id", id).single(),
    supabase.from("order_items").select("*").eq("order_id", id),
  ]);

  if (!order) notFound();

  return (
    <div className="max-w-2xl">
      <Link href="/admin/pesanan" className="text-xs text-gray-400 hover:text-gray-700">
        ← Kembali ke daftar pesanan
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mt-1 mb-1 font-mono">
        {order.order_number}
      </h1>
      <p className="text-xs text-gray-400 mb-6">
        {new Date(order.created_at).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })}
      </p>

      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm mb-4">
        <h2 className="text-xs font-bold text-gray-500 uppercase mb-3">Data Customer</h2>
        <dl className="grid grid-cols-2 gap-y-2 text-sm">
          <dt className="text-gray-400">Nama</dt>
          <dd className="text-gray-800">{order.guest_name ?? "-"}</dd>
          <dt className="text-gray-400">WhatsApp</dt>
          <dd className="text-gray-800">{order.guest_whatsapp ?? "-"}</dd>
          <dt className="text-gray-400">Player ID</dt>
          <dd className="text-gray-800">{order.player_id}</dd>
        </dl>
        {order.guest_whatsapp && (
          <a
            href={buildWhatsAppLink(order.guest_whatsapp, order.order_number, order.player_id)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-4 bg-emerald-600 text-white text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-emerald-700 transition"
          >
            Chat WhatsApp Customer
          </a>
        )}
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm mb-4">
        <h2 className="text-xs font-bold text-gray-500 uppercase mb-3">Item Dipesan</h2>
        <div className="space-y-2">
          {(items ?? []).map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-gray-700">{item.game_name_snapshot}</span>
              <span className="text-gray-500">{formatPrice(item.price)}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100 font-bold">
          <span className="text-sm text-gray-500">Total</span>
          <span className="text-blue-600">{formatPrice(order.total)}</span>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
        <h2 className="text-xs font-bold text-gray-500 uppercase mb-3">Update Status</h2>
        <StatusSelect orderId={order.id} currentStatus={order.status} />
      </div>
    </div>
  );
}
