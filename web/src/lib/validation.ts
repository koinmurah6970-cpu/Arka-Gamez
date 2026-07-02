import { z } from "zod";

export const checkoutSchema = z.object({
  guestName: z.string().trim().min(2, "Nama minimal 2 karakter"),
  guestWhatsapp: z
    .string()
    .trim()
    .regex(/^(\+?62|0)8[0-9]{8,12}$/, "Nomor WhatsApp tidak valid"),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

export const gameRequestSchema = z.object({
  gameName: z.string().trim().min(2, "Nama game minimal 2 karakter"),
  platform: z.string().optional(),
  notes: z.string().trim().max(500, "Catatan maksimal 500 karakter").optional(),
  requesterName: z.string().trim().min(2, "Nama minimal 2 karakter"),
  requesterWa: z
    .string()
    .trim()
    .regex(/^(\+?62|0)8[0-9]{8,12}$/, "Nomor WhatsApp tidak valid"),
});

export type GameRequestInput = z.infer<typeof gameRequestSchema>;
