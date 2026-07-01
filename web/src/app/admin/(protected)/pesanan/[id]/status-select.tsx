"use client";

import { updateOrderStatus } from "../actions";
import type { OrderStatus } from "@/lib/supabase/types";

const STATUS_FLOW: OrderStatus[] = [
  "pending",
  "confirmed",
  "paid",
  "processing",
  "completed",
  "cancelled",
];
const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Pending",
  confirmed: "Dikonfirmasi",
  paid: "Lunas",
  processing: "Diproses",
  completed: "Selesai",
  cancelled: "Dibatalkan",
};

export function StatusSelect({
  orderId,
  currentStatus,
}: {
  orderId: string;
  currentStatus: OrderStatus;
}) {
  return (
    <form action={updateOrderStatus.bind(null, orderId)} className="flex items-center gap-2">
      <select
        name="status"
        defaultValue={currentStatus}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm flex-1"
      >
        {STATUS_FLOW.map((s) => (
          <option key={s} value={s}>
            {STATUS_LABEL[s]}
          </option>
        ))}
      </select>
    </form>
  );
}
