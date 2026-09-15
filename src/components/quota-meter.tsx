import type { Plan } from "@prisma/client";
import { MONTHLY_QUOTA, PLAN_LABEL } from "@/lib/constants/plan";
import { cn } from "cn";

type Props = { plan: Plan; quotaUsed: number; className?: string };

export function QuotaMeter({ plan, quotaUsed, className }: Props) {
  const limit = MONTHLY_QUOTA[plan];

  if (limit === null) {
    return (
      <div className={cn("rounded-xl bg-secondary px-3 py-2.5", className)}>
        <p className="text-xs font-semibold text-muted-foreground">Kuota {PLAN_LABEL[plan]}</p>
        <p className="text-sm font-bold text-foreground">Tanpa batas</p>
      </div>
    );
  }

  const used = Math.min(quotaUsed, limit);
  const remaining = limit - used;
  const percent = Math.round((used / limit) * 100);
  const isLow = remaining <= Math.max(1, Math.round(limit * 0.15));

  return (
    <div className={cn("rounded-xl bg-secondary px-3 py-2.5", className)}>
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-xs font-semibold text-muted-foreground">Kuota {PLAN_LABEL[plan]}</p>
        <p className="font-mono text-xs font-bold tabular-nums text-foreground">
          {remaining}/{limit}
        </p>
      </div>
      <div
        className="mt-2 h-1.5 overflow-hidden rounded-full bg-border"
        role="progressbar"
        aria-valuenow={used}
        aria-valuemin={0}
        aria-valuemax={limit}
        aria-label={`Kuota scan terpakai ${used} dari ${limit}`}
      >
        <div
          className={cn("h-full rounded-full transition-all", isLow ? "bg-warning" : "bg-primary")}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
