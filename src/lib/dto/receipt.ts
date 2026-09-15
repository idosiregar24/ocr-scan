import type { Receipt, ReceiptItem } from "@prisma/client";

// Shape eksplisit yang dikirim ke client — jangan return model Prisma mentah dari Route Handler/Server Action.
export type ReceiptDTO = ReturnType<typeof toReceiptDTO>;

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
