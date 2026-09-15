import { z } from "zod";

export const receiptItemInputSchema = z.object({
  name: z.string().min(1).max(200),
  qty: z.coerce.number().positive().default(1),
  unitPrice: z.coerce.number().nonnegative(),
  categoryId: z.string().cuid().optional().nullable(),
});

export const createReceiptSchema = z.object({
  storeName: z.string().min(1).max(200).optional(),
  date: z.coerce.date().optional(),
  receiptNo: z.string().max(100).optional(),
  cashier: z.string().max(100).optional(),
  paymentMethod: z.string().max(50).optional(),
  imageKey: z.string().min(1),
  subtotal: z.coerce.number().nonnegative().optional(),
  discount: z.coerce.number().nonnegative().default(0),
  tax: z.coerce.number().nonnegative().default(0),
  total: z.coerce.number().nonnegative().optional(),
  items: z.array(receiptItemInputSchema).default([]),
});

export const updateReceiptSchema = createReceiptSchema.partial().extend({
  id: z.string().cuid(),
});

export const listReceiptsQuerySchema = z.object({
  storeName: z.string().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  cursor: z.string().cuid().optional(),
  take: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateReceiptInput = z.infer<typeof createReceiptSchema>;
export type UpdateReceiptInput = z.infer<typeof updateReceiptSchema>;
export type ListReceiptsQuery = z.infer<typeof listReceiptsQuerySchema>;
