import type { ChatMessage, Receipt } from "@prisma/client";
import type { ChatPayload } from "@/lib/services/chat";

type ChatMessageWithReceipt = ChatMessage & {
  receipt: (Receipt & { _count?: { items: number } }) | null;
};

export type ChatMessageDTO = ReturnType<typeof toChatMessageDTO>;

function payloadOf(payload: ChatMessage["payload"]): ChatPayload | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null;
  return (payload as Record<string, unknown>).type === "report" ? (payload as unknown as ChatPayload) : null;
}

// externalId, processedAt, dan imageKey tidak dikirim ke client.
export function toChatMessageDTO(message: ChatMessageWithReceipt) {
  return {
    id: message.id,
    role: message.role,
    channel: message.channel,
    content: message.content,
    payload: payloadOf(message.payload),
    receipt: message.receipt
      ? {
          id: message.receipt.id,
          storeName: message.receipt.storeName,
          date: message.receipt.date ?? message.receipt.createdAt,
          total: message.receipt.total !== null ? Number(message.receipt.total) : null,
          status: message.receipt.status,
          itemCount: message.receipt._count?.items ?? null,
          imageUrl: `/api/receipts/${message.receipt.id}/image`,
        }
      : null,
    createdAt: message.createdAt,
  };
}
