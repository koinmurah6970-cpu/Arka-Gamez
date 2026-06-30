import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/format";

function StatCard({
  label,
  value,
  href,
  tone = "default",
}: {
  label: string;
  value: string | number;
  href?: string;
  tone?: "default" | "warning";
}) {
  const content = (
    <div
      className={`bg-white border rounded-2xl p-5 shadow-sm hover:shadow-md transition ${
        tone === "warning" ? "border-amber-200" : "border-gray-100"
      }`}
    >
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
      <p
        className={`text-2xl font-extrabold mt-1 ${
          tone === "warning" ? "text-amber-600" : "text-gray-900"
        }`}
      >
        {value}
      </p>
    </div>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [
    { count: gamesTotal },
    { count: gamesActive },
    { count: gamesDraft },
    { count: gamesNeedsQc },
    { count: ordersPending },
    { data: revenueRows },
  ] = await Promise.all([
    supabase.from("games").select("*", { count: "exact", head: true }),
    supabase.from("games").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("games").select("*", { count: "exact", head: true }).eq("status", "draft"),
    supabase
      .from("games")
      .select("*", { count: "exact", head: true })
      .or("cover_source.eq.rawg,cover_source.eq.placeholder,cover_source.is.null"),
    supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase
      .from("orders")
      .select("total")
      .in("status", ["paid", "completed"])
      .gte("created_at", startOfMonth.toISOString()),
  ]);

  const revenueThisMonth = (revenueRows ?? []).reduce((sum, o) => sum + Number(o.total), 0);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Dashboard</h1>
      <p className="text-sm text-gray-400 mb-6">Ringkasan toko GAMOS hari ini.</p>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard label="Total Game" value={gamesTotal ?? 0} href="/admin/games" />
        <StatCard label="Game Aktif" value={gamesActive ?? 0} href="/admin/games?status=active" />
        <StatCard label="Game Draft" value={gamesDraft ?? 0} href="/admin/games?status=draft" />
        <StatCard
          label="Perlu Review Cover"
          value={gamesNeedsQc ?? 0}
          href="/admin/games?qc=1"
          tone={gamesNeedsQc && gamesNeedsQc > 0 ? "warning" : "default"}
        />
        <StatCard
          label="Pesanan Pending"
          value={ordersPending ?? 0}
          href="/admin/pesanan?status=pending"
          tone={ordersPending && ordersPending > 0 ? "warning" : "default"}
        />
        <StatCard label="Revenue Bulan Ini" value={formatPrice(revenueThisMonth)} />
      </div>
    </div>
  );
}
