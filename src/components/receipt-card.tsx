import { Receipt as ReceiptIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatIDR, formatDate } from "@/lib/format";
import type { ReceiptDTO } from "@/lib/dto/receipt";

const STATUS_LABEL: Record<ReceiptDTO["status"], string> = {
  PENDING: "Menunggu",
  PROCESSING: "Memproses",
  DONE: "Selesai",
  FAILED: "Gagal",
};

export function ReceiptCard({ receipt }: { receipt: ReceiptDTO }) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm transition hover:shadow-md">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
          <ReceiptIcon className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-card-foreground">{receipt.storeName ?? "Toko tidak diketahui"}</p>
          <p className="text-sm text-muted-foreground">{formatDate(receipt.date)}</p>
        </div>
        <Badge variant={receipt.status === "FAILED" ? "destructive" : "secondary"}>
          {STATUS_LABEL[receipt.status]}
        </Badge>
      </div>
      <div className="mt-3 flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{receipt.items.length} item</span>
        <span className="font-semibold text-primary">{receipt.total !== null ? formatIDR(receipt.total) : "-"}</span>
      </div>
    </div>
  );
}
