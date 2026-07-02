"use client";

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
  return (
    <form action={updateRequestStatus.bind(null, requestId)}>
      <select
        name="status"
        defaultValue={currentStatus}
        className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white"
        onChange={(e) => {
          const form = e.target.closest("form") as HTMLFormElement;
          form.requestSubmit();
        }}
      >
        {(Object.keys(STATUS_LABEL) as GameRequestStatus[]).map((s) => (
          <option key={s} value={s}>
            {STATUS_LABEL[s]}
          </option>
        ))}
      </select>
    </form>
  );
}
