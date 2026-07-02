import { Suspense } from "react";
import { unstable_cache } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createClient as createPublicClient } from "@/lib/supabase/public";
import { ProductCard } from "@/components/product-card";
import { SearchBar } from "@/components/search-bar";
import { CategoryFilter } from "@/components/category-filter";
import { Pagination } from "@/components/pagination";
import { StorefrontHero } from "@/components/storefront-hero";
import { PAGE_SIZE } from "@/lib/constants";

// Categories barely ever change -- cache them instead of round-tripping to
// Supabase on every single catalog request. Uses the plain (cookie-less)
// client since `unstable_cache` can't wrap request-bound APIs like cookies().
const getCategories = unstable_cache(
  async () => {
    const supabase = createPublicClient();
    const { data } = await supabase.from("categories").select("*").order("sort_order");
    return data ?? [];
  },
  ["catalog-categories"],
  { revalidate: 300 }
);

// Only the columns ProductCard renders -- selecting "*" here would drag
// `description` and other unused columns across every one of the 24 rows.
const GAME_CARD_FIELDS = "id, slug, name, price, original_price, cover_url, is_new, size_label, category:categories(name)";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; kategori?: string; page?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const q = params.q?.trim() ?? "";
  const kategori = params.kategori;

  const supabase = await createClient();

  // categories is cached (see getCategories above), so resolving the
  // category name -> id here is effectively free after the first request --
  // no need to fight Supabase's select-string type parser with a dynamic
  // embedded-join filter just to avoid a "sequential" round-trip that no
  // longer exists.
  const categories = await getCategories();

  let query = supabase
    .from("games")
    .select(GAME_CARD_FIELDS, { count: "exact" })
    .eq("status", "active");

  if (q) query = query.ilike("name", `%${q}%`);
  if (kategori) {
    const cat = categories.find((c) => c.name === kategori);
    if (cat) query = query.eq("category_id", cat.id);
  }

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const { data: games, count } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  const isDefaultView = !q && !kategori && page === 1;

  return (
    <main className="container mx-auto px-4 py-8 max-w-7xl">
      {isDefaultView && <StorefrontHero />}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Jelajahi Koleksi</h1>
        <p className="text-xs text-muted mt-1 font-medium">
          {count !== null ? `• ${count} Game` : "Memuat total game..."}
        </p>
      </div>

      <Suspense fallback={<div className="h-[60px]" />}>
        <SearchBar />
      </Suspense>
      <Suspense fallback={<div className="h-[40px]" />}>
        <CategoryFilter categories={categories} />
      </Suspense>

      {games && games.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 mt-4">
          {games.map((game) => (
            <ProductCard key={game.id} game={game} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-muted text-sm">
          Tidak ada game ditemukan.
        </div>
      )}

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        searchParams={{ q: params.q, kategori: params.kategori }}
      />
    </main>
  );
}
