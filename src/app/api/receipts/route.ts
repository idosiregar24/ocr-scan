import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createReceiptSchema, listReceiptsQuerySchema } from "@/lib/validations/receipt";
import { createReceipt, listReceiptsByUser, consumeReceiptQuota, QuotaExceededError } from "@/lib/services/receipt";
import { toReceiptDTO } from "@/lib/dto/receipt";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: { message: "Unauthorized" } }, { status: 401 });
  }

  const parsed = listReceiptsQuerySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) {
    return NextResponse.json({ error: { message: "Query tidak valid", issues: parsed.error.flatten() } }, { status: 400 });
  }

  const receipts = await listReceiptsByUser(session.user.id, parsed.data);
  return NextResponse.json({ data: receipts.map(toReceiptDTO) });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: { message: "Unauthorized" } }, { status: 401 });
  }

  const parsed = createReceiptSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: { message: "Validasi gagal", issues: parsed.error.flatten() } }, { status: 400 });
  }

  try {
    await consumeReceiptQuota(session.user.id);
  } catch (err) {
    if (err instanceof QuotaExceededError) {
      return NextResponse.json({ error: { message: err.message, code: "QUOTA_EXCEEDED" } }, { status: 402 });
    }
    throw err;
  }

  const receipt = await createReceipt(session.user.id, parsed.data);
  // TODO: trigger job Trigger.dev `process-receipt-ocr` di sini (lihat nextjs-server-action-skill.md §4) — OCR tidak boleh sinkron.
  return NextResponse.json({ data: toReceiptDTO(receipt) }, { status: 201 });
}
