import Image from "next/image";
import Link from "next/link";
import { Send } from "lucide-react";
import { cn } from "cn";
import { ChatReportCard } from "@/components/chat-report-card";
import { StatusPill } from "@/components/status-pill";
import { formatDate, formatIDR } from "@/lib/format";
import type { ChatMessageDTO } from "@/lib/dto/chat";

const timeFormatter = new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit" });

function ReceiptAttachment({ receipt }: { receipt: NonNullable<ChatMessageDTO["receipt"]> }) {
  const storeName = receipt.storeName ?? "struk";

  return (
    <Link
      href={`/receipts/${receipt.id}`}
      className="flex items-center gap-3 rounded-xl bg-background/70 p-2 text-foreground ring-1 ring-foreground/10 hover:bg-background focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <Image
        src={receipt.imageUrl}
        alt={`Struk dari ${storeName}, ${formatDate(receipt.date)}`}
        width={56}
        height={56}
        unoptimized
        className="size-14 shrink-0 rounded-lg object-cover"
      />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold">{receipt.storeName ?? "Toko belum terbaca"}</span>
        <span className="block font-mono text-xs tabular-nums text-muted-foreground">
          {receipt.total !== null ? formatIDR(receipt.total) : "Total belum terbaca"}
        </span>
      </span>
      <StatusPill status={receipt.status} />
    </Link>
  );
}

export function ChatMessageBubble({ message }: { message: ChatMessageDTO }) {
  const isUser = message.role === "USER";

  return (
    <li className={cn("flex flex-col gap-1", isUser ? "items-end" : "items-start")}>
      <div
        className={cn(
          "flex max-w-[85%] flex-col gap-2 rounded-2xl px-3.5 py-2.5 text-sm md:max-w-[70%]",
          isUser ? "rounded-br-md bg-primary text-primary-foreground" : "rounded-bl-md bg-card text-card-foreground ring-1 ring-foreground/10",
        )}
      >
        {isUser && message.receipt && <ReceiptAttachment receipt={message.receipt} />}
        {message.payload?.type === "report" ? (
          <ChatReportCard report={message.payload.report} />
        ) : (
          message.content && <p className="break-words whitespace-pre-wrap">{message.content}</p>
        )}
        {!isUser && message.receipt && !message.payload && <ReceiptAttachment receipt={message.receipt} />}
      </div>
      <span className="flex items-center gap-1 px-1 text-[0.7rem] text-muted-foreground">
        {message.channel === "TELEGRAM" && (
          <>
            <Send className="size-3" aria-hidden />
            <span>Telegram ·</span>
          </>
        )}
        <time dateTime={new Date(message.createdAt).toISOString()}>{timeFormatter.format(new Date(message.createdAt))}</time>
      </span>
    </li>
  );
}
