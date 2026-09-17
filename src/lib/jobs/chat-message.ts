import { after } from "next/server";
import { prisma } from "@/lib/prisma";
import { runReceiptOcrJob } from "@/lib/jobs/receipt-ocr";
import {
  buildReceiptScanReply,
  claimChatMessage,
  deliverChatReply,
  handleChatText,
  type ChatReply,
} from "@/lib/services/chat";

export type ChatMessagePayload = { messageId: string };

const FALLBACK_REPLY: ChatReply = { content: "Maaf, pesanmu gagal diproses. Coba kirim ulang sebentar lagi." };

export async function runChatMessageJob({ messageId }: ChatMessagePayload) {
  if (!(await claimChatMessage(messageId))) return;

  const message = await prisma.chatMessage.findUniqueOrThrow({ where: { id: messageId } });
  const replies: ChatReply[] = [];

  try {
    // Foto diproses dulu supaya caption seperti "belum lunas" merujuk struk yang baru ini.
    if (message.receiptId) {
      await runReceiptOcrJob({ receiptId: message.receiptId });
      replies.push(await buildReceiptScanReply(message.receiptId));
    }
    if (message.content.trim()) {
      replies.push(await handleChatText(message.userId, message.content));
    }
  } catch (err) {
    console.error("Chat message job failed:", err);
    replies.push(FALLBACK_REPLY);
  }

  for (const reply of replies) {
    await deliverChatReply(message, reply);
  }
}

/** Seam job queue yang sama dengan enqueueReceiptOcr — ganti ke Trigger.dev tanpa mengubah pemanggil. */
export function enqueueChatMessage(payload: ChatMessagePayload) {
  after(() => runChatMessageJob(payload));
}
