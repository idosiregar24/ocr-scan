import sharp from "sharp";

export class UnreadableImageError extends Error {
  constructor() {
    super("Foto tidak bisa dibaca — coba unggah ulang dalam format JPG atau PNG");
    this.name = "UnreadableImageError";
  }
}

// Claude Vision tidak butuh resolusi penuh kamera HP; 2000px sisi terpanjang sudah cukup untuk
// teks struk dan memangkas ukuran upload ~10x. Semua format dinormalisasi ke JPEG (termasuk HEIC).
const MAX_EDGE = 2000;
const JPEG_QUALITY = 82;

export type PreparedImage = { body: Buffer; contentType: "image/jpeg" };

export async function prepareReceiptImage(input: Buffer): Promise<PreparedImage> {
  try {
    const body = await sharp(input)
      .rotate() // hormati EXIF orientation, jika tidak struk dari kamera HP bisa tersimpan miring
      .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
      .toBuffer();

    return { body, contentType: "image/jpeg" };
  } catch {
    throw new UnreadableImageError();
  }
}
