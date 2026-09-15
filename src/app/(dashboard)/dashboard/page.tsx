import Link from "next/link";
import { ArrowUpRight, Camera, Receipt, Wallet } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getMonthlySummary, listReceiptsByUser } from "@/lib/services/receipt";
import { listReceiptsQuerySchema } from "@/lib/validations/receipt";
import { toReceiptDTO } from "@/lib/dto/receipt";
import { MONTHLY_QUOTA, PLAN_LABEL } from "@/lib/constants/plan";
import { formatIDR } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { ReceiptCard } from "@/components/receipt-card";
import { EmptyState } from "@/components/empty-state";

const MONTH_LABEL = new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" });

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) return null; // dijamin oleh (dashboard)/layout.tsx

  const [summary, recent, user] = await Promise.all([
    getMonthlySummary(session.user.id),
    listReceiptsByUser(session.user.id, listReceiptsQuerySchema.parse({ take: 6 })),
    prisma.user.findUniqueOrThrow({
      where: { id: session.user.id },
      select: { name: true, plan: true, quotaUsed: true },
    }),
  ]);

  const receipts = recent.map(toReceiptDTO);
  const limit = MONTHLY_QUOTA[user.plan];
  const remaining = limit === null ? null : Math.max(limit - user.quotaUsed, 0);
  const firstName = user.name?.split(" ")[0] ?? "kamu";

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-muted-foreground">
            {MONTH_LABEL.format(new Date())}
          </p>
          <h1 className="text-2xl font-extrabold text-foreground md:text-3xl">Halo, {firstName}</h1>
        </div>
        <Button asChild size="xl" variant="accent" className="hidden md:inline-flex">
          <Link href="/scan">
            <Camera data-icon="inline-start" aria-hidden />
            Scan struk
          </Link>
        </Button>
      </header>

      <section aria-label="Ringkasan bulan ini" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <article className="rounded-2xl bg-ink p-5 text-ink-foreground sm:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-2 text-ink-foreground/70">
            <Wallet className="size-4" aria-hidden />
            <p className="text-xs font-semibold tracking-wide uppercase">Pengeluaran bulan ini</p>
          </div>
          <p className="mt-3 font-mono text-3xl font-bold tabular-nums">{formatIDR(summary.totalSpend)}</p>
          <p className="mt-1 text-sm text-ink-foreground/60">
            Dari {summary.receiptCount} struk yang tercatat
          </p>
        </article>

        <article className="rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Receipt className="size-4" aria-hidden />
            <p className="text-xs font-semibold tracking-wide uppercase">Struk ter-scan</p>
          </div>
          <p className="mt-3 font-mono text-3xl font-bold tabular-nums text-foreground">
            {summary.receiptCount}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">Bulan berjalan</p>
        </article>

        <article className="rounded-2xl bg-accent p-5 text-accent-foreground">
          <p className="text-xs font-semibold tracking-wide uppercase opacity-70">
            Sisa kuota {PLAN_LABEL[user.plan]}
          </p>
          <p className="mt-3 font-mono text-3xl font-bold tabular-nums">
            {remaining === null ? "∞" : remaining}
          </p>
          <p className="mt-1 text-sm opacity-70">
            {limit === null ? "Scan tanpa batas" : `dari ${limit} scan per bulan`}
          </p>
        </article>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">Struk terbaru</h2>
          {receipts.length > 0 && (
            <Button asChild variant="ghost" size="sm">
              <Link href="/receipts">
                Lihat semua
                <ArrowUpRight data-icon="inline-end" aria-hidden />
              </Link>
            </Button>
          )}
        </div>

        {receipts.length === 0 ? (
          <EmptyState
            title="Belum ada struk bulan ini"
            description="Foto struk belanja pertamamu — item, harga, dan totalnya dicatat otomatis."
            action={{ href: "/scan", label: "Scan struk pertama" }}
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {receipts.map((receipt) => (
              <ReceiptCard key={receipt.id} receipt={receipt} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
