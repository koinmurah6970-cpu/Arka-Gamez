import { createClient } from "@/lib/supabase/server";
import { Pagination } from "@/components/pagination";
import { RequestStatusSelect } from "./status-select";
import type { GameRequestStatus } from "@/lib/supabase/types";

const PAGE_SIZE = 50;

const STATUS_LABEL: Record<GameRequestStatus, string> = {
  pending: "Pending",
  fulfilled: "Terpenuhi",
  rejected: "Ditolak",
};
const STATUS_TONE: Record<GameRequestStatus, string> = {
  pending: "bg-amber-50 text-amber-600",
  fulfilled: "bg-emerald-50 text-emerald-600",
  rejected: "bg-red-50 text-red-600",
};
const VALID_STATUSES = Object.keys(STATUS_LABEL) as GameRequestStatus[];

export default async function AdminRequestGamePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const q = params.q?.trim() ?? "";

  const supabase = await createClient();

  let query = supabase
    .from("game_requests")
    .select("*", { count: "exact" });

  if (q) {
    query = query.or(
      `game_name.ilike.%${q}%,requester_name.ilike.%${q}%,requester_wa.ilike.%${q}%`
    );
  }
  if (params.status && VALID_STATUSES.includes(params.status as GameRequestStatus)) {
    query = query.eq("status", params.status as GameRequestStatus);
  }

  const from = (page - 1) * PAGE_SIZE;
  const { data: requests, count } = await query
    .order("created_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Request Game</h1>
      <p className="text-sm text-gray-400 mb-6">{count ?? 0} request masuk</p>

      <form method="GET" className="flex flex-wrap items-center gap-2 mb-4">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Cari judul game / nama / nomor WA..."
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

      <div className="space-y-3">
        {(requests ?? []).map((req) => {
          const digits = req.requester_wa.replace(/\D/g, "").replace(/^0/, "62");
          const waLink = `https://wa.me/${digits}?text=${encodeURIComponent(
            `Halo ${req.requester_name}, request game *${req.game_name}* kamu sudah kami cek ya!`
          )}`;
          return (
            <div
              key={req.id}
              className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-semibold text-gray-900 text-sm truncate">
                      {req.game_name}
                    </span>
                    {req.platform && (
                      <span className="text-[11px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">
                        {req.platform}
                      </span>
                    )}
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${STATUS_TONE[req.status as GameRequestStatus]}`}
                    >
                      {STATUS_LABEL[req.status as GameRequestStatus]}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    <span className="font-medium">{req.requester_name}</span>
                    {" · "}
                    {req.requester_wa}
                    {" · "}
                    {new Date(req.created_at).toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta",
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                  {req.notes && (
                    <p className="text-xs text-gray-400 mt-1 italic">{req.notes}</p>
                  )}
                  {req.admin_notes && (
                    <p className="text-xs text-blue-500 mt-1">Catatan admin: {req.admin_notes}</p>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <a
                    href={waLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs bg-emerald-600 text-white font-semibold px-3 py-1.5 rounded-lg hover:bg-emerald-700 transition"
                  >
                    Chat WA
                  </a>
                  <RequestStatusSelect
                    requestId={req.id}
                    currentStatus={req.status as GameRequestStatus}
                  />
                </div>
              </div>
            </div>
          );
        })}
        {(!requests || requests.length === 0) && (
          <div className="text-center py-16 text-gray-400 text-sm">
            Belum ada request game masuk.
          </div>
        )}
      </div>

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        searchParams={{ q: params.q, status: params.status }}
        basePath="/admin/request-game"
      />
    </div>
  );
}
