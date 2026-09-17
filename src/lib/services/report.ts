import { prisma } from "@/lib/prisma";
import { formatIDR } from "@/lib/format";

export type ReportPeriod = { year: number; month: number | null };

type ReceiptRow = { total: unknown; date: Date | null; createdAt: Date; storeName: string | null };
type BillTotals = { count: number; total: number };

export type SpendingReport = {
  year: number;
  month: number | null;
  totalSpend: number;
  receiptCount: number;
  averagePerReceipt: number;
  byMonth: { month: number; total: number; count: number }[];
  topStores: { name: string; total: number; count: number }[];
  billsPaid: BillTotals;
  billsOutstanding: BillTotals;
};

const TOP_STORE_LIMIT = 3;
const monthName = new Intl.DateTimeFormat("id-ID", { month: "long" });

export function periodRange({ year, month }: ReportPeriod) {
  return month
    ? { gte: new Date(year, month - 1, 1), lt: new Date(year, month, 1) }
    : { gte: new Date(year, 0, 1), lt: new Date(year + 1, 0, 1) };
}

export function periodLabel({ year, month }: ReportPeriod) {
  return month ? `${monthName.format(new Date(year, month - 1, 1))} ${year}` : `Tahun ${year}`;
}

/** Agregasi murni dari baris struk — dipisah dari query supaya bisa dites tanpa database. */
export function buildSpendingReport(
  period: ReportPeriod,
  receipts: ReceiptRow[],
  billsPaid: BillTotals,
  billsOutstanding: BillTotals,
): SpendingReport {
  const byMonth = new Map<number, { total: number; count: number }>();
  const byStore = new Map<string, { total: number; count: number }>();
  let totalSpend = 0;

  for (const receipt of receipts) {
    const amount = Number(receipt.total ?? 0);
    totalSpend += amount;

    const month = (receipt.date ?? receipt.createdAt).getMonth() + 1;
    const monthEntry = byMonth.get(month) ?? { total: 0, count: 0 };
    byMonth.set(month, { total: monthEntry.total + amount, count: monthEntry.count + 1 });

    const store = receipt.storeName?.trim() || "Tanpa nama toko";
    const storeEntry = byStore.get(store) ?? { total: 0, count: 0 };
    byStore.set(store, { total: storeEntry.total + amount, count: storeEntry.count + 1 });
  }

  return {
    year: period.year,
    month: period.month,
    totalSpend,
    receiptCount: receipts.length,
    averagePerReceipt: receipts.length > 0 ? Math.round(totalSpend / receipts.length) : 0,
    byMonth: period.month
      ? []
      : Array.from({ length: 12 }, (_, index) => ({ month: index + 1, ...(byMonth.get(index + 1) ?? { total: 0, count: 0 }) })),
    topStores: [...byStore.entries()]
      .map(([name, entry]) => ({ name, ...entry }))
      .sort((a, b) => b.total - a.total)
      .slice(0, TOP_STORE_LIMIT),
    billsPaid,
    billsOutstanding,
  };
}

export async function getSpendingReport(userId: string, period: ReportPeriod) {
  const range = periodRange(period);

  const [receipts, paid, outstanding] = await Promise.all([
    prisma.receipt.findMany({
      // Struk tanpa tanggal (OCR tidak membaca) dihitung berdasarkan waktu scan.
      where: { userId, status: "DONE", OR: [{ date: range }, { date: null, createdAt: range }] },
      select: { total: true, date: true, createdAt: true, storeName: true },
    }),
    prisma.bill.aggregate({
      where: { userId, status: "PAID", paidAt: range },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.bill.aggregate({
      where: { userId, status: "UNPAID" },
      _sum: { amount: true },
      _count: true,
    }),
  ]);

  return buildSpendingReport(
    period,
    receipts,
    { count: paid._count, total: Number(paid._sum.amount ?? 0) },
    { count: outstanding._count, total: Number(outstanding._sum.amount ?? 0) },
  );
}

export function formatSpendingReportText(report: SpendingReport) {
  const lines = [
    `Laporan ${periodLabel(report)}`,
    "",
    `Total pengeluaran: ${formatIDR(report.totalSpend)}`,
    `Jumlah struk: ${report.receiptCount}`,
    `Rata-rata per struk: ${formatIDR(report.averagePerReceipt)}`,
  ];

  const activeMonths = report.byMonth.filter((entry) => entry.count > 0);
  if (activeMonths.length > 0) {
    lines.push("", "Per bulan:");
    for (const entry of activeMonths) {
      lines.push(`- ${monthName.format(new Date(report.year, entry.month - 1, 1))}: ${formatIDR(entry.total)} (${entry.count} struk)`);
    }
  }

  if (report.topStores.length > 0) {
    lines.push("", "Toko teratas:");
    report.topStores.forEach((store, index) => {
      lines.push(`${index + 1}. ${store.name}: ${formatIDR(store.total)} (${store.count} struk)`);
    });
  }

  lines.push(
    "",
    `Tagihan dilunasi: ${report.billsPaid.count} (${formatIDR(report.billsPaid.total)})`,
    `Tagihan belum lunas saat ini: ${report.billsOutstanding.count} (${formatIDR(report.billsOutstanding.total)})`,
  );

  return lines.join("\n");
}
