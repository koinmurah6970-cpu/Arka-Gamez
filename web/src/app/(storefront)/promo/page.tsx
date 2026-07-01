import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Promo",
  description: "Promo & bundling terbaru dari GAMOS STORE.",
};

const ACCENTS = [
  "from-amber-500/[0.08] border-amber-500/20 text-amber-500",
  "from-indigo-500/[0.08] border-indigo-500/20 text-accent",
  "from-violet-500/[0.08] border-violet-500/20 text-violet-400",
  "from-emerald-500/[0.08] border-emerald-500/20 text-emerald-500",
];

export default async function PromoPage() {
  const supabase = await createClient();
  const { data: cards } = await supabase
    .from("promo_cards")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  return (
    <main className="container mx-auto px-4 py-8 max-w-5xl">
      <h1 className="text-2xl font-bold text-foreground mb-1">🔥 Promo</h1>
      <p className="text-sm text-muted mb-8">Nikmatin penawaran spesial dari kami.</p>

      {cards && cards.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {cards.map((card, i) => {
            const accent = ACCENTS[i % ACCENTS.length];
            const [gradient, border, textColor] = accent.split(" ");
            return (
              <div
                key={card.id}
                className={`relative rounded-2xl border ${border} bg-gradient-to-br ${gradient} to-transparent p-6 overflow-hidden hover:-translate-y-1 transition-all duration-300`}
              >
                <span className={`text-[10px] font-bold uppercase tracking-wider ${textColor}`}>
                  Promo
                </span>
                <h2 className="text-foreground text-lg font-extrabold mt-2 leading-snug">
                  {card.title}
                </h2>
                {card.description && (
                  <p className="text-muted text-sm mt-2 leading-relaxed">{card.description}</p>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 text-muted text-sm bg-surface border border-border-subtle rounded-2xl">
          Belum ada promo aktif saat ini. Cek lagi nanti ya!
        </div>
      )}
    </main>
  );
}
