import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { GameMediaGallery } from "@/components/game-media-gallery";
import { PurchasePanel } from "@/components/purchase-panel";
import { StarRating } from "@/components/star-rating";
import { ReviewForm } from "@/components/review-form";
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

  const [{ data: media }, { data: reviews }] = await Promise.all([
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
  ]);

  return { game, media: media ?? [], reviews: reviews ?? [] };
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

  const { game, media, reviews } = result;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const myReview = user
    ? reviews.find((r) => r.user_id === user.id) ?? null
    : null;

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

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
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Review & Testimoni</h3>
            <div className="flex items-center gap-2 mt-1">
              {reviews.length > 0 ? (
                <>
                  <StarRating rating={avgRating} size="md" />
                  <span className="text-sm font-bold text-gray-700">
                    {avgRating.toFixed(1)}
                  </span>
                  <span className="text-xs text-gray-400">
                    ({reviews.length} review)
                  </span>
                </>
              ) : (
                <span className="text-xs text-gray-400">Belum ada review</span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-5">
            <ReviewForm
              gameId={game.id}
              userId={user?.id ?? null}
              existingReview={
                myReview
                  ? { id: myReview.id, rating: myReview.rating, comment: myReview.comment }
                  : null
              }
            />
          </div>

          <div className="md:col-span-7">
            {reviews.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-sm">
                Jadilah yang pertama kasih review!
              </div>
            ) : (
              <div className="space-y-3">
                {reviews.map((review) => {
                  const displayName =
                    review.profile?.full_name ||
                    emailToUsername(review.user_id.slice(0, 8));
                  return (
                    <div
                      key={review.id}
                      className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="h-7 w-7 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                            {displayName.charAt(0).toUpperCase()}
                          </span>
                          <span className="text-sm font-semibold text-gray-800">
                            {displayName}
                          </span>
                        </div>
                        <span className="text-[10px] text-gray-400">
                          {new Date(review.created_at).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                      <StarRating rating={review.rating} />
                      {review.comment && (
                        <p className="text-sm text-gray-600 mt-2">{review.comment}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
