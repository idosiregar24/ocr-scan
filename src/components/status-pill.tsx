import { CheckCircle2, CircleAlert, Clock, Loader2 } from "lucide-react";
import { cn } from "cn";
import type { ReceiptDTO } from "@/lib/dto/receipt";

type Status = ReceiptDTO["status"];

const STATUS = {
  PENDING: { label: "Antre", icon: Clock, className: "bg-secondary text-secondary-foreground" },
  PROCESSING: { label: "Membaca", icon: Loader2, className: "bg-primary/10 text-primary" },
  DONE: { label: "Selesai", icon: CheckCircle2, className: "bg-success/12 text-success" },
  FAILED: { label: "Gagal", icon: CircleAlert, className: "bg-destructive/10 text-destructive" },
} satisfies Record<Status, { label: string; icon: typeof Clock; className: string }>;

export function StatusPill({ status, className }: { status: Status; className?: string }) {
  const { label, icon: Icon, className: tone } = STATUS[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
        tone,
        className,
      )}
    >
      <Icon className={cn("size-3.5", status === "PROCESSING" && "animate-spin")} aria-hidden />
      {label}
    </span>
  );
}
