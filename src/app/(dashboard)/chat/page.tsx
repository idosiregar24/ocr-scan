import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { listChatMessages } from "@/lib/services/chat";
import { isTelegramConfigured } from "@/lib/services/telegram";
import { toChatMessageDTO } from "@/lib/dto/chat";
import { ChatPanel } from "@/components/chat-panel";
import { TelegramLinkCard } from "@/components/telegram-link-card";

export default async function ChatPage() {
  const session = await auth();
  if (!session?.user) return null; // dijamin oleh (dashboard)/layout.tsx

  const [page, user] = await Promise.all([
    listChatMessages(session.user.id, { take: 50 }),
    prisma.user.findUniqueOrThrow({ where: { id: session.user.id }, select: { telegramChatId: true } }),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      <header className="space-y-1">
        <h1 className="text-2xl font-extrabold text-foreground md:text-3xl">Chat asisten</h1>
        <p className="text-sm text-muted-foreground">
          Kirim foto struk, tandai tagihan lunas atau belum, dan minta laporan pengeluaran.
        </p>
      </header>

      <TelegramLinkCard isConfigured={isTelegramConfigured()} isLinked={Boolean(user.telegramChatId)} />

      <ChatPanel initialPage={{ messages: page.messages.map(toChatMessageDTO), nextCursor: page.nextCursor }} />
    </div>
  );
}
