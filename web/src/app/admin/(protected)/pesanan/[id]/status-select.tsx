"use client";

import { useTransition } from "react";
import { updateOrderStatus } from "../actions";
import type { OrderStatus } from "@/lib/supabase/types";

const LINEAR_FLOW: OrderStatus[] = ["pending", "confirmed", "paid", "processing", "completed"];

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Pending",
  confirmed: "Dikonfirmasi",
  paid: "Lunas",
  processing: "Diproses",
  completed: "Selesai",
  cancelled: "Dibatalkan",
};

const NEXT_ACTION_LABEL: Partial<Record<OrderStatus, string>> = {
  pending: "Konfirmasi Pesanan",
  confirmed: "Tandai Lunas",
  paid: "Mulai Proses",
  processing: "Selesaikan",
};

const STATUS_COLOR: Record<OrderStatus, string> = {
  pending:   "bg-yellow-400",
  confirmed: "bg-blue-500",
  paid:      "bg-indigo-500",
  processing:"bg-purple-500",
  completed: "bg-emerald-500",
  cancelled: "bg-red-500",
};

export function StatusSelect({
  orderId,
  currentStatus,
}: {
  orderId: string;
  currentStatus: OrderStatus;
}) {
  const [pending, startTransition] = useTransition();

  const currentIdx = LINEAR_FLOW.indexOf(currentStatus);
  const nextStatus = currentIdx >= 0 && currentIdx < LINEAR_FLOW.length - 1
    ? LINEAR_FLOW[currentIdx + 1]
    : null;

  const isDone = currentStatus === "completed" || currentStatus === "cancelled";

  function submit(status: OrderStatus) {
    const fd = new FormData();
    fd.set("status", status);
    startTransition(() => updateOrderStatus(orderId, fd));
  }

  return (
    <div className="space-y-5">

      {/* ── Stepper ── */}
      <div className="flex items-center gap-0">
        {LINEAR_FLOW.map((s, idx) => {
          const done = currentIdx > idx;
          const active = currentStatus === s;
          const upcoming = currentIdx < idx && currentStatus !== "cancelled";

          return (
            <div key={s} className="flex items-center flex-1 min-w-0">
              {/* node */}
              <div className="flex flex-col items-center gap-1 flex-shrink-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                  active
                    ? `${STATUS_COLOR[s]} border-transparent text-white shadow-lg`
                    : done
                    ? "bg-emerald-500 border-transparent text-white"
                    : "bg-gray-100 border-gray-200 text-gray-400"
                }`}>
                  {done ? "✓" : idx + 1}
                </div>
                <span className={`text-[10px] font-semibold whitespace-nowrap ${
                  active ? "text-gray-900" : done ? "text-emerald-600" : "text-gray-400"
                }`}>
                  {STATUS_LABEL[s]}
                </span>
              </div>
              {/* connector (not after last) */}
              {idx < LINEAR_FLOW.length - 1 && (
                <div className={`flex-1 h-0.5 mx-1 mt-[-14px] transition-all ${
                  done ? "bg-emerald-400" : "bg-gray-200"
                }`} />
              )}
            </div>
          );
        })}

        {/* Cancelled node — separate */}
        {currentStatus === "cancelled" && (
          <div className="flex flex-col items-center gap-1 ml-3 flex-shrink-0">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-red-500 text-white border-2 border-transparent">
              ✕
            </div>
            <span className="text-[10px] font-semibold text-red-500">Dibatalkan</span>
          </div>
        )}
      </div>

      {/* ── Action buttons ── */}
      {!isDone && (
        <div className="flex gap-2 pt-1">
          {nextStatus && (
            <button
              disabled={pending}
              onClick={() => submit(nextStatus)}
              className="flex-1 bg-gray-900 hover:bg-gray-700 disabled:opacity-50 text-white font-bold text-sm py-2.5 rounded-xl transition"
            >
              {pending ? "Menyimpan..." : `→ ${NEXT_ACTION_LABEL[currentStatus]}`}
            </button>
          )}
          <button
            disabled={pending}
            onClick={() => submit("cancelled")}
            className="bg-red-50 hover:bg-red-100 disabled:opacity-50 text-red-600 font-bold text-sm px-4 py-2.5 rounded-xl transition border border-red-200"
          >
            Batalkan
          </button>
        </div>
      )}

      {isDone && (
        <p className={`text-sm font-semibold text-center py-2 rounded-xl ${
          currentStatus === "completed"
            ? "bg-emerald-50 text-emerald-700"
            : "bg-red-50 text-red-600"
        }`}>
          {currentStatus === "completed" ? "✓ Pesanan telah selesai" : "✕ Pesanan dibatalkan"}
        </p>
      )}

    </div>
  );
}
