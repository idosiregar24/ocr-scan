import { after } from "next/server";
import { prisma } from "@/lib/prisma";
import { getObject } from "@/lib/storage";
import { extractReceiptWithClaude, OcrFailedError, OcrNotConfiguredError } from "@/lib/services/ocr";
import { applyOcrResult, markReceiptFailed } from "@/lib/services/receipt";

export type ReceiptOcrPayload = { receiptId: string };

/**
 * Klaim job secara atomik: hanya request yang berhasil memindahkan PENDING -> PROCESSING
 * yang boleh memanggil Claude, jadi retry/dispatch ganda tidak menghasilkan data dobel.
 */
async function claimReceipt(receiptId: string) {
  const claimed = await prisma.receipt.updateMany({
    where: { id: receiptId, status: "PENDING" },
    data: { status: "PROCESSING" },
  });
  return claimed.count === 1;
}

export async function runReceiptOcrJob({ receiptId }: ReceiptOcrPayload) {
  if (!(await claimReceipt(receiptId))) return;

  try {
    const receipt = await prisma.receipt.findUniqueOrThrow({ where: { id: receiptId } });
    const image = await getObject(receipt.imageKey);
    if (!image) throw new OcrFailedError("Foto struk tidak ditemukan di storage");

    const result = await extractReceiptWithClaude(image.body, image.contentType);
    await applyOcrResult(receiptId, result);
  } catch (err) {
    const reason =
      err instanceof OcrNotConfiguredError || err instanceof OcrFailedError
        ? err.message
        : "Struk gagal diproses";
    await markReceiptFailed(receiptId, reason);
  }
}

/**
 * Seam ke job queue. `after()` menjalankan OCR setelah response terkirim, jadi POST /api/scan
 * tidak pernah menunggu Claude. Ganti isi fungsi ini dengan `tasks.trigger("process-receipt-ocr", payload)`
 * saat TRIGGER_SECRET_KEY sudah tersedia — pemanggilnya tidak perlu berubah.
 */
export function enqueueReceiptOcr(payload: ReceiptOcrPayload) {
  after(() => runReceiptOcrJob(payload));
}
