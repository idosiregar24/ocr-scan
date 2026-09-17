import { prepareReceiptImage } from "@/lib/services/image";
import { buildReceiptImageKey, putObject } from "@/lib/storage";
import { consumeReceiptQuota, createPendingReceipt, refundReceiptQuota } from "@/lib/services/receipt";

/**
 * Langkah sinkron sebelum OCR: potong kuota, resize, simpan foto, buat struk PENDING.
 * Pemanggil yang memilih job lanjutan (OCR biasa atau OCR + balasan chat).
 */
export async function startReceiptScan(userId: string, original: Buffer) {
  await consumeReceiptQuota(userId);

  try {
    const prepared = await prepareReceiptImage(original);
    const imageKey = buildReceiptImageKey(userId, prepared.contentType);
    await putObject(imageKey, prepared.body, prepared.contentType);
    return await createPendingReceipt(userId, imageKey);
  } catch (err) {
    // Kuota sudah terpotong tapi struk tidak jadi dibuat — kembalikan supaya user tidak dirugikan.
    await refundReceiptQuota(userId);
    throw err;
  }
}
