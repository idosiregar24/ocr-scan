import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({ prisma: {} }));

const { buildSpendingReport, formatSpendingReportText, periodRange } = await import("./report");

const noBills = { count: 0, total: 0 };

describe("buildSpendingReport", () => {
  const receipts = [
    { total: 50000, date: new Date(2026, 0, 5), createdAt: new Date(2026, 0, 5), storeName: "Indomaret" },
    { total: 30000, date: new Date(2026, 0, 20), createdAt: new Date(2026, 0, 20), storeName: "Indomaret" },
    // Tanpa tanggal struk: jatuh ke bulan scan.
    { total: 100000, date: null, createdAt: new Date(2026, 2, 1), storeName: "Superindo" },
    { total: null, date: new Date(2026, 2, 2), createdAt: new Date(2026, 2, 2), storeName: null },
  ];

  it("menjumlahkan total, rata-rata, rincian bulanan, dan toko teratas", () => {
    const report = buildSpendingReport({ year: 2026, month: null }, receipts, { count: 1, total: 75000 }, noBills);

    expect(report.totalSpend).toBe(180000);
    expect(report.receiptCount).toBe(4);
    expect(report.averagePerReceipt).toBe(45000);
    expect(report.byMonth).toHaveLength(12);
    expect(report.byMonth[0]).toEqual({ month: 1, total: 80000, count: 2 });
    expect(report.byMonth[2]).toEqual({ month: 3, total: 100000, count: 2 });
    expect(report.topStores[0]).toEqual({ name: "Superindo", total: 100000, count: 1 });
    expect(report.billsPaid.total).toBe(75000);
  });

  it("laporan bulanan tidak punya rincian per bulan", () => {
    expect(buildSpendingReport({ year: 2026, month: 1 }, receipts.slice(0, 2), noBills, noBills).byMonth).toEqual([]);
  });

  it("periode kosong menghasilkan nol, bukan NaN", () => {
    const report = buildSpendingReport({ year: 2025, month: null }, [], noBills, noBills);
    expect(report.averagePerReceipt).toBe(0);
    expect(formatSpendingReportText(report)).toContain("Jumlah struk: 0");
  });
});

describe("periodRange", () => {
  it("Desember berakhir di 1 Januari tahun berikutnya", () => {
    const range = periodRange({ year: 2026, month: 12 });
    expect(range.lt).toEqual(new Date(2027, 0, 1));
  });
});
