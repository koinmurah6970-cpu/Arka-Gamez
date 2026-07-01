import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/format";

function StatCard({
  label,
  value,
  href,
  icon,
  accent = "blue",
}: {
  label: string;
  value: string | number;
  href?: string;
  icon: React.ReactNode;
  accent?: "blue" | "emerald" | "amber" | "violet";
}) {
  const accentMap = {
    blue: "from-blue-500/10 to-blue-600/5 text-blue-600",
    emerald: "from-emerald-500/10 to-emerald-600/5 text-emerald-600",
    amber: "from-amber-500/10 to-amber-600/5 text-amber-600",
    violet: "from-violet-500/10 to-violet-600/5 text-violet-600",
  };

  const card = (
    <div className="bg-white rounded-xl border border-gray-100 p-4 hover:border-gray-200 hover:shadow-sm transition group">
      <div className="flex items-start justify-between mb-3">
        <div className={`h-9 w-9 rounded-lg bg-gradient-to-br ${accentMap[accent]} flex items-center justify-center`}>
          {icon}
        </div>
        {href && (
          <svg className="h-4 w-4 text-gray-300 group-hover:text-gray-400 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        )}
      </div>
      <p className="text-[22px] font-bold text-gray-900 leading-tight">{value}</p>
      <p className="text-xs text-gray-400 mt-0.5 font-medium">{label}</p>
    </div>
  );
  return href ? <Link href={href}>{card}</Link> : card;
}

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  // Fetch just the narrow columns needed and tally in JS instead of firing
  // one `count: exact` round-trip per stat -- Postgres still has to scan the
  // table for an exact count, so this trades 7 round-trips for 3 without
  // needing a new DB function.
  const [{ data: gameRows }, { data: orderStatusRows }, { data: revenueRows }] =
    await Promise.all([
      supabase.from("games").select("status, cover_source"),
      supabase.from("orders").select("status"),
      supabase
        .from("orders")
        .select("total")
        .in("status", ["paid", "completed"])
        .gte("created_at", startOfMonth.toISOString()),
    ]);

  const gamesTotal = gameRows?.length ?? 0;
  const gamesActive = gameRows?.filter((g) => g.status === "active").length ?? 0;
  const gamesDraft = gameRows?.filter((g) => g.status === "draft").length ?? 0;
  const gamesNeedsQc =
    gameRows?.filter(
      (g) => g.cover_source === "rawg" || g.cover_source === "placeholder" || !g.cover_source
    ).length ?? 0;

  const ordersTotal = orderStatusRows?.length ?? 0;
  const ordersPending = orderStatusRows?.filter((o) => o.status === "pending").length ?? 0;

  const revenueThisMonth = (revenueRows ?? []).reduce((sum, o) => sum + Number(o.total), 0);

  const gameIcon = (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  const orderIcon = (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  );

  const alertIcon = (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );

  const revenueIcon = (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-xs text-gray-400 mt-0.5">Ringkasan toko GAMOS</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <StatCard label="Total Game" value={gamesTotal ?? 0} href="/admin/games" icon={gameIcon} accent="blue" />
        <StatCard label="Game Aktif" value={gamesActive ?? 0} href="/admin/games?status=active" icon={gameIcon} accent="emerald" />
        <StatCard label="Game Draft" value={gamesDraft ?? 0} href="/admin/games?status=draft" icon={gameIcon} accent="violet" />
        <StatCard
          label="Perlu Review Cover"
          value={gamesNeedsQc ?? 0}
          href="/admin/games?qc=1"
          icon={alertIcon}
          accent="amber"
        />
        <StatCard
          label="Pesanan Pending"
          value={ordersPending ?? 0}
          href="/admin/pesanan?status=pending"
          icon={orderIcon}
          accent={ordersPending && ordersPending > 0 ? "amber" : "blue"}
        />
        <StatCard label="Revenue Bulan Ini" value={formatPrice(revenueThisMonth)} icon={revenueIcon} accent="emerald" />
      </div>

      <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Link
          href="/admin/games/baru"
          className="flex items-center gap-2 bg-white border border-gray-100 rounded-xl px-4 py-3 hover:border-blue-200 hover:bg-blue-50/50 transition group"
        >
          <svg className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          <span className="text-xs font-semibold text-gray-600 group-hover:text-blue-600 transition">Tambah Game</span>
        </Link>
        <Link
          href="/admin/pesanan"
          className="flex items-center gap-2 bg-white border border-gray-100 rounded-xl px-4 py-3 hover:border-blue-200 hover:bg-blue-50/50 transition group"
        >
          <svg className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <span className="text-xs font-semibold text-gray-600 group-hover:text-blue-600 transition">Lihat Pesanan</span>
        </Link>
        <Link
          href="/admin/kategori"
          className="flex items-center gap-2 bg-white border border-gray-100 rounded-xl px-4 py-3 hover:border-blue-200 hover:bg-blue-50/50 transition group"
        >
          <svg className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
          </svg>
          <span className="text-xs font-semibold text-gray-600 group-hover:text-blue-600 transition">Kategori</span>
        </Link>
        <Link
          href="/admin/pengaturan"
          className="flex items-center gap-2 bg-white border border-gray-100 rounded-xl px-4 py-3 hover:border-blue-200 hover:bg-blue-50/50 transition group"
        >
          <svg className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-xs font-semibold text-gray-600 group-hover:text-blue-600 transition">Pengaturan</span>
        </Link>
      </div>

      <div className="mt-6 bg-white rounded-xl border border-gray-100 p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-gray-900">Ringkasan</h2>
        </div>
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between py-1.5 border-b border-gray-50">
            <span className="text-gray-400">Total pesanan</span>
            <span className="font-bold text-gray-700">{ordersTotal ?? 0}</span>
          </div>
          <div className="flex items-center justify-between py-1.5 border-b border-gray-50">
            <span className="text-gray-400">Game aktif / total</span>
            <span className="font-bold text-gray-700">{gamesActive ?? 0} / {gamesTotal ?? 0}</span>
          </div>
          <div className="flex items-center justify-between py-1.5">
            <span className="text-gray-400">Revenue bulan ini</span>
            <span className="font-bold text-emerald-600">{formatPrice(revenueThisMonth)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
