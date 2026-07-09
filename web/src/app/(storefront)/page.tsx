import { Suspense } from "react";
import { unstable_cache } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createClient as createPublicClient } from "@/lib/supabase/public";
import { ProductCard } from "@/components/product-card";
import { SearchBar } from "@/components/search-bar";
import { CategoryFilter } from "@/components/category-filter";
import { GenreFilter } from "@/components/genre-filter";
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

const getGenres = unstable_cache(
  async () => {
    const supabase = createPublicClient();
    const { data } = await supabase.from("genres").select("*").order("name");
    return data ?? [];
  },
  ["catalog-genres"],
  { revalidate: 300 }
);

// Only the columns ProductCard renders -- selecting "*" here would drag
// `description` and other unused columns across every one of the 24 rows.
const GAME_CARD_FIELDS = "id, slug, name, price, original_price, cover_url, is_new, size_label, category:categories(name)";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; kategori?: string; page?: string; sort?: string; genre?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const q = params.q?.trim() ?? "";
  const kategori = params.kategori;
  const genre = params.genre;
  const sort = params.sort ?? "relevan";

  const supabase = await createClient();

  const [categories, genres] = await Promise.all([
    getCategories(),
    getGenres(),
  ]);

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from("games")
    .select(GAME_CARD_FIELDS, { count: "exact" })
    .eq("status", "active");

  let prefetchQuery = supabase
    .from("games")
    .select("cover_url")
    .eq("status", "active")
    .not("cover_url", "is", null);

  if (q) {
    query = applySearchFilter(query, "name", q);
    prefetchQuery = applySearchFilter(prefetchQuery, "name", q);
  }

  if (kategori) {
    const cat = categories.find((c) => c.name === kategori);
    if (cat) {
      query = query.eq("category_id", cat.id);
      prefetchQuery = prefetchQuery.eq("category_id", cat.id);
    }
  }

  if (genre) {
    const targetGenre = genres.find((g) => g.slug === genre);
    if (targetGenre) {
      const { data: ggData } = await supabase
        .from("game_genres")
        .select("game_id")
        .eq("genre_id", targetGenre.id);
      const gameIds = (ggData ?? []).map((row: any) => row.game_id);
      query = query.in("id", gameIds);
      prefetchQuery = prefetchQuery.in("id", gameIds);
    }
  }

  if (sort === "harga-asc") {
    query = query.order("price", { ascending: true });
    prefetchQuery = prefetchQuery.order("price", { ascending: true });
  } else if (sort === "harga-desc") {
    query = query.order("price", { ascending: false });
    prefetchQuery = prefetchQuery.order("price", { ascending: false });
  } else if (sort === "diskon") {
    query = query.order("original_price", { ascending: false }).order("price", { ascending: true });
    prefetchQuery = prefetchQuery.order("original_price", { ascending: false }).order("price", { ascending: true });
  } else if (sort === "nama-az") {
    query = query.order("name", { ascending: true });
    prefetchQuery = prefetchQuery.order("name", { ascending: true });
  } else if (sort === "terbaru") {
    query = query.order("created_at", { ascending: false });
    prefetchQuery = prefetchQuery.order("created_at", { ascending: false });
  } else {
    query = query.order("is_new", { ascending: false }).order("created_at", { ascending: false });
    prefetchQuery = prefetchQuery.order("is_new", { ascending: false }).order("created_at", { ascending: false });
  }

  const [{ data: games, count }, { data: nextCovers }] = await Promise.all([
    query.range(from, to),
    prefetchQuery.range(from + PAGE_SIZE, to + PAGE_SIZE),
  ]);

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  const isDefaultView = !q && !kategori && !genre && page === 1;

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
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mt-6">
          <div className="flex-1 space-y-3 min-w-0">
            <Suspense fallback={<div className="h-[40px]" />}>
              <CategoryFilter categories={categories} />
            </Suspense>
            <Suspense fallback={<div className="h-[40px]" />}>
              <GenreFilter genres={genres} />
            </Suspense>
          </div>
          <div className="flex-shrink-0 self-end md:self-auto">
            <Suspense fallback={<div className="h-[40px]" />}>
              <SortSelect />
            </Suspense>
          </div>
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
        searchParams={{ q: params.q, kategori: params.kategori, sort: params.sort, genre: params.genre }}
      />
    </main>
  );
}
