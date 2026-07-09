"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Game, GameStatus } from "@/lib/supabase/types";

export async function publishAllDrafts() {
  const supabase = await createClient();
  await supabase.from("games").update({ status: "active" }).eq("status", "draft");
  revalidatePath("/admin/games");
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function deleteGame(id: string) {
  const supabase = await createClient();
  await supabase.from("games").delete().eq("id", id);
  revalidatePath("/admin/games");
  revalidatePath("/admin");
}

export async function updateGame(id: string, formData: FormData) {
  const supabase = await createClient();

  const updates: Partial<Game> = {
    name: String(formData.get("name") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim() || null,
    size_label: String(formData.get("size_label") ?? "").trim() || null,
    price: Number(formData.get("price")),
    original_price: Number(formData.get("original_price")),
    category_id: String(formData.get("category_id") ?? "") || null,
    status: String(formData.get("status") ?? "draft") as GameStatus,
    is_featured: formData.get("is_featured") === "on",
  };

  const coverFile = formData.get("cover_file");
  if (coverFile instanceof File && coverFile.size > 0) {
    const slug = String(formData.get("slug") ?? "").trim() || id;
    const path = `${slug}.webp`;
    const { error: uploadError } = await supabase.storage
      .from("game-covers")
      .upload(path, coverFile, { upsert: true, contentType: coverFile.type || "image/webp" });
    if (!uploadError) {
      const { data: publicUrl } = supabase.storage.from("game-covers").getPublicUrl(path);
      updates.cover_url = `${publicUrl.publicUrl}?v=${Date.now()}`;
      updates.cover_source = "manual";
    }
  }

  await supabase.from("games").update(updates).eq("id", id);

  // Update genres association
  const genreIds = formData.getAll("genre_ids") as string[];
  await supabase.from("game_genres").delete().eq("game_id", id);
  if (genreIds.length > 0) {
    const ggRows = genreIds.map((genreId) => ({
      game_id: id,
      genre_id: genreId,
    }));
    await supabase.from("game_genres").insert(ggRows);
  }

  revalidatePath("/admin/games");
  revalidatePath(`/admin/games/${id}`);
  revalidatePath("/");
  redirect("/admin/games");
}

// Re-discovers a fresh, uncropped candidate cover for a game by name --
// same sources the cover ETL pipeline uses (scripts/fetch_covers.py), just
// called live from the admin UI instead of the offline batch script.
export async function findOriginalCover(gameId: string): Promise<{ url: string } | { error: string }> {
  const supabase = await createClient();
  const { data: game } = await supabase.from("games").select("name").eq("id", gameId).single();
  if (!game) return { error: "Game tidak ditemukan." };

  const sgdbKey = process.env.STEAMGRIDDB_API_KEY;
  if (sgdbKey) {
    try {
      const searchRes = await fetch(
        `https://www.steamgriddb.com/api/v2/search/autocomplete/${encodeURIComponent(game.name)}`,
        { headers: { Authorization: `Bearer ${sgdbKey}` } }
      );
      const searchData = await searchRes.json();
      if (searchData?.success && searchData.data?.length) {
        const gridRes = await fetch(
          `https://www.steamgriddb.com/api/v2/grids/game/${searchData.data[0].id}?types=static`,
          { headers: { Authorization: `Bearer ${sgdbKey}` } }
        );
        const gridData = await gridRes.json();
        if (gridData?.success && gridData.data?.length) {
          const best = gridData.data.reduce((a: { score: number }, b: { score: number }) =>
            (b.score ?? 0) > (a.score ?? 0) ? b : a
          );
          return { url: best.url };
        }
      }
    } catch {
      // fall through to RAWG
    }
  }

  const rawgKey = process.env.RAWG_API_KEY;
  if (rawgKey) {
    try {
      const res = await fetch(
        `https://api.rawg.io/api/games?key=${rawgKey}&search=${encodeURIComponent(game.name)}&page_size=1`
      );
      const data = await res.json();
      const bg = data?.results?.[0]?.background_image;
      if (bg) return { url: bg };
    } catch {
      // fall through to error below
    }
  }

  return { error: "Gambar asli gak ketemu di SteamGridDB atau RAWG." };
}

export async function saveCroppedCover(gameId: string, formData: FormData) {
  const supabase = await createClient();
  const croppedFile = formData.get("cropped_file");
  if (!(croppedFile instanceof File) || croppedFile.size === 0) {
    throw new Error("Gak ada file hasil crop.");
  }

  const { data: game } = await supabase.from("games").select("slug").eq("id", gameId).single();
  if (!game) throw new Error("Game tidak ditemukan.");

  const path = `${game.slug}.webp`;
  const { error: uploadError } = await supabase.storage
    .from("game-covers")
    .upload(path, croppedFile, { upsert: true, contentType: "image/webp" });
  if (uploadError) throw new Error(uploadError.message);

  const { data: publicUrl } = supabase.storage.from("game-covers").getPublicUrl(path);
  await supabase
    .from("games")
    .update({ cover_url: `${publicUrl.publicUrl}?v=${Date.now()}`, cover_source: "manual" })
    .eq("id", gameId);

  revalidatePath("/admin/games");
  revalidatePath(`/admin/games/${gameId}`);
  revalidatePath("/");
}

export async function createGame(formData: FormData) {
  const supabase = await createClient();

  const name = String(formData.get("name") ?? "").trim();
  const slug = name
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const { data: created, error } = await supabase
    .from("games")
    .insert({
      name,
      slug,
      description: String(formData.get("description") ?? "").trim() || null,
      size_label: String(formData.get("size_label") ?? "").trim() || null,
      price: Number(formData.get("price")) || 20000,
      original_price: Number(formData.get("original_price")) || 350000,
      category_id: String(formData.get("category_id") ?? "") || null,
      status: String(formData.get("status") ?? "draft") as GameStatus,
      cover_source: "placeholder",
    })
    .select("id")
    .single();

  if (error || !created) {
    throw new Error(error?.message ?? "Gagal membuat game");
  }

  revalidatePath("/admin/games");
  redirect(`/admin/games/${created.id}`);
}
