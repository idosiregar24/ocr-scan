import type { Receipt, ReceiptItem } from "@prisma/client";

// Shape eksplisit yang dikirim ke client — jangan return model Prisma mentah dari Route Handler/Server Action.
export type ReceiptDTO = ReturnType<typeof toReceiptDTO>;

/** `ocrRaw` menyimpan hasil mentah Claude ATAU `{ error }` saat job gagal; hanya pesan errornya yang boleh keluar. */
function failureReasonOf(ocrRaw: Receipt["ocrRaw"]) {
  if (!ocrRaw || typeof ocrRaw !== "object" || Array.isArray(ocrRaw)) return null;
  const error = (ocrRaw as Record<string, unknown>).error;
  return typeof error === "string" ? error : null;
}

export function toReceiptDTO(receipt: Receipt & { items: ReceiptItem[] }) {
  return {
    id: receipt.id,
    storeName: receipt.storeName,
    date: receipt.date,
    receiptNo: receipt.receiptNo,
    cashier: receipt.cashier,
    paymentMethod: receipt.paymentMethod,
    subtotal: receipt.subtotal ? Number(receipt.subtotal) : null,
    discount: Number(receipt.discount),
    tax: Number(receipt.tax),
    total: receipt.total ? Number(receipt.total) : null,
    status: receipt.status,
    failureReason: failureReasonOf(receipt.ocrRaw),
    // imageKey mentah tidak pernah dikirim ke client — hanya route ber-auth yang menyajikan fotonya.
    imageUrl: `/api/receipts/${receipt.id}/image`,
    items: receipt.items.map((item) => ({
      id: item.id,
      name: item.name,
      qty: Number(item.qty),
      unitPrice: Number(item.unitPrice),
      subtotal: Number(item.subtotal),
      categoryId: item.categoryId,
    })),
    createdAt: receipt.createdAt,
  };
}
