import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/format";
import { Pagination } from "@/components/pagination";
import { publishAllDrafts } from "./actions";
import type { GameStatus } from "@/lib/supabase/types";

const VALID_STATUSES: GameStatus[] = ["draft", "active", "archived"];

const ADMIN_PAGE_SIZE = 50;

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  active: "Aktif",
  archived: "Arsip",
};
const STATUS_TONE: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600",
  active: "bg-emerald-50 text-emerald-600",
  archived: "bg-red-50 text-red-600",
};
const COVER_LABEL: Record<string, string> = {
  steamgriddb: "Auto",
  rawg: "Auto (RAWG)",
  manual: "Manual",
  placeholder: "Belum Ada",
};
const COVER_TONE: Record<string, string> = {
  steamgriddb: "bg-blue-50 text-blue-600",
  rawg: "bg-amber-50 text-amber-600",
  manual: "bg-emerald-50 text-emerald-600",
  placeholder: "bg-red-50 text-red-600",
};

export default async function AdminGamesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; qc?: string; page?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const q = params.q?.trim() ?? "";

  const supabase = await createClient();

  let query = supabase
    .from("games")
    .select("id, slug, name, price, original_price, cover_url, cover_source, status, category:categories(name)", {
      count: "exact",
    });

  if (q) query = query.ilike("name", `%${q}%`);
  if (params.status && VALID_STATUSES.includes(params.status as GameStatus)) {
    query = query.eq("status", params.status as GameStatus);
  }
  if (params.qc === "1") {
    query = query.or("cover_source.eq.rawg,cover_source.eq.placeholder,cover_source.is.null");
  }

  const from = (page - 1) * ADMIN_PAGE_SIZE;
  const to = from + ADMIN_PAGE_SIZE - 1;
  const { data: games, count } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / ADMIN_PAGE_SIZE));
  const { count: draftCount } = await supabase
    .from("games")
    .select("*", { count: "exact", head: true })
    .eq("status", "draft");

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kelola Game</h1>
          <p className="text-sm text-gray-400">{count ?? 0} total game</p>
        </div>
        <div className="flex items-center gap-3">
          {draftCount && draftCount > 0 ? (
            <form action={publishAllDrafts}>
              <button
                type="submit"
                className="bg-emerald-600 text-white text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-emerald-700 transition"
              >
                Publish Semua Draft ({draftCount})
              </button>
            </form>
          ) : null}
          <Link
            href="/admin/games/baru"
            className="bg-blue-600 text-white text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-blue-700 transition"
          >
            + Tambah Game
          </Link>
        </div>
      </div>

      <form method="GET" className="flex flex-wrap items-center gap-2 mb-4">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Cari nama game..."
          className="flex-1 min-w-[200px] bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
        />
        <select
          name="status"
          defaultValue={params.status ?? ""}
          className="bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm"
        >
          <option value="">Semua Status</option>
          <option value="draft">Draft</option>
          <option value="active">Aktif</option>
          <option value="archived">Arsip</option>
        </select>
        <label className="flex items-center gap-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-xl px-3 py-2.5">
          <input type="checkbox" name="qc" value="1" defaultChecked={params.qc === "1"} />
          Perlu review cover
        </label>
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
              <th className="text-left px-4 py-3">Game</th>
              <th className="text-left px-4 py-3">Kategori</th>
              <th className="text-left px-4 py-3">Harga</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Cover</th>
              <th className="text-right px-4 py-3">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(games ?? []).map((game) => (
              <tr key={game.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="relative h-12 w-9 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
                      {game.cover_url && (
                        <Image src={game.cover_url} alt={game.name} fill unoptimized className="object-cover" />
                      )}
                    </div>
                    <span className="font-semibold text-gray-800 line-clamp-1">{game.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-500">{game.category?.name ?? "-"}</td>
                <td className="px-4 py-3 text-gray-700">{formatPrice(game.price)}</td>
                <td className="px-4 py-3">
                  <span
                    className={`text-[11px] font-bold px-2 py-1 rounded-md ${STATUS_TONE[game.status]}`}
                  >
                    {STATUS_LABEL[game.status]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`text-[11px] font-bold px-2 py-1 rounded-md ${
                      COVER_TONE[game.cover_source ?? "placeholder"]
                    }`}
                  >
                    {COVER_LABEL[game.cover_source ?? "placeholder"]}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/games/${game.id}`}
                    className="text-blue-600 font-semibold hover:underline"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
            {(!games || games.length === 0) && (
              <tr>
                <td colSpan={6} className="text-center py-12 text-gray-400">
                  Gak ada game yang cocok.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        searchParams={{ q: params.q, status: params.status, qc: params.qc }}
        basePath="/admin/games"
      />
    </div>
  );
}
