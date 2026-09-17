"use client";

import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bot, ImagePlus, Loader2, SendHorizontal, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChatMessageBubble } from "@/components/chat-message-bubble";
import { ACCEPTED_IMAGE_MIME } from "@/lib/validations/scan";
import { sendChatMessageSchema, type SendChatMessageInput } from "@/lib/validations/chat";
import type { ChatMessageDTO } from "@/lib/dto/chat";

type ApiError = { error: { message: string } };
type MessagesPage = { messages: ChatMessageDTO[]; nextCursor: string | null };

const QUERY_KEY = ["chat-messages"] as const;
// Balasan tidak ditunggu tanpa batas kalau job gagal diam-diam.
const WAIT_FOR_REPLY_MS = 2 * 60 * 1000;
const SUGGESTIONS = ["tagihan apa aja yang belum lunas?", "laporan akhir tahun", "bantuan"];

async function fetchMessages(): Promise<MessagesPage> {
  const response = await fetch("/api/chat/messages");
  const payload = await response.json();
  if (!response.ok) throw new Error((payload as ApiError).error?.message ?? "Chat tidak termuat");
  return (payload as { data: MessagesPage }).data;
}

async function postMessage(input: SendChatMessageInput) {
  const body = new FormData();
  if (input.text) body.append("text", input.text);
  if (input.image) body.append("image", input.image);

  const response = await fetch("/api/chat/messages", { method: "POST", body });
  const payload = await response.json();
  if (!response.ok) throw new Error((payload as ApiError).error?.message ?? "Pesan gagal terkirim");
  return (payload as { data: ChatMessageDTO }).data;
}

function isAwaitingReply(messages: ChatMessageDTO[]) {
  const last = messages.at(-1);
  return Boolean(last && last.role === "USER" && Date.now() - new Date(last.createdAt).getTime() < WAIT_FOR_REPLY_MS);
}

export function ChatPanel({ initialPage }: { initialPage: MessagesPage }) {
  const queryClient = useQueryClient();
  const endRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const messagesQuery = useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchMessages,
    initialData: initialPage,
    // Cepat saat menunggu balasan; lambat saat idle untuk menangkap pesan dari Telegram.
    refetchInterval: (query) => (isAwaitingReply(query.state.data?.messages ?? []) ? 1000 : 5000),
  });

  const form = useForm<SendChatMessageInput>({
    resolver: zodResolver(sendChatMessageSchema) as never,
    defaultValues: { text: "", image: undefined },
  });
  const image = form.watch("image");

  const send = useMutation({
    mutationFn: postMessage,
    onSuccess: () => {
      form.reset({ text: "", image: undefined });
      if (fileRef.current) fileRef.current.value = "";
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const messages = messagesQuery.data.messages;
  const awaitingReply = isAwaitingReply(messages);
  const lastReceiptProcessing = messages.at(-1)?.receipt?.status === "PENDING" || messages.at(-1)?.receipt?.status === "PROCESSING";

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, awaitingReply]);

  const onSubmit = form.handleSubmit((values) => send.mutate(values));
  const textError = form.formState.errors.text?.message;
  const imageError = form.formState.errors.image?.message;

  return (
    <div className="flex flex-col gap-4">
      {messages.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed bg-card px-6 py-12 text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-secondary text-muted-foreground">
            <Bot className="size-6" aria-hidden />
          </span>
          <div className="space-y-1">
            <p className="font-bold text-foreground">Belum ada percakapan</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Kirim foto struk untuk dicatat, tandai tagihan lunas, atau minta laporan pengeluaran.
            </p>
          </div>
        </div>
      ) : (
        <ol className="flex flex-col gap-3" aria-label="Riwayat chat" aria-live="polite">
          {messages.map((message) => (
            <ChatMessageBubble key={message.id} message={message} />
          ))}
        </ol>
      )}

      {awaitingReply && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          {lastReceiptProcessing ? "Memproses struk… biasanya 3–8 detik" : "Asisten sedang membalas…"}
        </p>
      )}
      <div ref={endRef} />

      <form
        onSubmit={onSubmit}
        className="sticky bottom-[calc(4.75rem+env(safe-area-inset-bottom))] flex flex-col gap-2 rounded-2xl bg-card p-2.5 ring-1 ring-foreground/10 md:bottom-4"
      >
        <div className="flex flex-wrap gap-1.5">
          {SUGGESTIONS.map((suggestion) => (
            <Button
              key={suggestion}
              type="button"
              variant="secondary"
              size="xs"
              disabled={send.isPending}
              onClick={() => send.mutate({ text: suggestion })}
            >
              {suggestion}
            </Button>
          ))}
        </div>

        {image && (
          <div className="flex items-center gap-2 self-start rounded-lg bg-secondary px-2.5 py-1 text-xs text-secondary-foreground">
            <ImagePlus className="size-3.5" aria-hidden />
            <span className="max-w-48 truncate">{image.name}</span>
            <button
              type="button"
              className="rounded p-0.5 hover:bg-background"
              aria-label="Hapus lampiran foto"
              onClick={() => {
                form.setValue("image", undefined);
                if (fileRef.current) fileRef.current.value = "";
              }}
            >
              <X className="size-3.5" aria-hidden />
            </button>
          </div>
        )}

        <div className="flex items-center gap-2">
          <input
            ref={fileRef}
            id="chat-image"
            type="file"
            accept={ACCEPTED_IMAGE_MIME.join(",")}
            className="sr-only"
            onChange={(event) => form.setValue("image", event.target.files?.[0], { shouldValidate: true })}
          />
          <Button type="button" variant="ghost" size="icon-lg" asChild>
            <label htmlFor="chat-image" className="cursor-pointer">
              <ImagePlus aria-hidden />
              <span className="sr-only">Lampirkan foto struk</span>
            </label>
          </Button>

          <Label htmlFor="chat-text" className="sr-only">
            Pesan
          </Label>
          <Input
            id="chat-text"
            inputSize="lg"
            autoComplete="off"
            placeholder="mis. tagihan no 32 dah lunas"
            aria-invalid={Boolean(textError)}
            aria-describedby={textError || imageError ? "chat-error" : undefined}
            {...form.register("text")}
          />

          <Button type="submit" size="icon-lg" disabled={send.isPending}>
            {send.isPending ? <Loader2 className="animate-spin" aria-hidden /> : <SendHorizontal aria-hidden />}
            <span className="sr-only">Kirim</span>
          </Button>
        </div>

        {(textError || imageError) && (
          <p id="chat-error" className="px-1 text-xs text-destructive">
            {textError ?? imageError}
          </p>
        )}
      </form>
    </div>
  );
}
