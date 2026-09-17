import { rateLimit } from "@/lib/rate-limit";
import { UnreadableImageError } from "@/lib/services/image";
import { QuotaExceededError } from "@/lib/services/receipt";
import { startReceiptScan } from "@/lib/services/scan";
import {
  DuplicateChatMessageError,
  HELP_TEXT,
  attachReceiptToChatMessage,
  claimChatMessage,
  createUserChatMessage,
  deliverChatReply,
} from "@/lib/services/chat";
import {
  MAX_TELEGRAM_FILE_BYTES,
  downloadTelegramFile,
  findUserIdByTelegramChat,
  linkTelegramChat,
  sendTelegramMessage,
} from "@/lib/services/telegram";
import { StorageNotConfiguredError } from "@/lib/storage";
import { ACCEPTED_IMAGE_MIME } from "@/lib/validations/scan";
import type { TelegramUpdate } from "@/lib/validations/chat";

export type TelegramUpdateResult =
  | { status: "ignored" | "replied" | "duplicate" }
  | { status: "queued"; messageId: string };

const TELEGRAM_RATE_LIMIT = { max: 20, windowSeconds: 60 };
const START_PATTERN = /^\/start(?:\s+([A-Za-z0-9_-]{16,64}))?$/;

const NOT_LINKED_TEXT =
  "Akun Telegram ini belum terhubung ke StrukScan. Buka menu Chat di dashboard StrukScan, pilih \"Hubungkan Telegram\", lalu ikuti link-nya.";

type TelegramMessage = NonNullable<TelegramUpdate["message"]>;

function pickImageFileId(message: TelegramMessage) {
  // Array photo berisi beberapa resolusi, urut dari yang terkecil.
  const photo = message.photo?.at(-1);
  if (photo) return { fileId: photo.file_id, size: photo.file_size };

  const doc = message.document;
  if (doc?.mime_type && (ACCEPTED_IMAGE_MIME as readonly string[]).includes(doc.mime_type)) {
    return { fileId: doc.file_id, size: doc.file_size };
  }
  return null;
}

function scanErrorText(err: unknown) {
  if (err instanceof QuotaExceededError || err instanceof UnreadableImageError || err instanceof StorageNotConfiguredError) {
    return err.message;
  }
  return null;
}

async function handleStart(chatId: string, token: string | undefined) {
  if (!token) {
    const linked = await findUserIdByTelegramChat(chatId);
    await sendTelegramMessage(chatId, linked ? HELP_TEXT : NOT_LINKED_TEXT);
    return;
  }

  const userId = await linkTelegramChat(token, chatId);
  await sendTelegramMessage(
    chatId,
    userId
      ? `Akun StrukScan terhubung. Kirim foto struk atau ketik perintah.\n\n${HELP_TEXT}`
      : "Link sudah kedaluwarsa atau pernah dipakai. Buat link baru dari menu Chat di StrukScan.",
  );
}

export async function handleTelegramUpdate(update: TelegramUpdate): Promise<TelegramUpdateResult> {
  const message = update.message;
  // Grup/channel diabaikan supaya data keuangan tidak terbaca anggota lain.
  if (!message || message.chat.type !== "private") return { status: "ignored" };

  const chatId = String(message.chat.id);
  if (!rateLimit(`telegram:${chatId}`, TELEGRAM_RATE_LIMIT.max, TELEGRAM_RATE_LIMIT.windowSeconds).ok) {
    return { status: "ignored" };
  }

  const text = (message.text ?? message.caption ?? "").trim();
  const start = START_PATTERN.exec(text);
  if (start) {
    await handleStart(chatId, start[1]);
    return { status: "replied" };
  }

  const userId = await findUserIdByTelegramChat(chatId);
  if (!userId) {
    await sendTelegramMessage(chatId, NOT_LINKED_TEXT);
    return { status: "replied" };
  }

  const image = pickImageFileId(message);
  if (!image && !text) {
    await sendTelegramMessage(chatId, "Kirim foto struk (JPG/PNG) atau ketik perintah. Ketik \"bantuan\" untuk contoh.");
    return { status: "replied" };
  }

  let chatMessage;
  try {
    chatMessage = await createUserChatMessage({
      userId,
      channel: "TELEGRAM",
      content: text,
      externalId: String(update.update_id),
    });
  } catch (err) {
    if (err instanceof DuplicateChatMessageError) return { status: "duplicate" };
    throw err;
  }

  if (image) {
    try {
      if (image.size !== undefined && image.size > MAX_TELEGRAM_FILE_BYTES) {
        throw new UnreadableImageError();
      }
      const receipt = await startReceiptScan(userId, await downloadTelegramFile(image.fileId));
      await attachReceiptToChatMessage(chatMessage.id, receipt.id);
    } catch (err) {
      const reason = scanErrorText(err);
      if (!reason) throw err;
      // Pesan ditandai selesai supaya job tidak membalas caption untuk foto yang ditolak.
      await claimChatMessage(chatMessage.id);
      await deliverChatReply({ userId, channel: "TELEGRAM" }, { content: reason });
      return { status: "replied" };
    }
  }

  return { status: "queued", messageId: chatMessage.id };
}
