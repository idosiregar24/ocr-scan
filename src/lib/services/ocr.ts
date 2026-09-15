import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { env } from "@/lib/env";

export class OcrNotConfiguredError extends Error {
  constructor() {
    super("ANTHROPIC_API_KEY belum diisi — isi di .env untuk mengaktifkan pembacaan otomatis");
    this.name = "OcrNotConfiguredError";
  }
}

export class OcrFailedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OcrFailedError";
  }
}

/**
 * Semua field nullable: struk belanja Indonesia sering tidak mencantumkan kasir/no. struk,
 * dan hasil parsial tetap lebih berguna untuk direview user daripada job gagal total.
 */
export const ocrResultSchema = z.object({
  storeName: z.string().nullable(),
  date: z.string().nullable(),
  receiptNo: z.string().nullable(),
  cashier: z.string().nullable(),
  paymentMethod: z.string().nullable(),
  subtotal: z.number().nullable(),
  discount: z.number().nullable(),
  tax: z.number().nullable(),
  total: z.number().nullable(),
  items: z.array(
    z.object({
      name: z.string(),
      qty: z.number(),
      unitPrice: z.number(),
    }),
  ),
});

export type OcrResult = z.infer<typeof ocrResultSchema>;

const SYSTEM_PROMPT = [
  "Kamu membaca foto struk belanja Indonesia dan mengubahnya jadi data terstruktur.",
  "Aturan:",
  "- Nominal selalu angka rupiah polos tanpa pemisah ribuan dan tanpa simbol (12500, bukan 'Rp 12.500').",
  "- qty default 1 kalau struk tidak mencantumkannya; unitPrice adalah harga SATUAN, bukan harga baris.",
  "- date pakai format ISO YYYY-MM-DD. Struk Indonesia umumnya DD/MM/YYYY atau DD-MM-YY — urutannya hari dulu.",
  "- discount dan tax bernilai positif (besaran potongan/pajak), bukan negatif.",
  "- Field yang benar-benar tidak terbaca atau tidak tercetak di struk diisi null, jangan dikarang.",
  "- Lewati baris non-item seperti SUBTOTAL, TOTAL, TUNAI, KEMBALI, PPN, dan header/footer toko.",
].join("\n");

/**
 * Dipanggil hanya dari job queue, tidak pernah dari request-response cycle (lihat backend-standards.md).
 * Melempar OcrNotConfiguredError/OcrFailedError supaya job bisa memetakannya ke status receipt.
 */
export async function extractReceiptWithClaude(
  image: Buffer,
  mediaType: string,
): Promise<OcrResult> {
  if (!env.ANTHROPIC_API_KEY || env.ANTHROPIC_API_KEY.startsWith("placeholder")) {
    throw new OcrNotConfiguredError();
  }

  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

  try {
    const response = await client.messages.parse({
      model: "claude-opus-5",
      max_tokens: 8000,
      system: SYSTEM_PROMPT,
      output_config: {
        effort: "medium",
        format: zodOutputFormat(ocrResultSchema),
      },
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType as "image/jpeg" | "image/png" | "image/webp",
                data: image.toString("base64"),
              },
            },
            { type: "text", text: "Baca struk ini dan keluarkan datanya." },
          ],
        },
      ],
    });

    if (response.stop_reason === "refusal") {
      throw new OcrFailedError("Gambar ditolak oleh model — pastikan yang diunggah memang foto struk");
    }
    if (!response.parsed_output) {
      throw new OcrFailedError("Struk tidak terbaca — coba foto ulang dengan cahaya lebih terang");
    }

    return response.parsed_output;
  } catch (err) {
    if (err instanceof OcrFailedError || err instanceof OcrNotConfiguredError) throw err;
    if (err instanceof Anthropic.AuthenticationError) {
      throw new OcrNotConfiguredError();
    }
    if (err instanceof Anthropic.RateLimitError) {
      throw new OcrFailedError("Antrean OCR sedang penuh — coba lagi sebentar lagi");
    }
    if (err instanceof Anthropic.APIError) {
      throw new OcrFailedError(`Layanan OCR bermasalah (${err.status})`);
    }
    throw new OcrFailedError("Struk gagal diproses");
  }
}
