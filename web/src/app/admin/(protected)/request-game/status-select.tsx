"use client";

import { useState, useTransition } from "react";
import { updateRequestStatus } from "./actions";
import type { GameRequestStatus } from "@/lib/supabase/types";

const STATUS_LABEL: Record<GameRequestStatus, string> = {
  pending: "Pending",
  fulfilled: "Terpenuhi",
  rejected: "Ditolak",
};

export function RequestStatusSelect({
  requestId,
  currentStatus,
}: {
  requestId: string;
  currentStatus: GameRequestStatus;
}) {
  const [value, setValue] = useState(currentStatus);
  const [isPending, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as GameRequestStatus;
    setValue(next); // langsung update UI
    const fd = new FormData();
    fd.set("status", next);
    startTransition(() => updateRequestStatus(requestId, fd));
  }

  return (
    <select
      value={value}
      disabled={isPending}
      onChange={handleChange}
      className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white disabled:opacity-60 transition-opacity"
    >
      {(Object.keys(STATUS_LABEL) as GameRequestStatus[]).map((s) => (
        <option key={s} value={s}>
          {STATUS_LABEL[s]}
        </option>
      ))}
    </select>
  );
}
