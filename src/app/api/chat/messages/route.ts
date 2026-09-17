import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { listChatMessagesQuerySchema, sendChatMessageSchema } from "@/lib/validations/chat";
import { createUserChatMessage, listChatMessages } from "@/lib/services/chat";
import { startReceiptScan } from "@/lib/services/scan";
import { QuotaExceededError } from "@/lib/services/receipt";
import { UnreadableImageError } from "@/lib/services/image";
import { StorageNotConfiguredError } from "@/lib/storage";
import { enqueueChatMessage } from "@/lib/jobs/chat-message";
import { toChatMessageDTO } from "@/lib/dto/chat";

export const runtime = "nodejs";

const CHAT_RATE_LIMIT = { max: 20, windowSeconds: 60 };

function unauthorized() {
  return NextResponse.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, { status: 401 });
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const parsed = listChatMessagesQuerySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) {
    return NextResponse.json(
      { error: { message: "Parameter tidak valid", code: "VALIDATION_FAILED", issues: z.flattenError(parsed.error) } },
      { status: 400 },
    );
  }

  const { messages, nextCursor } = await listChatMessages(session.user.id, parsed.data);
  return NextResponse.json({ data: { messages: messages.map(toChatMessageDTO), nextCursor } });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const limit = rateLimit(`chat:${session.user.id}`, CHAT_RATE_LIMIT.max, CHAT_RATE_LIMIT.windowSeconds);
  if (!limit.ok) {
    return NextResponse.json(
      { error: { message: "Terlalu banyak pesan — tunggu sebentar", code: "RATE_LIMITED" } },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  const formData = await req.formData();
  const parsed = sendChatMessageSchema.safeParse({
    text: formData.get("text") ?? undefined,
    image: formData.get("image") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: { message: "Pesan tidak valid", code: "VALIDATION_FAILED", issues: z.flattenError(parsed.error) } },
      { status: 400 },
    );
  }

  try {
    const receipt = parsed.data.image
      ? await startReceiptScan(session.user.id, Buffer.from(await parsed.data.image.arrayBuffer()))
      : null;

    const message = await createUserChatMessage({
      userId: session.user.id,
      channel: "WEB",
      content: parsed.data.text ?? "",
      receiptId: receipt?.id ?? null,
    });
    enqueueChatMessage({ messageId: message.id });

    // 202: balasan asisten (dan OCR foto) dibuat di background; client polling GET.
    return NextResponse.json({ data: toChatMessageDTO(message) }, { status: 202 });
  } catch (err) {
    if (err instanceof QuotaExceededError) {
      return NextResponse.json({ error: { message: err.message, code: "QUOTA_EXCEEDED" } }, { status: 402 });
    }
    if (err instanceof UnreadableImageError) {
      return NextResponse.json({ error: { message: err.message, code: "UNREADABLE_IMAGE" } }, { status: 422 });
    }
    if (err instanceof StorageNotConfiguredError) {
      return NextResponse.json({ error: { message: err.message, code: "STORAGE_NOT_CONFIGURED" } }, { status: 503 });
    }
    throw err;
  }
}
