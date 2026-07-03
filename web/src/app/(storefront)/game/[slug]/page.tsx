import type { Metadata } from "next";
import Link from "next/link";
import { cache } from "react";
import { notFound } from "next/navigation";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { GameMediaGallery } from "@/components/game-media-gallery";
import { PurchasePanel } from "@/components/purchase-panel";
import { ProductCard, type GameCardData } from "@/components/product-card";
import { StarRating } from "@/components/star-rating";
import { ReviewForm } from "@/components/review-form";
import { ReviewList } from "@/components/review-list";
import { emailToUsername } from "@/lib/auth-helpers";

const getGame = cache(async (slug: string) => {
  const supabase = await createClient();
  const { data: game } = await supabase
    .from("games")
    .select("*, category:categories(*)")
    .eq("slug", slug)
    .eq("status", "active")
    .single();

  if (!game) return null;

  const [{ data: media }, { data: reviews }, { count: orderCount }, { data: relatedRaw }] =
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
      game.category_id
        ? supabase
            .from("games")
            .select("id, slug, name, price, original_price, cover_url, is_new, size_label, category:categories(name)")
            .eq("status", "active")
            .eq("category_id", game.category_id)
            .neq("id", game.id)
            .order("is_new", { ascending: false })
            .order("created_at", { ascending: false })
            .limit(5)
        : Promise.resolve({ data: [] }),
    ]);

  return {
    game,
    media: media ?? [],
    reviews: reviews ?? [],
    orderCount: orderCount ?? 0,
    related: (relatedRaw ?? []) as GameCardData[],
  };
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const result = await getGame(slug);
  if (!result) return { title: "Game tidak ditemukan" };

  const { game } = result;
  const description = game.description ?? `Beli & install ${game.name} sekarang.`;
  return {
    title: game.name,
    description,
    openGraph: {
      title: game.name,
      description,
      type: "website",
      images: game.cover_url ? [game.cover_url] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: game.name,
      description,
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

  const { game, media, reviews, orderCount, related } = result;

  const user = await getCurrentUser();

  let hasOrdered = false;
  if (user) {
    const supabase = await createClient();
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

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: game.name,
    description: game.description ?? `Beli & install ${game.name} sekarang.`,
    ...(game.cover_url && { image: game.cover_url }),
    offers: {
      "@type": "Offer",
      price: game.price,
      priceCurrency: "IDR",
      availability: "https://schema.org/InStock",
    },
    ...(reviews.length > 0 && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: avgRating,
        reviewCount: reviews.length,
      },
    }),
  };

  return (
    <main className="container mx-auto px-4 py-8 max-w-7xl">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <div className="text-xs font-semibold text-muted mb-6 flex items-center gap-2">
        <Link href="/" className="hover:text-foreground">
          Home
        </Link>
        <span>/</span>
        <Link href="/" className="hover:text-foreground">
          Catalogue
        </Link>
        <span>/</span>
        <span className="text-foreground">{game.name}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-7">
          <GameMediaGallery media={media} fallbackImage={game.cover_url} gameName={game.name} sourceId={game.source_id} />
        </div>

        <div className="md:col-span-5 flex flex-col justify-start gap-6">
          <PurchasePanel game={game} />

          <div className="flex items-center gap-4 px-1">
            <div className="flex items-center gap-1.5">
              <StarRating rating={avgRating} size="md" />
              <span className="text-sm font-bold text-foreground">
                {avgRating > 0 ? avgRating.toFixed(1) : "-"}
              </span>
              <span className="text-xs text-muted">
                ({reviews.length})
              </span>
            </div>
            <div className="text-xs text-muted border-l border-border-subtle pl-4">
              <span className="font-bold text-foreground">{orderCount}</span> kali dipesan
            </div>
          </div>

          <div className="px-1">
            <h2 className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">
              About This Game
            </h2>
            <p className="text-xs text-muted leading-relaxed text-justify">
              {game.description || `Mainkan keseruan game ${game.name}.`}
            </p>
          </div>
        </div>
      </div>

      <section className="mt-12">
        <h2 className="text-lg font-bold text-foreground mb-6">Review &amp; Testimoni</h2>

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

      {related.length > 0 && (
        <section className="mt-14">
          <h2 className="text-lg font-bold text-foreground mb-6">Kamu Mungkin Suka</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {related.map((g) => (
              <ProductCard key={g.id} game={g} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
