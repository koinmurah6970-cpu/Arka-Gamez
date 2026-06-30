import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/format";
import { Pagination } from "@/components/pagination";
import type { OrderStatus } from "@/lib/supabase/types";

const ADMIN_PAGE_SIZE = 50;

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Pending",
  confirmed: "Dikonfirmasi",
  paid: "Lunas",
  processing: "Diproses",
  completed: "Selesai",
  cancelled: "Dibatalkan",
};
const STATUS_TONE: Record<OrderStatus, string> = {
  pending: "bg-amber-50 text-amber-600",
  confirmed: "bg-blue-50 text-blue-600",
  paid: "bg-emerald-50 text-emerald-600",
  processing: "bg-purple-50 text-purple-600",
  completed: "bg-gray-100 text-gray-600",
  cancelled: "bg-red-50 text-red-600",
};
const VALID_STATUSES = Object.keys(STATUS_LABEL) as OrderStatus[];

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const q = params.q?.trim() ?? "";

  const supabase = await createClient();

  let query = supabase
    .from("orders")
    .select("id, order_number, guest_name, guest_whatsapp, player_id, status, total, created_at", {
      count: "exact",
    });

  if (q) {
    query = query.or(
      `order_number.ilike.%${q}%,player_id.ilike.%${q}%,guest_name.ilike.%${q}%`
    );
  }
  if (params.status && VALID_STATUSES.includes(params.status as OrderStatus)) {
    query = query.eq("status", params.status as OrderStatus);
  }

  const from = (page - 1) * ADMIN_PAGE_SIZE;
  const to = from + ADMIN_PAGE_SIZE - 1;
  const { data: orders, count } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / ADMIN_PAGE_SIZE));

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Kelola Pesanan</h1>
      <p className="text-sm text-gray-400 mb-6">{count ?? 0} total pesanan</p>

      <form method="GET" className="flex flex-wrap items-center gap-2 mb-4">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Cari no. pesanan / player ID / nama..."
          className="flex-1 min-w-[220px] bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
        />
        <select
          name="status"
          defaultValue={params.status ?? ""}
          className="bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm"
        >
          <option value="">Semua Status</option>
          {VALID_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="bg-gray-900 text-white text-sm font-semibold px-4 py-2.5 rounded-xl"
        >
          Filter
        </button>
      </form>

      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">No. Pesanan</th>
              <th className="text-left px-4 py-3">Customer</th>
              <th className="text-left px-4 py-3">Player ID</th>
              <th className="text-left px-4 py-3">Total</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Tanggal</th>
              <th className="text-right px-4 py-3">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(orders ?? []).map((order) => (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs text-gray-700">
                  {order.order_number}
                </td>
                <td className="px-4 py-3 text-gray-700">{order.guest_name ?? "-"}</td>
                <td className="px-4 py-3 text-gray-500">{order.player_id}</td>
                <td className="px-4 py-3 font-semibold text-gray-800">
                  {formatPrice(order.total)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`text-[11px] font-bold px-2 py-1 rounded-md ${STATUS_TONE[order.status]}`}
                  >
                    {STATUS_LABEL[order.status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs">
                  {new Date(order.created_at).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/pesanan/${order.id}`}
                    className="text-blue-600 font-semibold hover:underline"
                  >
                    Detail
                  </Link>
                </td>
              </tr>
            ))}
            {(!orders || orders.length === 0) && (
              <tr>
                <td colSpan={7} className="text-center py-12 text-gray-400">
                  Belum ada pesanan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        searchParams={{ q: params.q, status: params.status }}
        basePath="/admin/pesanan"
      />
    </div>
  );
}
