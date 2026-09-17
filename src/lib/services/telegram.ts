import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";

export class TelegramNotConfiguredError extends Error {
  constructor() {
    super("Bot Telegram belum dikonfigurasi");
    this.name = "TelegramNotConfiguredError";
  }
}

export class TelegramApiError extends Error {
  constructor(method: string, description: string) {
    super(`Telegram ${method} gagal: ${description}`);
    this.name = "TelegramApiError";
  }
}

const LINK_TOKEN_TTL_MS = 15 * 60 * 1000;
// Batas teks sendMessage Telegram.
const MAX_MESSAGE_LENGTH = 4096;
// Batas getFile Bot API.
export const MAX_TELEGRAM_FILE_BYTES = 20 * 1024 * 1024;

const linkIdentifier = (userId: string) => `telegram-link:${userId}`;
const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export function isTelegramConfigured() {
  return Boolean(env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_WEBHOOK_SECRET);
}

function botToken() {
  if (!env.TELEGRAM_BOT_TOKEN) throw new TelegramNotConfiguredError();
  return env.TELEGRAM_BOT_TOKEN;
}

export function verifyTelegramSecret(header: string | null) {
  if (!env.TELEGRAM_WEBHOOK_SECRET || !header) return false;
  const expected = Buffer.from(env.TELEGRAM_WEBHOOK_SECRET);
  const received = Buffer.from(header);
  return expected.length === received.length && timingSafeEqual(expected, received);
}

async function callTelegram<T>(method: string, body: Record<string, unknown>): Promise<T> {
  const response = await fetch(`https://api.telegram.org/bot${botToken()}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = (await response.json()) as { ok: boolean; result?: T; description?: string };
  if (!payload.ok || payload.result === undefined) {
    throw new TelegramApiError(method, payload.description ?? `HTTP ${response.status}`);
  }
  return payload.result;
}

export function splitTelegramText(text: string, limit = MAX_MESSAGE_LENGTH) {
  const chunks: string[] = [];
  let rest = text;
  while (rest.length > limit) {
    const cut = rest.lastIndexOf("\n", limit);
    const index = cut > 0 ? cut : limit;
    chunks.push(rest.slice(0, index));
    rest = rest.slice(index).replace(/^\n/, "");
  }
  chunks.push(rest);
  return chunks;
}

/** Teks polos tanpa parse_mode — konten dari OCR/user tidak perlu di-escape untuk Markdown/HTML. */
export async function sendTelegramMessage(chatId: string, text: string) {
  for (const chunk of splitTelegramText(text)) {
    await callTelegram("sendMessage", { chat_id: chatId, text: chunk, link_preview_options: { is_disabled: true } });
  }
}

export async function downloadTelegramFile(fileId: string) {
  const file = await callTelegram<{ file_path?: string; file_size?: number }>("getFile", { file_id: fileId });
  if (!file.file_path) throw new TelegramApiError("getFile", "file_path kosong");

  const response = await fetch(`https://api.telegram.org/file/bot${botToken()}/${file.file_path}`);
  if (!response.ok) throw new TelegramApiError("downloadFile", `HTTP ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}

export function buildTelegramDeepLink(token: string) {
  if (!env.TELEGRAM_BOT_USERNAME) throw new TelegramNotConfiguredError();
  return `https://t.me/${env.TELEGRAM_BOT_USERNAME}?start=${token}`;
}

/** Token sekali pakai; yang disimpan hanya hash-nya, dan token lama user dibatalkan. */
export async function createTelegramLinkToken(userId: string) {
  const token = randomBytes(24).toString("base64url");
  await prisma.$transaction([
    prisma.verificationToken.deleteMany({ where: { identifier: linkIdentifier(userId) } }),
    prisma.verificationToken.create({
      data: { identifier: linkIdentifier(userId), token: hashToken(token), expires: new Date(Date.now() + LINK_TOKEN_TTL_MS) },
    }),
  ]);
  return token;
}

/** Return userId yang berhasil ditautkan, atau null kalau token tidak valid/kedaluwarsa. */
export async function linkTelegramChat(token: string, chatId: string) {
  return prisma.$transaction(async (tx) => {
    const record = await tx.verificationToken.findUnique({ where: { token: hashToken(token) } });
    if (!record || !record.identifier.startsWith("telegram-link:")) return null;

    await tx.verificationToken.delete({ where: { token: record.token } });
    if (record.expires < new Date()) return null;

    const userId = record.identifier.slice("telegram-link:".length);
    // Satu chat Telegram hanya boleh terhubung ke satu akun.
    await tx.user.updateMany({ where: { telegramChatId: chatId, NOT: { id: userId } }, data: { telegramChatId: null } });
    await tx.user.update({ where: { id: userId }, data: { telegramChatId: chatId } });
    return userId;
  });
}

export async function unlinkTelegramChat(userId: string) {
  await prisma.user.update({ where: { id: userId }, data: { telegramChatId: null } });
}

export async function findUserIdByTelegramChat(chatId: string) {
  const user = await prisma.user.findUnique({ where: { telegramChatId: chatId }, select: { id: true } });
  return user?.id ?? null;
}

export async function getTelegramChatIdForUser(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { telegramChatId: true } });
  return user?.telegramChatId ?? null;
}
