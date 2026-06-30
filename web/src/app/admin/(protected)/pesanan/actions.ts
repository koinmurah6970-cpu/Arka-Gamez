"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { OrderStatus } from "@/lib/supabase/types";

export async function updateOrderStatus(id: string, formData: FormData) {
  const status = String(formData.get("status")) as OrderStatus;
  const supabase = await createClient();
  await supabase.from("orders").update({ status }).eq("id", id);
  revalidatePath("/admin/pesanan");
  revalidatePath(`/admin/pesanan/${id}`);
  revalidatePath("/admin");
}
