"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sendWhatsApp } from "@/lib/fonnte";
import { sendOrderStatusEmail } from "@/lib/email";
import { STORE_NAME } from "@/lib/constants";
import type { OrderStatus } from "@/lib/supabase/types";

const WA_MESSAGES: Partial<Record<OrderStatus, (name: string, orderNum: string) => string>> = {
  confirmed: (name, orderNum) =>
    `Halo *${name}*! 👋\n\nPesanan kamu di *${STORE_NAME}* dengan nomor *${orderNum}* sudah kami *konfirmasi* ✅\n\nTim kami sedang menyiapkan game kamu. Mohon tunggu ya!`,
  processing: (name, orderNum) =>
    `Halo *${name}*! 🎮\n\nPesanan *${orderNum}* sedang *diproses* oleh tim ${STORE_NAME}.\n\nGame kamu akan segera siap. Terima kasih sudah sabar!`,
  completed: (name, orderNum) =>
    `Halo *${name}*! 🎉\n\nPesanan *${orderNum}* sudah *selesai*! Game kamu sudah siap.\n\nTerima kasih sudah belanja di *${STORE_NAME}*. Selamat main! 🕹️`,
  cancelled: (name, orderNum) =>
    `Halo *${name}*, pesanan *${orderNum}* di *${STORE_NAME}* telah *dibatalkan*. Hubungi admin jika ada pertanyaan.`,
};

export async function updateOrderStatus(id: string, formData: FormData) {
  const status = String(formData.get("status")) as OrderStatus;
  const supabase = await createClient();

  const { data: order } = await supabase
    .from("orders")
    .select("order_number, guest_name, guest_whatsapp, player_id, status")
    .eq("id", id)
    .single();

  await supabase.from("orders").update({ status }).eq("id", id);

  revalidatePath("/admin/pesanan");
  revalidatePath(`/admin/pesanan/${id}`);
  revalidatePath("/admin");

  if (order && order.status !== status) {
    const name = order.guest_name || "kak";
    const buildMsg = WA_MESSAGES[status];

    await Promise.all([
      order.guest_whatsapp && buildMsg
        ? sendWhatsApp(order.guest_whatsapp, buildMsg(name, order.order_number))
        : Promise.resolve(),
      order.player_id
        ? sendOrderStatusEmail(order.player_id, name, order.order_number, status)
        : Promise.resolve(),
    ]);
  }
}
