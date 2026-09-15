import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/lib/auth";
import { getReceiptForUser, ReceiptNotFoundError } from "@/lib/services/receipt";
import { toReceiptDTO } from "@/lib/dto/receipt";
import { formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/status-pill";
import { OcrReviewForm } from "@/components/ocr-review-form";
import { DeleteReceiptButton } from "@/components/delete-receipt-button";

type Props = { params: Promise<{ id: string }> };

export default async function ReceiptDetailPage({ params }: Props) {
  const session = await auth();
  if (!session?.user) return null; // dijamin oleh (dashboard)/layout.tsx

  const { id } = await params;

  let receipt;
  try {
    receipt = toReceiptDTO(await getReceiptForUser(id, session.user.id));
  } catch (err) {
    if (err instanceof ReceiptNotFoundError) notFound();
    throw err;
  }

  const storeName = receipt.storeName ?? "Toko belum terisi";

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <Button asChild variant="ghost" size="sm" className="self-start">
        <Link href="/receipts">
          <ArrowLeft data-icon="inline-start" aria-hidden />
          Riwayat transaksi
        </Link>
      </Button>

      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-extrabold text-foreground md:text-3xl">{storeName}</h1>
            <StatusPill status={receipt.status} />
          </div>
          <p className="font-mono text-sm tabular-nums text-muted-foreground">
            {formatDate(receipt.date ?? receipt.createdAt)}
            {receipt.receiptNo && ` · ${receipt.receiptNo}`}
          </p>
        </div>
        <DeleteReceiptButton receiptId={receipt.id} storeName={storeName} />
      </header>

      <div className="grid gap-6 lg:grid-cols-[18rem_1fr] lg:items-start">
        <figure className="overflow-hidden rounded-2xl bg-ink">
          <Image
            src={receipt.imageUrl}
            alt={`Foto struk dari ${storeName}, ${formatDate(receipt.date ?? receipt.createdAt)}`}
            width={600}
            height={900}
            unoptimized
            className="max-h-[26rem] w-full object-contain lg:max-h-none"
          />
        </figure>

        <section className="flex flex-col gap-4">
          <h2 className="sr-only">Edit data struk</h2>
          <OcrReviewForm receipt={receipt} submitLabel="Simpan perubahan" />
        </section>
      </div>
    </div>
  );
}
