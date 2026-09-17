import { z } from "zod";
import { ACCEPTED_IMAGE_MIME, MAX_RECEIPT_IMAGE_BYTES } from "@/lib/validations/scan";

export const MAX_CHAT_TEXT_LENGTH = 1000;

export const sendChatMessageSchema = z
  .object({
    text: z.preprocess(
      (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
      z.string().trim().max(MAX_CHAT_TEXT_LENGTH, "Pesan maksimal 1000 karakter").optional(),
    ),
    image: z
      .file()
      .max(MAX_RECEIPT_IMAGE_BYTES, "Ukuran foto maksimal 10 MB")
      .mime([...ACCEPTED_IMAGE_MIME], "Format harus JPG, PNG, WEBP, atau HEIC")
      .optional(),
  })
  .refine((input) => input.text !== undefined || input.image !== undefined, {
    message: "Tulis pesan atau lampirkan foto struk",
    path: ["text"],
  });

export const listChatMessagesQuerySchema = z.object({
  before: z.preprocess((value) => (value === "" || value === null ? undefined : value), z.string().cuid().optional()),
  take: z.coerce.number().int().min(1).max(100).default(50),
});

export const CHAT_INTENTS = [
  "mark_unpaid",
  "mark_paid",
  "create_bill",
  "list_bills",
  "report",
  "help",
  "unknown",
] as const;

/** Output parser intent (Gemini maupun fallback aturan) — flat supaya sama dengan response schema Gemini. */
export const chatIntentSchema = z.object({
  intent: z.enum(CHAT_INTENTS),
  billNo: z.string().trim().min(1).max(100).nullable(),
  vendor: z.string().trim().min(1).max(200).nullable(),
  amount: z.number().positive().nullable(),
  year: z.number().int().min(2000).max(2100).nullable(),
  month: z.number().int().min(1).max(12).nullable(),
});

const telegramChatSchema = z.object({
  id: z.number(),
  type: z.string(),
});

/** Subset Update Telegram yang dipakai — field lain diabaikan, bukan ditolak. */
export const telegramUpdateSchema = z.object({
  update_id: z.number().int(),
  message: z
    .object({
      message_id: z.number().int(),
      chat: telegramChatSchema,
      text: z.string().max(4096).optional(),
      caption: z.string().max(1024).optional(),
      photo: z
        .array(z.object({ file_id: z.string(), file_size: z.number().optional(), width: z.number(), height: z.number() }))
        .optional(),
      document: z
        .object({ file_id: z.string(), mime_type: z.string().optional(), file_size: z.number().optional() })
        .optional(),
    })
    .optional(),
});

export type SendChatMessageInput = z.infer<typeof sendChatMessageSchema>;
export type ListChatMessagesQuery = z.infer<typeof listChatMessagesQuerySchema>;
export type ChatIntent = z.infer<typeof chatIntentSchema>;
export type TelegramUpdate = z.infer<typeof telegramUpdateSchema>;
