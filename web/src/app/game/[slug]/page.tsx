import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { GameMediaGallery } from "@/components/game-media-gallery";
import { PurchasePanel } from "@/components/purchase-panel";
import { StarRating } from "@/components/star-rating";
import { ReviewForm } from "@/components/review-form";
import { ReviewList } from "@/components/review-list";
import { emailToUsername } from "@/lib/auth-helpers";

async function getGame(slug: string) {
  const supabase = await createClient();
  const { data: game } = await supabase
    .from("games")
    .select("*, category:categories(*)")
    .eq("slug", slug)
    .eq("status", "active")
    .single();

  if (!game) return null;

  const [{ data: media }, { data: reviews }, { count: orderCount }] =
    await Promise.all([
      supabase
        .from("game_media")
        .select("*")
        .eq("game_id", game.id)
        .order("sort_order"),
      supabase
        .from("reviews")
        .select("*, profile:profiles(full_name)")
        .eq("game_id", game.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("order_items")
        .select("*", { count: "exact", head: true })
        .eq("game_id", game.id),
    ]);

  return {
    game,
    media: media ?? [],
    reviews: reviews ?? [],
    orderCount: orderCount ?? 0,
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const result = await getGame(slug);
  if (!result) return { title: "Game tidak ditemukan" };

  const { game } = result;
  return {
    title: game.name,
    description: game.description ?? `Beli & install ${game.name} sekarang.`,
    openGraph: {
      title: game.name,
      images: game.cover_url ? [game.cover_url] : [],
    },
  };
}

export default async function GameDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const result = await getGame(slug);
  if (!result) notFound();

  const { game, media, reviews, orderCount } = result;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let hasOrdered = false;
  if (user) {
    const { count } = await supabase
      .from("order_items")
      .select("id, order:orders!inner(user_id)", { count: "exact", head: true })
      .eq("game_id", game.id)
      .eq("order.user_id", user.id);
    hasOrdered = (count ?? 0) > 0;
  }

  const myReview = user
    ? reviews.find((r) => r.user_id === user.id) ?? null
    : null;

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  const reviewRows = reviews.map((r) => ({
    id: r.id,
    user_id: r.user_id,
    rating: r.rating,
    comment: r.comment,
    created_at: r.created_at,
    displayName:
      r.profile?.full_name || emailToUsername(r.user_id.slice(0, 8)),
  }));

  return (
    <main className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="text-xs font-semibold text-gray-400 mb-6 flex items-center gap-2">
        <Link href="/" className="hover:text-gray-900">
          Home
        </Link>
        <span>/</span>
        <Link href="/" className="hover:text-gray-900">
          Catalogue
        </Link>
        <span>/</span>
        <span className="text-gray-800">{game.name}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-7">
          <GameMediaGallery media={media} fallbackImage={game.cover_url} gameName={game.name} />
        </div>

        <div className="md:col-span-5 flex flex-col justify-start gap-6">
          <PurchasePanel game={game} />

          <div className="flex items-center gap-4 px-1">
            <div className="flex items-center gap-1.5">
              <StarRating rating={avgRating} size="md" />
              <span className="text-sm font-bold text-gray-700">
                {avgRating > 0 ? avgRating.toFixed(1) : "-"}
              </span>
              <span className="text-xs text-gray-400">
                ({reviews.length})
              </span>
            </div>
            <div className="text-xs text-gray-400 border-l border-gray-200 pl-4">
              <span className="font-bold text-gray-600">{orderCount}</span> kali dipesan
            </div>
          </div>

          <div className="px-1">
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">
              About This Game
            </h4>
            <p className="text-xs text-gray-500 leading-relaxed text-justify">
              {game.description || `Mainkan keseruan game ${game.name}.`}
            </p>
          </div>
        </div>
      </div>

      <section className="mt-12">
        <h3 className="text-lg font-bold text-gray-900 mb-6">Review & Testimoni</h3>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-5">
            <ReviewForm
              gameId={game.id}
              userId={user?.id ?? null}
              hasOrdered={hasOrdered}
              existingReview={
                myReview
                  ? { id: myReview.id, rating: myReview.rating, comment: myReview.comment }
                  : null
              }
            />
          </div>

          <div className="md:col-span-7">
            <ReviewList gameId={game.id} initialReviews={reviewRows} />
          </div>
        </div>
      </section>
    </main>
  );
}
