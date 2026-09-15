import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { MONTHLY_QUOTA } from "@/lib/constants/plan";
import { deleteObject } from "@/lib/storage";
import type { OcrResult } from "@/lib/services/ocr";
import type { CreateReceiptInput, ListReceiptsQuery, UpdateReceiptInput } from "@/lib/validations/receipt";

export class QuotaExceededError extends Error {
  constructor() {
    super("Kuota scan bulan ini sudah habis");
    this.name = "QuotaExceededError";
  }
}

export class ReceiptNotFoundError extends Error {
  constructor() {
    super("Struk tidak ditemukan");
    this.name = "ReceiptNotFoundError";
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

/** Kembalikan kuota saat upload gagal setelah kuota terlanjur dipotong. */
export async function refundReceiptQuota(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { quotaUsed: { decrement: 1 } },
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

/** Baris kosong yang dibuat tepat setelah foto tersimpan; job OCR yang mengisinya. */
export async function createPendingReceipt(userId: string, imageKey: string) {
  return prisma.receipt.create({
    data: { userId, imageKey, status: "PENDING" },
    include: { items: true },
  });
}

export async function markReceiptProcessing(receiptId: string) {
  await prisma.receipt.update({
    where: { id: receiptId },
    data: { status: "PROCESSING" },
  });
}

/**
 * Tulis hasil OCR sekali jalan: ocrRaw disimpan apa adanya (sumber reprocessing), item lama
 * dihapus dulu supaya job yang di-retry tidak menggandakan baris.
 */
export async function applyOcrResult(receiptId: string, result: OcrResult) {
  const parsedDate = result.date ? new Date(result.date) : null;
  const date = parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate : null;

  return prisma.$transaction(async (tx) => {
    await tx.receiptItem.deleteMany({ where: { receiptId } });

    return tx.receipt.update({
      where: { id: receiptId },
      data: {
        storeName: result.storeName,
        date,
        receiptNo: result.receiptNo,
        cashier: result.cashier,
        paymentMethod: result.paymentMethod,
        subtotal: result.subtotal,
        discount: result.discount ?? 0,
        tax: result.tax ?? 0,
        total: result.total,
        status: "DONE",
        ocrRaw: result as unknown as Prisma.InputJsonValue,
        items: {
          create: result.items.map((item) => ({
            name: item.name,
            qty: item.qty,
            unitPrice: item.unitPrice,
            subtotal: item.qty * item.unitPrice,
          })),
        },
      },
      include: { items: true },
    });
  });
}

/** Alasan gagal ikut ke ocrRaw supaya UI bisa menampilkannya tanpa kolom tambahan. */
export async function markReceiptFailed(receiptId: string, reason: string) {
  await prisma.receipt.update({
    where: { id: receiptId },
    data: { status: "FAILED", ocrRaw: { error: reason } },
  });
}

export async function listReceiptsByUser(userId: string, query: ListReceiptsQuery) {
  return prisma.receipt.findMany({
    where: {
      userId,
      status: query.status,
      storeName: query.storeName ? { contains: query.storeName, mode: "insensitive" } : undefined,
      date: query.from || query.to ? { gte: query.from, lte: query.to } : undefined,
    },
    include: { items: true },
    orderBy: { createdAt: "desc" },
    take: query.take,
    ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
  });
}

/** Kepemilikan struk — dipanggil sebelum read/update/delete supaya user hanya menyentuh miliknya sendiri. */
export async function getReceiptForUser(receiptId: string, userId: string) {
  const receipt = await prisma.receipt.findUnique({
    where: { id: receiptId },
    include: { items: true },
  });
  if (!receipt || receipt.userId !== userId) throw new ReceiptNotFoundError();
  return receipt;
}

/** Simpan hasil review user. Item dikirim utuh dari form, jadi diganti total, bukan di-merge. */
export async function updateReceipt(userId: string, input: UpdateReceiptInput) {
  await getReceiptForUser(input.id, userId);

  return prisma.$transaction(async (tx) => {
    await tx.receiptItem.deleteMany({ where: { receiptId: input.id } });

    return tx.receipt.update({
      where: { id: input.id },
      data: {
        storeName: input.storeName,
        date: input.date,
        receiptNo: input.receiptNo,
        cashier: input.cashier,
        paymentMethod: input.paymentMethod,
        subtotal: input.subtotal,
        discount: input.discount,
        tax: input.tax,
        total: input.total,
        status: "DONE",
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
  });
}

export async function deleteReceipt(userId: string, receiptId: string) {
  const receipt = await getReceiptForUser(receiptId, userId);
  await prisma.receipt.delete({ where: { id: receiptId } });
  await deleteObject(receipt.imageKey);
}

export async function getMonthlySummary(userId: string) {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [aggregate, receiptCount] = await Promise.all([
    prisma.receipt.aggregate({
      where: { userId, status: "DONE", createdAt: { gte: startOfMonth } },
      _sum: { total: true },
    }),
    prisma.receipt.count({ where: { userId, createdAt: { gte: startOfMonth } } }),
  ]);

  return {
    totalSpend: Number(aggregate._sum.total ?? 0),
    receiptCount,
  };
}
