import { z } from "zod";

/** Input `<input type="date">`/teks yang dikosongkan user terkirim sebagai "", bukan undefined. */
const emptyToUndefined = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((value) => (value === "" || value === null ? undefined : value), schema.optional());

export const receiptItemInputSchema = z.object({
  name: z.string().min(1, "Nama item wajib diisi").max(200),
  qty: z.coerce.number().positive("Qty harus lebih dari 0"),
  unitPrice: z.coerce.number().nonnegative("Harga tidak boleh negatif"),
  categoryId: emptyToUndefined(z.string().cuid()).nullable(),
});

export const createReceiptSchema = z.object({
  storeName: emptyToUndefined(z.string().min(1).max(200)),
  date: emptyToUndefined(z.coerce.date()),
  receiptNo: emptyToUndefined(z.string().max(100)),
  cashier: emptyToUndefined(z.string().max(100)),
  paymentMethod: emptyToUndefined(z.string().max(50)),
  imageKey: z.string().min(1),
  subtotal: emptyToUndefined(z.coerce.number().nonnegative()),
  discount: z.coerce.number().nonnegative().default(0),
  tax: z.coerce.number().nonnegative().default(0),
  total: emptyToUndefined(z.coerce.number().nonnegative()),
  items: z.array(receiptItemInputSchema).default([]),
});

/**
 * Dipakai form review OCR (simpan pertama) sekaligus edit struk lama — satu schema, dua tempat.
 * `items` dikirim utuh karena service mengganti seluruh baris, bukan mem-patch sebagian.
 */
export const updateReceiptSchema = z.object({
  id: z.string().cuid(),
  storeName: emptyToUndefined(z.string().min(1).max(200)),
  date: emptyToUndefined(z.coerce.date()),
  receiptNo: emptyToUndefined(z.string().max(100)),
  cashier: emptyToUndefined(z.string().max(100)),
  paymentMethod: emptyToUndefined(z.string().max(50)),
  subtotal: emptyToUndefined(z.coerce.number().nonnegative()),
  discount: z.coerce.number().nonnegative().default(0),
  tax: z.coerce.number().nonnegative().default(0),
  total: emptyToUndefined(z.coerce.number().nonnegative()),
  items: z.array(receiptItemInputSchema).min(1, "Struk harus punya minimal 1 item"),
});

export const listReceiptsQuerySchema = z.object({
  storeName: emptyToUndefined(z.string()),
  status: emptyToUndefined(z.enum(["PENDING", "PROCESSING", "DONE", "FAILED"])),
  from: emptyToUndefined(z.coerce.date()),
  to: emptyToUndefined(z.coerce.date()),
  cursor: emptyToUndefined(z.string().cuid()),
  take: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateReceiptInput = z.infer<typeof createReceiptSchema>;
export type UpdateReceiptInput = z.infer<typeof updateReceiptSchema>;
export type ListReceiptsQuery = z.infer<typeof listReceiptsQuerySchema>;
