import { Suspense } from "react";
import { unstable_cache } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createClient as createPublicClient } from "@/lib/supabase/public";
import { ProductCard } from "@/components/product-card";
import { SearchBar } from "@/components/search-bar";
import { CategoryFilter } from "@/components/category-filter";
import { Pagination } from "@/components/pagination";
import { StorefrontHero } from "@/components/storefront-hero";
import { SortSelect } from "@/components/sort-select";
import { SortPendingProvider } from "@/components/sort-pending-context";
import { CatalogGridFade } from "@/components/catalog-grid-fade";
import { PAGE_SIZE } from "@/lib/constants";
import { applySearchFilter } from "@/lib/search";

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
  searchParams: Promise<{ q?: string; kategori?: string; page?: string; sort?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const q = params.q?.trim() ?? "";
  const kategori = params.kategori;
  const sort = params.sort ?? "relevan";

  const supabase = await createClient();

  // categories is cached (see getCategories above), so resolving the
  // category name -> id here is effectively free after the first request --
  // no need to fight Supabase's select-string type parser with a dynamic
  // embedded-join filter just to avoid a "sequential" round-trip that no
  // longer exists.
  const categories = await getCategories();

  const catId = kategori ? (categories.find((c) => c.name === kategori)?.id ?? null) : null;
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  function buildBase(select: string, withCount = false) {
    let q2 = supabase.from("games").select(select, withCount ? { count: "exact" } : undefined).eq("status", "active");
    if (q) q2 = applySearchFilter(q2, "name", q);
    if (catId) q2 = q2.eq("category_id", catId);
    if (sort === "harga-asc")   q2 = q2.order("price", { ascending: true });
    else if (sort === "harga-desc") q2 = q2.order("price", { ascending: false });
    else if (sort === "diskon") q2 = q2.order("original_price", { ascending: false }).order("price", { ascending: true });
    else if (sort === "nama-az") q2 = q2.order("name", { ascending: true });
    else if (sort === "terbaru") q2 = q2.order("created_at", { ascending: false });
    else q2 = q2.order("is_new", { ascending: false }).order("created_at", { ascending: false });
    return q2;
  }

  const [{ data: games, count }, { data: nextCovers }] = await Promise.all([
    buildBase(GAME_CARD_FIELDS, true).range(from, to),
    // Prefetch next page — same filters & sort, only cover_url needed
    buildBase("cover_url").not("cover_url", "is", null).range(from + PAGE_SIZE, to + PAGE_SIZE) as unknown as Promise<{ data: { cover_url: string | null }[] | null }>,
  ]);

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  const isDefaultView = !q && !kategori && page === 1;

  return (
    <main className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Prefetch next page images — browser downloads in background while user reads current page */}
      {nextCovers?.map((g) =>
        g.cover_url ? <link key={g.cover_url} rel="prefetch" as="image" href={g.cover_url} /> : null
      )}

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

      <SortPendingProvider>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <Suspense fallback={<div className="h-[40px]" />}>
            <CategoryFilter categories={categories} />
          </Suspense>
          <Suspense fallback={<div className="h-[40px]" />}>
            <SortSelect />
          </Suspense>
        </div>

        <CatalogGridFade>
          {games && games.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 mt-4">
              {games.map((game, i) => (
                <ProductCard key={game.id} game={game} priority={i < 5} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 text-muted text-sm">
              Tidak ada game ditemukan.
            </div>
          )}
        </CatalogGridFade>
      </SortPendingProvider>

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        searchParams={{ q: params.q, kategori: params.kategori, sort: params.sort }}
      />
    </main>
  );
}
