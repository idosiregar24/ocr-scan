import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env", () => ({ env: {} }));
vi.mock("@/lib/prisma", () => ({
  prisma: { chatMessage: { findFirst: vi.fn() } },
}));
vi.mock("@/lib/services/telegram", () => ({
  getTelegramChatIdForUser: vi.fn(),
  sendTelegramMessage: vi.fn(),
}));
vi.mock("@/lib/services/report", () => ({
  getSpendingReport: vi.fn(),
  formatSpendingReportText: vi.fn(() => "Laporan Tahun 2026"),
}));
vi.mock("@/lib/services/bill", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./bill")>();
  return {
    ...actual,
    createBillFromReceipt: vi.fn(),
    createManualBill: vi.fn(),
    findBillsByNo: vi.fn(),
    findReceiptsByNo: vi.fn(),
    listUnpaidBills: vi.fn(),
    setBillStatus: vi.fn(),
  };
});

const { prisma } = await import("@/lib/prisma");
const bill = await import("@/lib/services/bill");
const report = await import("@/lib/services/report");
const { handleChatText } = await import("./chat");

const USER_ID = "user_1";
const NOW = new Date(2026, 8, 16);

function makeBill(overrides: Record<string, unknown> = {}) {
  return {
    id: "bill_1",
    userId: USER_ID,
    receiptId: null,
    billNo: "32",
    vendor: "Indomaret",
    amount: 75400,
    issuedAt: new Date(2026, 8, 1),
    status: "UNPAID",
    paidAt: null,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

function makeReceipt(overrides: Record<string, unknown> = {}) {
  return {
    id: "receipt_1",
    userId: USER_ID,
    storeName: "Indomaret",
    receiptNo: "0032",
    total: 75400,
    date: new Date(2026, 8, 1),
    createdAt: NOW,
    status: "DONE",
    bill: null,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("handleChatText — tandai lunas", () => {
  it("menandai satu-satunya tagihan yang cocok sebagai lunas", async () => {
    vi.mocked(bill.findBillsByNo).mockResolvedValue([makeBill()] as never);
    vi.mocked(bill.setBillStatus).mockResolvedValue(makeBill({ status: "PAID", paidAt: NOW }) as never);

    const reply = await handleChatText(USER_ID, "tagihan no 32 dah lunas yah", NOW);

    expect(bill.findBillsByNo).toHaveBeenCalledWith(USER_ID, "32");
    expect(bill.setBillStatus).toHaveBeenCalledWith(USER_ID, "bill_1", "PAID");
    expect(reply.content).toContain("sekarang LUNAS");
  });

  it("meminta nama toko saat ada lebih dari satu tagihan belum lunas bernomor sama", async () => {
    vi.mocked(bill.findBillsByNo).mockResolvedValue([
      makeBill(),
      makeBill({ id: "bill_2", vendor: "Alfamart", amount: 12000 }),
    ] as never);

    const reply = await handleChatText(USER_ID, "tagihan no 32 lunas", NOW);

    expect(bill.setBillStatus).not.toHaveBeenCalled();
    expect(reply.content).toContain("Ada 2 data dengan nomor 32");
    expect(reply.content).toContain("Alfamart");
  });

  it("memberi tahu kalau tagihan tidak ditemukan", async () => {
    vi.mocked(bill.findBillsByNo).mockResolvedValue([]);

    const reply = await handleChatText(USER_ID, "tagihan no 99 lunas", NOW);

    expect(reply.content).toContain("no 99 tidak ditemukan");
  });

  it("tidak mengubah tagihan yang sudah lunas", async () => {
    vi.mocked(bill.findBillsByNo).mockResolvedValue([makeBill({ status: "PAID", paidAt: NOW })] as never);

    const reply = await handleChatText(USER_ID, "no 32 udah lunas", NOW);

    expect(bill.setBillStatus).not.toHaveBeenCalled();
    expect(reply.content).toContain("sudah lunas sejak");
  });
});

describe("handleChatText — tandai belum lunas", () => {
  it("membuat tagihan dari struk terakhir yang dikirim lewat chat", async () => {
    vi.mocked(prisma.chatMessage.findFirst).mockResolvedValue({ receipt: makeReceipt() } as never);
    vi.mocked(bill.createBillFromReceipt).mockResolvedValue(makeBill({ billNo: "0032", receiptId: "receipt_1" }) as never);

    const reply = await handleChatText(USER_ID, "ini belum lunas", NOW);

    expect(bill.createBillFromReceipt).toHaveBeenCalledWith(USER_ID, "receipt_1", null);
    expect(reply.content).toContain("BELUM LUNAS");
  });

  it("menunda saat struk masih diproses OCR", async () => {
    vi.mocked(prisma.chatMessage.findFirst).mockResolvedValue({
      receipt: makeReceipt({ status: "PROCESSING", total: null }),
    } as never);

    const reply = await handleChatText(USER_ID, "belum lunas", NOW);

    expect(bill.createBillFromReceipt).not.toHaveBeenCalled();
    expect(reply.content).toContain("masih dibaca");
  });

  it("meminta foto dulu saat belum ada struk di chat", async () => {
    vi.mocked(prisma.chatMessage.findFirst).mockResolvedValue(null);

    const reply = await handleChatText(USER_ID, "ini belum lunas", NOW);

    expect(reply.content).toContain("Kirim foto struknya dulu");
  });
});

describe("handleChatText — laporan", () => {
  it("menyertakan payload laporan untuk tahun berjalan", async () => {
    vi.mocked(report.getSpendingReport).mockResolvedValue({ year: 2026, month: null } as never);

    const reply = await handleChatText(USER_ID, "laporan akhir tahun", NOW);

    expect(report.getSpendingReport).toHaveBeenCalledWith(USER_ID, { year: 2026, month: null });
    expect(reply.payload?.type).toBe("report");
  });
});
