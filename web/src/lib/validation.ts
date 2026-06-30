import { z } from "zod";

export const checkoutSchema = z.object({
  playerId: z.string().trim().min(3, "Player ID minimal 3 karakter"),
  guestName: z.string().trim().min(2, "Nama minimal 2 karakter"),
  guestWhatsapp: z
    .string()
    .trim()
    .regex(/^(\+?62|0)8[0-9]{8,12}$/, "Nomor WhatsApp tidak valid"),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
