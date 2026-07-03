import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { ProductCard, type GameCardData } from "@/components/product-card";

export const metadata: Metadata = {
  title: "Wishlist Saya",
  description: "Game-game yang kamu simpan untuk dibeli nanti.",
};

export default async function WishlistPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createClient();

  const { data: wishlistRows } = await supabase
    .from("wishlists")
    .select("game_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const gameIds = (wishlistRows ?? []).map((r: { game_id: string }) => r.game_id);

  let games: GameCardData[] = [];
  if (gameIds.length > 0) {
    const { data } = await supabase
      .from("games")
      .select("id, slug, name, price, original_price, cover_url, is_new, size_label, category:categories(name)")
      .in("id", gameIds)
      .eq("status", "active");

    const rawGames = (data ?? []) as GameCardData[];
    // Preserve wishlist order (newest first)
    games = gameIds
      .map((id: string) => rawGames.find((g) => g.id === id))
      .filter((g): g is GameCardData => !!g);
  }

  return (
    <main className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="text-xs font-semibold text-muted mb-6 flex items-center gap-2">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <span>/</span>
        <span className="text-foreground">Wishlist</span>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Wishlist Saya</h1>
        <p className="text-xs text-muted mt-1 font-medium">
          {games.length > 0 ? `• ${games.length} game tersimpan` : "Belum ada game"}
        </p>
      </div>

      {games.length === 0 ? (
        <div className="text-center py-20 flex flex-col items-center gap-4">
          <svg className="h-12 w-12 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <p className="text-muted text-sm">Belum ada game di wishlist kamu.</p>
          <Link
            href="/"
            className="bg-accent text-accent-foreground text-sm font-bold px-5 py-2.5 rounded-xl hover:opacity-90 transition"
          >
            Jelajahi Game
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {games.map((game) => (
            <ProductCard key={game.id} game={game} />
          ))}
        </div>
      )}
    </main>
  );
}
