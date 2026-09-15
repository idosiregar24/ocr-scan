import { z } from "zod";

export const MAX_RECEIPT_IMAGE_BYTES = 10 * 1024 * 1024;

// HEIC ikut diterima karena default kamera iPhone; dikonversi saat resize di service.
export const ACCEPTED_IMAGE_MIME = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
] as const;

export const scanUploadSchema = z.object({
  image: z
    .file()
    .max(MAX_RECEIPT_IMAGE_BYTES, "Ukuran foto maksimal 10 MB")
    .mime([...ACCEPTED_IMAGE_MIME], "Format harus JPG, PNG, WEBP, atau HEIC"),
});

export type ScanUploadInput = z.infer<typeof scanUploadSchema>;
