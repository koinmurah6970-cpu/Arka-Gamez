import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { GameMediaGallery } from "@/components/game-media-gallery";
import { PurchasePanel } from "@/components/purchase-panel";

async function getGame(slug: string) {
  const supabase = await createClient();
  const { data: game } = await supabase
    .from("games")
    .select("*, category:categories(*)")
    .eq("slug", slug)
    .eq("status", "active")
    .single();

  if (!game) return null;

  const { data: media } = await supabase
    .from("game_media")
    .select("*")
    .eq("game_id", game.id)
    .order("sort_order");

  return { game, media: media ?? [] };
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

  const { game, media } = result;

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
    </main>
  );
}
