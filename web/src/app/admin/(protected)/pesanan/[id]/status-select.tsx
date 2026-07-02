"use client";

import { useState, useTransition } from "react";
import { updateOrderStatus } from "../actions";
import type { OrderStatus } from "@/lib/supabase/types";

const STATUSES: OrderStatus[] = ["pending", "confirmed", "paid", "processing", "completed"];

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending:    "Pending",
  confirmed:  "Dikonfirmasi",
  paid:       "Lunas",
  processing: "Diproses",
  completed:  "Selesai",
  cancelled:  "Dibatalkan",
};

const STATUS_STYLE: Record<OrderStatus, { idle: string; active: string }> = {
  pending:    { idle: "bg-white text-gray-600 border-gray-200", active: "bg-gray-900 text-white border-transparent shadow-md" },
  confirmed:  { idle: "bg-white text-gray-600 border-gray-200", active: "bg-gray-900 text-white border-transparent shadow-md" },
  paid:       { idle: "bg-white text-gray-600 border-gray-200", active: "bg-gray-900 text-white border-transparent shadow-md" },
  processing: { idle: "bg-white text-gray-600 border-gray-200", active: "bg-gray-900 text-white border-transparent shadow-md" },
  completed:  { idle: "bg-white text-gray-600 border-gray-200", active: "bg-gray-900 text-white border-transparent shadow-md" },
  cancelled:  { idle: "bg-white text-gray-600 border-gray-200", active: "bg-gray-900 text-white border-transparent shadow-md" },
};

export function StatusSelect({
  orderId,
  currentStatus,
}: {
  orderId: string;
  currentStatus: OrderStatus;
}) {
  const [selected, setSelected] = useState<OrderStatus>(currentStatus);
  const [isPending, startTransition] = useTransition();

  const isDone = currentStatus === "completed" || currentStatus === "cancelled";

  function confirm() {
    if (selected === currentStatus) return;
    const fd = new FormData();
    fd.set("status", selected);
    startTransition(() => updateOrderStatus(orderId, fd));
  }

  function cancel() {
    const fd = new FormData();
    fd.set("status", "cancelled");
    startTransition(() => updateOrderStatus(orderId, fd));
  }

  if (isDone) {
    return (
      <p className={`text-sm font-semibold text-center py-3 rounded-xl ${
        currentStatus === "completed"
          ? "bg-emerald-50 text-emerald-700"
          : "bg-red-50 text-red-600"
      }`}>
        {currentStatus === "completed" ? "✓ Pesanan telah selesai" : "✕ Pesanan dibatalkan"}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-xs font-bold text-muted uppercase tracking-wider">Update Status</p>

      {/* Status option buttons */}
      <div className="grid grid-cols-5 gap-2">
        {STATUSES.map((s) => {
          const isSelected = selected === s;
          const isCurrent = currentStatus === s;
          const style = STATUS_STYLE[s];
          return (
            <button
              key={s}
              onClick={() => setSelected(s)}
              disabled={isPending}
              className={`py-2.5 px-1 rounded-xl border-2 text-xs font-bold transition-all text-center leading-tight ${
                isSelected ? style.active : style.idle
              }`}
            >
              {STATUS_LABEL[s]}
              {isCurrent && (
                <span className="block text-[9px] font-normal opacity-60 mt-0.5">saat ini</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          disabled={isPending || selected === currentStatus}
          onClick={confirm}
          className="flex-1 bg-gray-900 hover:bg-gray-700 disabled:opacity-40 text-white font-bold text-sm py-2.5 rounded-xl transition"
        >
          {isPending ? "Menyimpan..." : "Konfirmasi"}
        </button>
        <button
          disabled={isPending}
          onClick={cancel}
          className="bg-red-50 hover:bg-red-100 disabled:opacity-50 text-red-600 font-bold text-sm px-4 py-2.5 rounded-xl transition border border-red-200"
        >
          Batalkan
        </button>
      </div>
    </div>
  );
}
