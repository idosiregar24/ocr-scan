import { Prisma, type Bill } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export class BillAlreadyExistsError extends Error {
  constructor(readonly bill: Bill) {
    super("Struk ini sudah punya tagihan");
    this.name = "BillAlreadyExistsError";
  }
}

export class ReceiptTotalMissingError extends Error {
  constructor() {
    super("Total struk belum terbaca — lengkapi dulu di halaman detail struk");
    this.name = "ReceiptTotalMissingError";
  }
}

export class BillNoRequiredError extends Error {
  constructor() {
    super("Struk ini tidak punya nomor struk");
    this.name = "BillNoRequiredError";
  }
}

/** Nomor struk dari toko sering diketik ulang tanpa nol di depan ("0032" disebut "32") atau dengan "#". */
export function normalizeBillNo(value: string) {
  const compact = value.trim().toLowerCase().replace(/^#/, "").replace(/\s+/g, "");
  return /^\d+$/.test(compact) ? compact.replace(/^0+(?=\d)/, "") : compact;
}

export function billNoMatches(stored: string, query: string) {
  return normalizeBillNo(stored) === normalizeBillNo(query);
}

export type BillResolution<T> = { kind: "none" } | { kind: "one"; bill: T } | { kind: "many"; bills: T[] };

/**
 * Pilih tagihan target dari kandidat bernomor sama. Tagihan UNPAID diprioritaskan karena itu yang
 * mungkin dimaksud user; vendor dipakai untuk mempersempit saat nomor bentrok antar toko.
 */
export function selectBill<T extends Pick<Bill, "status" | "vendor">>(
  candidates: T[],
  vendor: string | null,
  prefer: Bill["status"],
): BillResolution<T> {
  const needle = vendor?.trim().toLowerCase();
  const byVendor = needle
    ? candidates.filter((bill) => bill.vendor?.toLowerCase().includes(needle))
    : candidates;
  const pool = byVendor.length > 0 ? byVendor : candidates;

  if (pool.length === 0) return { kind: "none" };
  if (pool.length === 1) return { kind: "one", bill: pool[0] };

  const preferred = pool.filter((bill) => bill.status === prefer);
  if (preferred.length === 1) return { kind: "one", bill: preferred[0] };
  if (preferred.length === 0) return { kind: "one", bill: pool[0] };
  return { kind: "many", bills: preferred };
}

function searchTerm(billNo: string) {
  return normalizeBillNo(billNo);
}

export async function findBillsByNo(userId: string, billNo: string) {
  const candidates = await prisma.bill.findMany({
    where: { userId, billNo: { contains: searchTerm(billNo), mode: "insensitive" } },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return candidates.filter((bill) => billNoMatches(bill.billNo, billNo));
}

export async function findReceiptsByNo(userId: string, receiptNo: string) {
  const candidates = await prisma.receipt.findMany({
    where: { userId, receiptNo: { contains: searchTerm(receiptNo), mode: "insensitive" } },
    include: { bill: true },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return candidates.filter((receipt) => receipt.receiptNo && billNoMatches(receipt.receiptNo, receiptNo));
}

export async function createBillFromReceipt(userId: string, receiptId: string, billNoOverride?: string | null) {
  const receipt = await prisma.receipt.findFirst({ where: { id: receiptId, userId }, include: { bill: true } });
  if (!receipt) throw new Error("Struk tidak ditemukan");
  if (receipt.bill) throw new BillAlreadyExistsError(receipt.bill);

  const billNo = billNoOverride ?? receipt.receiptNo;
  if (!billNo) throw new BillNoRequiredError();
  if (receipt.total === null) throw new ReceiptTotalMissingError();

  try {
    return await prisma.bill.create({
      data: {
        userId,
        receiptId,
        billNo,
        vendor: receipt.storeName,
        amount: receipt.total,
        issuedAt: receipt.date ?? receipt.createdAt,
      },
    });
  } catch (err) {
    // receiptId unique: dua pesan "belum lunas" paralel untuk struk yang sama.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      const existing = await prisma.bill.findUniqueOrThrow({ where: { receiptId } });
      throw new BillAlreadyExistsError(existing);
    }
    throw err;
  }
}

export async function createManualBill(
  userId: string,
  input: { billNo: string; vendor: string | null; amount: number },
) {
  return prisma.bill.create({
    data: { userId, billNo: input.billNo, vendor: input.vendor, amount: input.amount, issuedAt: new Date() },
  });
}

export async function setBillStatus(userId: string, billId: string, status: Bill["status"]) {
  const updated = await prisma.bill.updateMany({
    where: { id: billId, userId },
    data: { status, paidAt: status === "PAID" ? new Date() : null },
  });
  if (updated.count !== 1) throw new Error("Tagihan tidak ditemukan");
  return prisma.bill.findUniqueOrThrow({ where: { id: billId } });
}

export async function listUnpaidBills(userId: string, take = 10) {
  const [bills, aggregate] = await Promise.all([
    prisma.bill.findMany({ where: { userId, status: "UNPAID" }, orderBy: { createdAt: "asc" }, take }),
    prisma.bill.aggregate({ where: { userId, status: "UNPAID" }, _sum: { amount: true }, _count: true }),
  ]);
  return { bills, count: aggregate._count, total: Number(aggregate._sum.amount ?? 0) };
}
