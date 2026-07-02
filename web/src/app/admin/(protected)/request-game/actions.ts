"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { GameRequestStatus } from "@/lib/supabase/types";

export async function updateRequestStatus(id: string, formData: FormData) {
  const status = String(formData.get("status")) as GameRequestStatus;
  const adminNotes = String(formData.get("admin_notes") ?? "").trim() || null;

  const supabase = await createClient();
  await supabase
    .from("game_requests")
    .update({ status, admin_notes: adminNotes })
    .eq("id", id);

  revalidatePath("/admin/request-game");
}
