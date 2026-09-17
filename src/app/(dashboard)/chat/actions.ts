"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import {
  TelegramNotConfiguredError,
  buildTelegramDeepLink,
  createTelegramLinkToken,
  isTelegramConfigured,
  unlinkTelegramChat,
} from "@/lib/services/telegram";

export type TelegramActionState =
  | { status: "success"; url?: string }
  | { status: "error"; message: string };

export async function createTelegramLinkAction(): Promise<TelegramActionState> {
  const session = await auth();
  if (!session?.user) return { status: "error", message: "Sesi berakhir — masuk lagi" };
  if (!isTelegramConfigured()) return { status: "error", message: "Bot Telegram belum dikonfigurasi" };

  try {
    const token = await createTelegramLinkToken(session.user.id);
    return { status: "success", url: buildTelegramDeepLink(token) };
  } catch (err) {
    if (err instanceof TelegramNotConfiguredError) return { status: "error", message: err.message };
    throw err;
  }
}

export async function unlinkTelegramAction(): Promise<TelegramActionState> {
  const session = await auth();
  if (!session?.user) return { status: "error", message: "Sesi berakhir — masuk lagi" };

  await unlinkTelegramChat(session.user.id);
  revalidatePath("/chat");
  return { status: "success" };
}
