import { prisma } from "@/lib/prisma";
import type { CreateReceiptInput, ListReceiptsQuery } from "@/lib/validations/receipt";

// Free tier: 20 scan/bulan, Pro: 500/bulan, Biz: unlimited (lihat PRD §6.1).
const MONTHLY_QUOTA: Record<"FREE" | "PRO" | "BIZ", number | null> = {
  FREE: 20,
  PRO: 500,
  BIZ: null,
};

export class QuotaExceededError extends Error {
  constructor() {
    super("Kuota scan bulan ini sudah habis");
    this.name = "QuotaExceededError";
  }
}

/** Cek + increment quota secara atomik dalam satu transaksi — cegah race condition dari request paralel. */
export async function consumeReceiptQuota(userId: string) {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUniqueOrThrow({ where: { id: userId } });
    const limit = MONTHLY_QUOTA[user.plan];

    if (limit !== null && user.quotaUsed >= limit) {
      throw new QuotaExceededError();
    }

    return tx.user.update({
      where: { id: userId },
      data: { quotaUsed: { increment: 1 } },
    });
  });
}

export async function createReceipt(userId: string, input: CreateReceiptInput) {
  return prisma.receipt.create({
    data: {
      userId,
      storeName: input.storeName,
      date: input.date,
      receiptNo: input.receiptNo,
      cashier: input.cashier,
      paymentMethod: input.paymentMethod,
      imageKey: input.imageKey,
      subtotal: input.subtotal,
      discount: input.discount,
      tax: input.tax,
      total: input.total,
      status: "PENDING",
      items: {
        create: input.items.map((item) => ({
          name: item.name,
          qty: item.qty,
          unitPrice: item.unitPrice,
          subtotal: item.qty * item.unitPrice,
          categoryId: item.categoryId ?? undefined,
        })),
      },
    },
    include: { items: true },
  });
}

export async function listReceiptsByUser(userId: string, query: ListReceiptsQuery) {
  return prisma.receipt.findMany({
    where: {
      userId,
      storeName: query.storeName ? { contains: query.storeName, mode: "insensitive" } : undefined,
      date: query.from || query.to ? { gte: query.from, lte: query.to } : undefined,
    },
    include: { items: true },
    orderBy: { date: "desc" },
    take: query.take,
    ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
  });
}

/** Kepemilikan struk — dipanggil sebelum update/delete supaya user hanya bisa ubah miliknya sendiri. */
export async function assertReceiptOwnership(receiptId: string, userId: string) {
  const receipt = await prisma.receipt.findUnique({ where: { id: receiptId } });
  if (!receipt || receipt.userId !== userId) {
    throw new Error("Struk tidak ditemukan");
  }
  return receipt;
}
