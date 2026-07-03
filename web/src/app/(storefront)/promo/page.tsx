import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Promo",
  description: "Promo & bundling terbaru dari Link Yu.",
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
      <h1 className="text-2xl font-bold text-foreground mb-1 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-500 fill-current" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.921-.212.368-.387.828-.535 1.353-.29 1.026-.47 2.086-.626 3.125a17.909 17.909 0 01-.176 1.002c-.06.27-.123.524-.191.743a4.007 4.007 0 01-1.044 1.776c-.052.05-.107.1-.163.148a4.003 4.003 0 01-2.922.946c.2.062.4.116.6.157a4 4 0 002.247-.275A4.002 4.002 0 0010 11.5c0-.142-.015-.28-.043-.413a4 4 0 01.196-1.008c.114-.346.249-.675.391-.989.252-.558.544-1.12.819-1.642.544-1.034 1.01-1.912 1.258-2.677a8.33 8.33 0 00.329-1.558 8.423 8.423 0 00-.555-3.16z" clipRule="evenodd" />
        </svg>
        Promo
      </h1>
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
