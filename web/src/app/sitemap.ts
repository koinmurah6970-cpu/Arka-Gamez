import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://linkgamez.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();

  const { data: games } = await supabase
    .from("games")
    .select("slug, updated_at")
    .eq("status", "active");

  const gameUrls: MetadataRoute.Sitemap = (games ?? []).map((g) => ({
    url: `${BASE}/game/${g.slug}`,
    lastModified: g.updated_at ?? new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [
    { url: BASE, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${BASE}/promo`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/request-game`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    ...gameUrls,
  ];
}
