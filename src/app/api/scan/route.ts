import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { scanUploadSchema } from "@/lib/validations/scan";
import { prepareReceiptImage, UnreadableImageError } from "@/lib/services/image";
import { buildReceiptImageKey, putObject, StorageNotConfiguredError } from "@/lib/storage";
import { consumeReceiptQuota, createPendingReceipt, refundReceiptQuota, QuotaExceededError } from "@/lib/services/receipt";
import { enqueueReceiptOcr } from "@/lib/jobs/receipt-ocr";
import { toReceiptDTO } from "@/lib/dto/receipt";

export const runtime = "nodejs";

const SCAN_RATE_LIMIT = { max: 12, windowSeconds: 60 };

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, { status: 401 });
  }

  const limit = rateLimit(`scan:${session.user.id}`, SCAN_RATE_LIMIT.max, SCAN_RATE_LIMIT.windowSeconds);
  if (!limit.ok) {
    return NextResponse.json(
      { error: { message: "Terlalu banyak upload — tunggu sebentar", code: "RATE_LIMITED" } },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  const formData = await req.formData();
  const parsed = scanUploadSchema.safeParse({ image: formData.get("image") });
  if (!parsed.success) {
    return NextResponse.json(
      { error: { message: "Foto struk tidak valid", code: "VALIDATION_FAILED", issues: parsed.error.flatten() } },
      { status: 400 },
    );
  }

  try {
    await consumeReceiptQuota(session.user.id);
  } catch (err) {
    if (err instanceof QuotaExceededError) {
      return NextResponse.json({ error: { message: err.message, code: "QUOTA_EXCEEDED" } }, { status: 402 });
    }
    throw err;
  }

  try {
    const original = Buffer.from(await parsed.data.image.arrayBuffer());
    const prepared = await prepareReceiptImage(original);
    const imageKey = buildReceiptImageKey(session.user.id, prepared.contentType);
    await putObject(imageKey, prepared.body, prepared.contentType);

    const receipt = await createPendingReceipt(session.user.id, imageKey);
    enqueueReceiptOcr({ receiptId: receipt.id });

    // 202: OCR masih berjalan di background, client polling GET /api/jobs/:id (PRD §5.3).
    return NextResponse.json({ data: toReceiptDTO(receipt) }, { status: 202 });
  } catch (err) {
    // Kuota sudah terpotong di atas tapi struk tidak jadi dibuat — kembalikan supaya user tidak dirugikan.
    await refundReceiptQuota(session.user.id);

    if (err instanceof UnreadableImageError) {
      return NextResponse.json({ error: { message: err.message, code: "UNREADABLE_IMAGE" } }, { status: 422 });
    }
    if (err instanceof StorageNotConfiguredError) {
      return NextResponse.json(
        { error: { message: err.message, code: "STORAGE_NOT_CONFIGURED" } },
        { status: 503 },
      );
    }
    throw err;
  }
}
