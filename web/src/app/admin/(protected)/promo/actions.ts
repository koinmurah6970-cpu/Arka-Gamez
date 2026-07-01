"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createPromoCard(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const sortOrder = Number(formData.get("sort_order")) || 0;
  if (!title) return;

  const supabase = await createClient();
  await supabase.from("promo_cards").insert({ title, description, sort_order: sortOrder });
  revalidatePath("/admin/promo");
  revalidatePath("/promo");
}

export async function updatePromoCard(id: string, formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const sortOrder = Number(formData.get("sort_order")) || 0;
  const isActive = formData.get("is_active") === "on";
  if (!title) return;

  const supabase = await createClient();
  await supabase
    .from("promo_cards")
    .update({ title, description, sort_order: sortOrder, is_active: isActive })
    .eq("id", id);
  revalidatePath("/admin/promo");
  revalidatePath("/promo");
}

export async function deletePromoCard(id: string) {
  const supabase = await createClient();
  await supabase.from("promo_cards").delete().eq("id", id);
  revalidatePath("/admin/promo");
  revalidatePath("/promo");
}
