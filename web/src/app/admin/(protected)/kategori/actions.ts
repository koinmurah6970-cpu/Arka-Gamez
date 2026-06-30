"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createCategory(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const sortOrder = Number(formData.get("sort_order")) || 0;
  if (!name) return;

  const supabase = await createClient();
  await supabase.from("categories").insert({ name, sort_order: sortOrder });
  revalidatePath("/admin/kategori");
  revalidatePath("/");
}

export async function updateCategory(id: string, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const sortOrder = Number(formData.get("sort_order")) || 0;
  if (!name) return;

  const supabase = await createClient();
  await supabase.from("categories").update({ name, sort_order: sortOrder }).eq("id", id);
  revalidatePath("/admin/kategori");
  revalidatePath("/");
}

export async function deleteCategory(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("categories").delete().eq("id", id);
  revalidatePath("/admin/kategori");
  revalidatePath("/");
  if (error) redirect("/admin/kategori?error=in_use");
}
