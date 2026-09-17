import { formatIDR } from "@/lib/format";
import type { SpendingReport } from "@/lib/services/report";

const monthShort = new Intl.DateTimeFormat("id-ID", { month: "short" });
const monthLong = new Intl.DateTimeFormat("id-ID", { month: "long" });

function title(report: SpendingReport) {
  return report.month
    ? `Laporan ${monthLong.format(new Date(report.year, report.month - 1, 1))} ${report.year}`
    : `Laporan tahun ${report.year}`;
}

export function ChatReportCard({ report }: { report: SpendingReport }) {
  const peak = Math.max(...report.byMonth.map((entry) => entry.total), 1);

  return (
    <section aria-label={title(report)} className="flex flex-col gap-4 rounded-2xl bg-card p-4 text-card-foreground ring-1 ring-foreground/10">
      <div className="space-y-1">
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{title(report)}</p>
        <p className="font-mono text-2xl font-extrabold tabular-nums">{formatIDR(report.totalSpend)}</p>
        <p className="text-sm text-muted-foreground">
          {report.receiptCount} struk · rata-rata {formatIDR(report.averagePerReceipt)}
        </p>
      </div>

      {report.byMonth.length > 0 && (
        <ol className="grid grid-cols-12 items-end gap-1" aria-label="Pengeluaran per bulan">
          {report.byMonth.map((entry) => {
            const label = monthShort.format(new Date(report.year, entry.month - 1, 1));
            return (
              <li key={entry.month} className="flex flex-col items-center gap-1">
                <span className="flex h-16 w-full items-end">
                  <span
                    className="w-full rounded-t bg-primary/80"
                    style={{ height: `${Math.max((entry.total / peak) * 100, entry.total > 0 ? 6 : 0)}%` }}
                    title={`${label}: ${formatIDR(entry.total)}`}
                  />
                </span>
                <span className="text-[0.6rem] text-muted-foreground">{label}</span>
                <span className="sr-only">{formatIDR(entry.total)}</span>
              </li>
            );
          })}
        </ol>
      )}

      {report.topStores.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground">Toko teratas</p>
          <ul className="space-y-1 text-sm">
            {report.topStores.map((store) => (
              <li key={store.name} className="flex justify-between gap-3">
                <span className="truncate">{store.name}</span>
                <span className="font-mono tabular-nums">{formatIDR(store.total)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <dl className="grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-xl bg-success/12 p-3">
          <dt className="text-xs text-muted-foreground">Tagihan dilunasi</dt>
          <dd className="font-mono font-bold tabular-nums">{formatIDR(report.billsPaid.total)}</dd>
          <dd className="text-xs text-muted-foreground">{report.billsPaid.count} tagihan</dd>
        </div>
        <div className="rounded-xl bg-warning/12 p-3">
          <dt className="text-xs text-muted-foreground">Belum lunas</dt>
          <dd className="font-mono font-bold tabular-nums">{formatIDR(report.billsOutstanding.total)}</dd>
          <dd className="text-xs text-muted-foreground">{report.billsOutstanding.count} tagihan</dd>
        </div>
      </dl>
    </section>
  );
}
