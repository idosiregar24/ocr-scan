# Skill: Pola Route Handler/Server Action ↔ Zod ↔ Prisma Service

Gunakan pola ini setiap membuat fitur baru yang mengubah data (Scan Struk, Riwayat Transaksi, Workspace, dll).

## 1. Zod schema (`lib/validations/receipt.ts`)
```ts
import { z } from "zod";

export const createReceiptItemSchema = z.object({
  name: z.string().min(1).max(200),
  qty: z.number().int().positive(),
  unitPrice: z.number().nonnegative(),
  category: z.string().optional(),
});

export const createReceiptSchema = z.object({
  storeName: z.string().min(1).max(200),
  date: z.coerce.date(),
  items: z.array(createReceiptItemSchema).min(1),
  subtotal: z.number().nonnegative(),
  discount: z.number().nonnegative().default(0),
  tax: z.number().nonnegative().default(0),
  total: z.number().nonnegative(),
});

export type CreateReceiptInput = z.infer<typeof createReceiptSchema>;
```

## 2. Service layer (`lib/services/receipt.ts`) — logika bisnis, tanpa dependensi HTTP
```ts
import { prisma } from "@/lib/prisma";
import type { CreateReceiptInput } from "@/lib/validations/receipt";

export async function createReceipt(userId: string, input: CreateReceiptInput) {
  return prisma.receipt.create({
    data: {
      userId,
      storeName: input.storeName,
      date: input.date,
      subtotal: input.subtotal,
      discount: input.discount,
      tax: input.tax,
      total: input.total,
      items: { create: input.items },
    },
    include: { items: true },
  });
}

export function listReceiptsByUser(userId: string, params: { skip?: number; take?: number }) {
  return prisma.receipt.findMany({
    where: { userId },
    include: { items: true },
    orderBy: { date: "desc" },
    ...params,
  });
}
```

## 3a. Route Handler — dipakai kalau butuh HTTP endpoint eksplisit (upload file, webhook, polling)
```ts
// app/api/receipts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createReceiptSchema } from "@/lib/validations/receipt";
import { createReceipt } from "@/lib/services/receipt";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: { message: "Unauthorized" } }, { status: 401 });
  }

  const parsed = createReceiptSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: { message: "Validasi gagal", issues: parsed.error.flatten() } }, { status: 400 });
  }

  const receipt = await createReceipt(session.user.id, parsed.data);
  return NextResponse.json({ data: receipt }, { status: 201 });
}
```

## 3b. Server Action — default untuk mutasi dari form internal
```ts
// app/(dashboard)/receipts/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { createReceiptSchema } from "@/lib/validations/receipt";
import { createReceipt } from "@/lib/services/receipt";

export async function createReceiptAction(input: unknown) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const parsed = createReceiptSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, errors: parsed.error.flatten() };
  }

  const receipt = await createReceipt(session.user.id, parsed.data);
  revalidatePath("/receipts");
  return { success: true as const, data: receipt };
}
```

## 4. Job OCR async — Trigger.dev, TIDAK sinkron di route handler
```ts
// trigger/process-receipt-ocr.ts
import { task } from "@trigger.dev/sdk/v3";
import { prisma } from "@/lib/prisma";
import { extractReceiptWithClaude } from "@/lib/services/ocr";

export const processReceiptOcr = task({
  id: "process-receipt-ocr",
  run: async (payload: { receiptId: string; imageKey: string }) => {
    const ocrRaw = await extractReceiptWithClaude(payload.imageKey);
    await prisma.receipt.update({
      where: { id: payload.receiptId },
      data: { ocrRaw, status: "DONE" },
    });
    return { receiptId: payload.receiptId };
  },
});
```

## 5. Client — trigger job lalu polling status (TanStack Query)
```tsx
const { data } = useQuery({
  queryKey: ["receipt-job", jobId],
  queryFn: () => fetch(`/api/jobs/${jobId}`).then((r) => r.json()),
  refetchInterval: (query) => (query.state.data?.status === "done" ? false : 2000),
});
```

## Aturan Reuse
Terapkan pola yang sama (Zod schema → service layer → Route Handler tipis / Server Action tipis) untuk semua modul: Workspace, Category, Subscription/Billing, Export. Jangan taruh logika Prisma langsung di Route Handler atau Server Action.
