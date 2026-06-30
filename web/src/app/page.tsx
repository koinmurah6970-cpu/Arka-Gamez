import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { ProductCard } from "@/components/product-card";
import { SearchBar } from "@/components/search-bar";
import { CategoryFilter } from "@/components/category-filter";
import { Pagination } from "@/components/pagination";
import { PAGE_SIZE } from "@/lib/constants";

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

  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order");

  let query = supabase
    .from("games")
    .select("*, category:categories(*)", { count: "exact" })
    .eq("status", "active");

  if (q) query = query.ilike("name", `%${q}%`);
  if (kategori) {
    const cat = categories?.find((c) => c.name === kategori);
    if (cat) query = query.eq("category_id", cat.id);
  }

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const { data: games, count } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  return (
    <main className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Jelajahi Koleksi</h2>
        <p className="text-xs text-gray-400 mt-1 font-medium">
          {count !== null ? `• ${count} Game` : "Memuat total game..."}
        </p>
      </div>

      <Suspense fallback={<div className="h-[60px]" />}>
        <SearchBar />
      </Suspense>
      <Suspense fallback={<div className="h-[40px]" />}>
        <CategoryFilter categories={categories ?? []} />
      </Suspense>

      {games && games.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 mt-4">
          {games.map((game) => (
            <ProductCard key={game.id} game={game} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-gray-400 text-sm">
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
