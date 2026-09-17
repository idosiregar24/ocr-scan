"use client";

import { useState, useTransition } from "react";
import { ExternalLink, Send, Unlink } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createTelegramLinkAction, unlinkTelegramAction } from "@/app/(dashboard)/chat/actions";

type Props = { isConfigured: boolean; isLinked: boolean };

export function TelegramLinkCard({ isConfigured, isLinked }: Props) {
  const [isPending, startTransition] = useTransition();
  const [linkUrl, setLinkUrl] = useState<string | null>(null);

  if (!isConfigured) return null;

  const connect = () =>
    startTransition(async () => {
      const result = await createTelegramLinkAction();
      if (result.status === "error") toast.error(result.message);
      else setLinkUrl(result.url ?? null);
    });

  const disconnect = () =>
    startTransition(async () => {
      const result = await unlinkTelegramAction();
      if (result.status === "error") {
        toast.error(result.message);
        return;
      }
      setLinkUrl(null);
      toast.success("Telegram diputuskan");
    });

  return (
    <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-card p-4 ring-1 ring-foreground/10">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Send className="size-5" aria-hidden />
        </span>
        <div>
          <p className="text-sm font-bold text-foreground">Bot Telegram</p>
          <p className="text-xs text-muted-foreground">
            {isLinked
              ? "Terhubung — chat dari Telegram ikut muncul di sini."
              : linkUrl
                ? "Buka link, lalu tekan Start di Telegram. Berlaku 15 menit."
                : "Kirim struk & perintah langsung dari Telegram."}
          </p>
        </div>
      </div>

      {isLinked ? (
        <Button type="button" variant="ghost" size="sm" onClick={disconnect} disabled={isPending}>
          <Unlink data-icon="inline-start" aria-hidden />
          Putuskan
        </Button>
      ) : linkUrl ? (
        <Button asChild size="sm">
          <a href={linkUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink data-icon="inline-start" aria-hidden />
            Buka Telegram
          </a>
        </Button>
      ) : (
        <Button type="button" size="sm" onClick={connect} disabled={isPending}>
          <Send data-icon="inline-start" aria-hidden />
          Hubungkan Telegram
        </Button>
      )}
    </section>
  );
}
