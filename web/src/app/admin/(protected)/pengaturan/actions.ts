"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateStoreSettings(formData: FormData) {
  const supabase = await createClient();
  await supabase
    .from("store_settings")
    .update({
      wa_admin_number: String(formData.get("wa_admin_number") ?? "").trim(),
      default_price: Number(formData.get("default_price")) || 0,
      default_original_price: Number(formData.get("default_original_price")) || 0,
      banner_text: String(formData.get("banner_text") ?? "").trim() || null,
    })
    .eq("id", 1);

  revalidatePath("/admin/pengaturan");
  revalidatePath("/");
}
