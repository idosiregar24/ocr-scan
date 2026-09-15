"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CircleAlert, RotateCcw, ScanLine, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ReceiptUploadDropzone } from "@/components/receipt-upload-dropzone";
import { OcrReviewForm } from "@/components/ocr-review-form";
import { StatusPill } from "@/components/status-pill";
import { ReceiptImagePreview } from "@/components/receipt-image-preview";
import { formatDate } from "@/lib/format";
import type { ReceiptDTO } from "@/lib/dto/receipt";

type ApiError = { error: { message: string; code?: string } };

async function uploadReceipt(file: File): Promise<ReceiptDTO> {
  const body = new FormData();
  body.append("image", file);

  const response = await fetch("/api/scan", { method: "POST", body });
  const payload = await response.json();
  if (!response.ok) throw new Error((payload as ApiError).error?.message ?? "Upload gagal");
  return (payload as { data: ReceiptDTO }).data;
}

async function fetchJob(receiptId: string): Promise<ReceiptDTO> {
  const response = await fetch(`/api/jobs/${receiptId}`);
  const payload = await response.json();
  if (!response.ok) throw new Error((payload as ApiError).error?.message ?? "Status tidak terbaca");
  return (payload as { data: ReceiptDTO }).data;
}

export function ScanFlow({ quotaRemaining }: { quotaRemaining: number | null }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [receiptId, setReceiptId] = useState<string | null>(null);

  const outOfQuota = quotaRemaining !== null && quotaRemaining <= 0;

  const upload = useMutation({
    mutationFn: uploadReceipt,
    onSuccess: (receipt) => setReceiptId(receipt.id),
    onError: (error: Error) => toast.error(error.message),
  });

  const job = useQuery({
    queryKey: ["receipt-job", receiptId],
    queryFn: () => fetchJob(receiptId as string),
    enabled: Boolean(receiptId),
    // Polling setiap 600ms agar UI langsung menampilkan hasil begitu OCR selesai
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "DONE" || status === "FAILED" ? false : 600;
    },
  });

  const reset = () => {
    setReceiptId(null);
    upload.reset();
    queryClient.removeQueries({ queryKey: ["receipt-job"] });
  };

  const receipt = job.data;
  const isReading = Boolean(receiptId) && (!receipt || receipt.status === "PENDING" || receipt.status === "PROCESSING");

  if (!receiptId) {
    return (
      <ReceiptUploadDropzone
        onUpload={(file) => upload.mutate(file)}
        isUploading={upload.isPending}
        disabled={outOfQuota}
        disabledReason="Kuota scan bulan ini sudah habis — upgrade ke Pro untuk lanjut."
      />
    );
  }

  if (isReading) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl bg-ink px-6 py-14 text-center text-ink-foreground">
        <span className="relative flex size-14 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
          <ScanLine className="size-7" aria-hidden />
          <span className="absolute inset-0 animate-ping rounded-2xl bg-accent/40" aria-hidden />
        </span>
        <div className="space-y-1">
          <p className="text-lg font-bold">Memproses struk…</p>
          <p className="text-sm text-ink-foreground/70">
            Membaca item, harga, dan total. Biasanya selesai dalam 3–8 detik.
          </p>
        </div>
        <StatusPill status={receipt?.status ?? "PENDING"} />
      </div>
    );
  }

  if (!receipt) return null;

  const hasDoubt = receipt.lowConfidenceFields.length > 0;

  return (
    <div className="flex flex-col gap-5">
      {receipt.status === "FAILED" ? (
        <div className="flex items-start gap-3 rounded-2xl bg-warning/12 p-4">
          <CircleAlert className="mt-0.5 size-5 shrink-0 text-warning-foreground" aria-hidden />
          <div className="space-y-1">
            <p className="font-semibold text-foreground">Pembacaan otomatis gagal</p>
            <p className="text-sm text-muted-foreground">
              {receipt.failureReason ?? "Struk tidak terbaca."} Fotonya tetap tersimpan — isi datanya
              manual di bawah, atau coba foto ulang.
            </p>
          </div>
        </div>
      ) : hasDoubt ? (
        <div className="flex items-start gap-3 rounded-2xl bg-warning/12 p-4">
          <CircleAlert className="mt-0.5 size-5 shrink-0 text-warning-foreground" aria-hidden />
          <div className="space-y-1">
            <p className="font-semibold text-foreground">Struk terbaca, tapi ada yang perlu dicek</p>
            <p className="text-sm text-muted-foreground">
              Beberapa data ditandai di foto sebelah — bandingkan sebelum disimpan.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-3 rounded-2xl bg-accent/25 p-4">
          <Sparkles className="mt-0.5 size-5 shrink-0 text-accent-foreground" aria-hidden />
          <div className="space-y-1">
            <p className="font-semibold text-foreground">Struk terbaca</p>
            <p className="text-sm text-muted-foreground">
              Periksa hasilnya di bawah dan perbaiki yang meleset sebelum disimpan.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[18rem_1fr] lg:items-start">
        <ReceiptImagePreview
          imageUrl={receipt.imageUrl}
          alt={`Foto struk dari ${receipt.storeName ?? "struk yang baru discan"}, ${formatDate(receipt.date ?? receipt.createdAt)}`}
          lowConfidenceFields={receipt.lowConfidenceFields}
        />

        <OcrReviewForm
          receipt={receipt}
          onSaved={() => {
            router.push("/receipts");
            router.refresh();
          }}
        />
      </div>

      <Button type="button" variant="ghost" size="sm" onClick={reset} className="self-start">
        <RotateCcw data-icon="inline-start" aria-hidden />
        Scan struk lain
      </Button>
    </div>
  );
}
