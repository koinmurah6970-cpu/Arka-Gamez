import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { formatPrice, discountPercent } from "@/lib/format";

async function getFeaturedDeal() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("games")
    .select("slug, name, cover_url, price, original_price")
    .eq("status", "active")
    .eq("is_featured", true)
    .limit(1)
    .maybeSingle();
  return data;
}

async function getNewThisWeekCount() {
  const supabase = await createClient();
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("games")
    .select("*", { count: "exact", head: true })
    .eq("status", "active")
    .gte("created_at", weekAgo);
  return count ?? 0;
}

export async function StorefrontHero() {
  const [deal, newCount] = await Promise.all([
    getFeaturedDeal(),
    getNewThisWeekCount(),
  ]);

  return (
    <div className="mb-8">
      <div className={`grid gap-3 ${deal ? "md:grid-cols-[2fr_1fr]" : "md:grid-cols-2"}`}>
        {deal && (
          <div className="relative rounded-2xl border border-border-subtle bg-gradient-to-br from-amber-500/[0.06] to-transparent p-5 overflow-hidden">
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider">
              Hemat Terbesar Minggu Ini
            </span>
            <h2 className="text-foreground text-xl sm:text-2xl font-extrabold mt-2 mb-1">{deal.name}</h2>
            <p className="text-muted text-xs max-w-sm">
              Install simple, begitu selesai langsung extract dan play!
            </p>
            <div className="flex items-end justify-between mt-5 flex-wrap gap-3">
              <div>
                <span className="text-muted text-xs line-through block">
                  {formatPrice(deal.original_price)}
                </span>
                <span className="text-foreground text-xl font-extrabold">{formatPrice(deal.price)}</span>
                {discountPercent(deal.price, deal.original_price) > 0 && (
                  <span className="ml-2 text-[10px] font-bold text-emerald-500">
                    HEMAT {discountPercent(deal.price, deal.original_price)}%
                  </span>
                )}
              </div>
              <Link
                href={`/game/${deal.slug}`}
                className="bg-gradient-to-r from-amber-500 to-yellow-600 text-[#09090b] font-bold text-sm px-5 py-2.5 rounded-xl shadow-lg shadow-amber-500/20 hover:opacity-90 transition"
              >
                Beli Sekarang →
              </Link>
            </div>
            {deal.cover_url && (
              <Image
                src={deal.cover_url}
                alt=""
                fill
                unoptimized
                className="object-cover opacity-10 -z-10"
                aria-hidden
              />
            )}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            href="/"
            className="rounded-2xl border border-border-subtle bg-gradient-to-br from-indigo-500/[0.08] to-transparent p-4 hover:border-accent/30 transition"
          >
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider">
              Baru Ditambahkan
            </span>
            <p className="text-foreground text-sm font-bold mt-1.5">{newCount} Game Minggu Ini</p>
            <p className="text-muted text-xs mt-0.5">Lihat semua →</p>
          </Link>
          <Link
            href="/request-game"
            className="rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/[0.08] to-transparent p-4 hover:border-violet-500/40 transition"
          >
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider">
              Gak Ada di Katalog?
            </span>
            <p className="text-foreground text-sm font-bold mt-1.5">✨ Request Game</p>
            <p className="text-muted text-xs mt-0.5">Kabarin kita →</p>
          </Link>
        </div>
      </div>

    </div>
  );
}
