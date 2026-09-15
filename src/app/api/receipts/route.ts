import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { listReceiptsQuerySchema } from "@/lib/validations/receipt";
import { listReceiptsByUser } from "@/lib/services/receipt";
import { toReceiptDTO } from "@/lib/dto/receipt";

export const runtime = "nodejs";

/**
 * Pembuatan struk hanya lewat POST /api/scan (upload foto -> job OCR); endpoint ini read-only
 * supaya tidak ada jalur kedua yang memotong kuota tanpa melewati pipeline OCR.
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, { status: 401 });
  }

  const parsed = listReceiptsQuerySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) {
    return NextResponse.json(
      { error: { message: "Query tidak valid", code: "VALIDATION_FAILED", issues: parsed.error.flatten() } },
      { status: 400 },
    );
  }

  const receipts = await listReceiptsByUser(session.user.id, parsed.data);
  return NextResponse.json({ data: receipts.map(toReceiptDTO) });
}
