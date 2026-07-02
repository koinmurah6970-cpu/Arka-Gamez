"use server";

import { sendOrderConfirmation } from "@/lib/email";

export async function sendConfirmationEmail(
  to: string,
  name: string,
  orderNumber: string,
  items: { name: string; price: number }[],
  total: number
) {
  await sendOrderConfirmation(to, name, orderNumber, items, total);
}
