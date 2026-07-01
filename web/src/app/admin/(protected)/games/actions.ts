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
  revalidatePath("/admin/games");
  revalidatePath(`/admin/games/${id}`);
  revalidatePath("/");
  redirect("/admin/games");
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
