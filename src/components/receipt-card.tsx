import Link from "next/link";
import { StatusPill } from "@/components/status-pill";
import { formatIDR, formatDate } from "@/lib/format";
import type { ReceiptDTO } from "@/lib/dto/receipt";

export function ReceiptCard({ receipt }: { receipt: ReceiptDTO }) {
  const storeName = receipt.storeName ?? "Toko belum terisi";

  return (
    <Link
      href={`/receipts/${receipt.id}`}
      className="group flex flex-col gap-3 rounded-2xl bg-card p-4 ring-1 ring-foreground/10 transition-shadow hover:shadow-md focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-bold text-card-foreground">{storeName}</p>
          <p className="font-mono text-xs tabular-nums text-muted-foreground">
            {formatDate(receipt.date ?? receipt.createdAt)}
          </p>
        </div>
        <StatusPill status={receipt.status} />
      </div>

      {/* Garis putus-putus meniru pemisah baris pada struk cetak. */}
      <div className="h-px w-full rule-dotted text-border" aria-hidden />

      <div className="flex items-end justify-between gap-2">
        <span className="text-sm text-muted-foreground">
          {receipt.items.length} item
        </span>
        <span className="font-mono text-lg font-bold tabular-nums text-foreground">
          {receipt.total !== null ? formatIDR(receipt.total) : "—"}
        </span>
      </div>
    </Link>
  );
}
