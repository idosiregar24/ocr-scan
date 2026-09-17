import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { telegramUpdateSchema } from "@/lib/validations/chat";
import { isTelegramConfigured, verifyTelegramSecret } from "@/lib/services/telegram";
import { handleTelegramUpdate } from "@/lib/services/telegram-bot";
import { enqueueChatMessage } from "@/lib/jobs/chat-message";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!isTelegramConfigured()) {
    return NextResponse.json({ error: { message: "Not found", code: "NOT_FOUND" } }, { status: 404 });
  }

  // Header ini hanya diketahui Telegram (diset saat setWebhook) — pengganti verifikasi signature.
  if (!verifyTelegramSecret(req.headers.get("x-telegram-bot-api-secret-token"))) {
    return NextResponse.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, { status: 401 });
  }

  const parsed = telegramUpdateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: { message: "Update tidak valid", code: "VALIDATION_FAILED", issues: z.flattenError(parsed.error) } },
      { status: 400 },
    );
  }

  const result = await handleTelegramUpdate(parsed.data);
  if (result.status === "queued") enqueueChatMessage({ messageId: result.messageId });

  return NextResponse.json({ data: { status: result.status } });
}
