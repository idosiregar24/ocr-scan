import { GoogleGenAI, Type, FinishReason } from "@google/genai";
import { createWorker } from "tesseract.js";
import sharp from "sharp";
import { z } from "zod";
import { env } from "@/lib/env";

export class OcrNotConfiguredError extends Error {
  constructor() {
    super("Engine OCR belum dikonfigurasi");
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
  /** Nama field yang nilainya terisi tapi hasil tebakan/heuristik lemah — UI menandainya untuk direview manual. */
  lowConfidenceFields: z.array(z.string()).default([]),
});

export type OcrResult = z.infer<typeof ocrResultSchema>;

export function parseReceiptText(text: string): OcrResult {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  // Field yang lolos regex tapi lewat jalur heuristik paling lemah dikumpulkan di sini.
  const lowConfidenceFields: string[] = [];

  // --- 1. Parser Angka Rupiah Presisi ---
  // Menangani "24.500,00", "Rp 70.000", "75.400", "4,900", "*8500", "(2,000)"
  const parseAmount = (str: string | null | undefined): number | null => {
    if (!str) return null;
    let s = str.trim().replace(/^[\*\#\+\:\s]+/, "");
    s = s.replace(/rp\.?/gi, "").trim();
    // Hilangkan desimal sen ,00 atau .00 di akhir
    if (/[,.]00$/.test(s)) {
      s = s.slice(0, -3);
    }
    const digits = s.replace(/[^0-9]/g, "");
    if (!digits) return null;
    const num = parseInt(digits, 10);
    return isNaN(num) ? null : num;
  };

  // --- 2. Nama Toko Pintar ---
  let storeName: string | null = null;
  const STORE_INDICATORS =
    /\b(toko|shop|store|mart|apotek|warung|waroeng|resto|restoran|cafe|kafe|bakery|supermarket|minimarket|indomaret|alfamart|superindo|hypermart)\b/i;
  const STORE_BLOCKLIST =
    /^(jl|jln|jalan|telp|phone|hp|no\.|rt\.|rw\.|tanggal|date|transaksi|operator|http|www|\d{4,}|\={3,}|\-{3,}|\_{3,}|terima|selamat|kasir|cashier)/i;

  const cleanStoreCandidate = (l: string) => {
    return l
      .replace(/^[^a-zA-Z0-9]+/, "")
      .replace(/[^a-zA-Z0-9\s"'\.\-]+$/, "")
      .replace(/\b(08\d{8,12}|\+?62\d{8,12}|\d{10,14})\b/g, "")
      .replace(/[\|\_\~]/g, "")
      .replace(/\s+(we\s+NT|Sth|etc)\b/gi, "")
      .replace(/\bWALANG\b/i, "MALANG")
      .replace(/\bWARDENG\b/i, "WAROENG")
      .replace(/\s+[©®™].*$/g, "")
      .replace(/\s+[a-z]\b$/gi, "")
      .replace(/[\s\-_]+$/, "")
      .trim();
  };

  // Prioritas 1: Baris yang mengandung kata indikator toko (Toko, Shop, Apotek, Waroeng, dll)
  for (let i = 0; i < Math.min(lines.length, 8); i++) {
    const raw = lines[i];
    if (STORE_INDICATORS.test(raw) && !STORE_BLOCKLIST.test(raw)) {
      const candidate = cleanStoreCandidate(raw);
      if (candidate.length >= 3) {
        storeName = candidate;
        break;
      }
    }
  }

  // Prioritas 2: Baris awal dengan kata substansial (bukan noise singkat)
  if (!storeName) {
    for (let i = 0; i < Math.min(lines.length, 8); i++) {
      const raw = lines[i];
      const candidate = cleanStoreCandidate(raw);
      if (STORE_BLOCKLIST.test(candidate)) continue;

      const letters = candidate.replace(/[^a-zA-Z]/g, "");
      if (letters.length < 4) continue;

      const words = candidate.split(/\s+/).filter((w) => w.replace(/[^a-zA-Z]/g, "").length >= 2);
      if (words.length >= 2 || (words.length === 1 && letters.length >= 5)) {
        storeName = candidate;
        // Tidak ada kata indikator toko (Toko/Mart/dll) — hanya tebakan dari baris awal.
        lowConfidenceFields.push("storeName");
        break;
      }
    }
  }

  // --- 3. Tanggal (YYYY-MM-DD, DD-MM-YYYY, atau DD.MM.YY khas Indomaret) ---
  let date: string | null = null;
  const mYMD = text.match(/\b(20\d{2})[-/.](0[1-9]|1[0-2])[-/.](0[1-9]|[12]\d|3[01])\b/);
  const mDMY = text.match(/\b(0[1-9]|[12]\d|3[01])[-/.](0[1-9]|1[0-2])[-/.](20\d{2})\b/);
  const mShort = text.match(/\b(0[1-9]|[12]\d|3[01])\.(0[1-9]|1[0-2])\.(2[0-9])\b/);

  if (mYMD) {
    date = `${mYMD[1]}-${mYMD[2]}-${mYMD[3]}`;
  } else if (mDMY) {
    date = `${mDMY[3]}-${mDMY[2]}-${mDMY[1]}`;
  } else if (mShort) {
    date = `20${mShort[3]}-${mShort[2]}-${mShort[1]}`;
  }

  // --- 4. No Struk & Kasir ---
  let receiptNo: string | null = null;
  const noMatch = text.match(/(?:no\.?|resi|struk|transaksi|trx)[:\s~]*([a-zA-Z0-9\-_/]+)/i);
  if (noMatch && noMatch[1].length >= 2) receiptNo = noMatch[1];

  let cashier: string | null = null;
  const cashierMatch = text.match(/(?:kasir|cashier|operator)[:\s~]*([a-zA-Z0-9\s\(\)]+)/i);
  if (cashierMatch) cashier = cashierMatch[1].trim();

  // --- 5. Metode Bayar ---
  let paymentMethod: string | null = null;
  if (/tunai|cash/i.test(text)) paymentMethod = "Tunai";
  else if (/qris/i.test(text)) paymentMethod = "QRIS";
  else if (/debit/i.test(text)) paymentMethod = "Debit";
  else if (/kredit|credit/i.test(text)) paymentMethod = "Kartu Kredit";
  else if (/transfer/i.test(text)) paymentMethod = "Transfer";

  // --- 6. Total, Subtotal, Diskon, Pajak ---
  let subtotal: number | null = null;
  let discount: number | null = null;
  let tax: number | null = null;
  let total: number | null = null;

  for (const line of lines) {
    // Total / Grand Total (mendukung TOTAL : 75.400, TOTAL + 75.400, ***TOTAL *31000, dll)
    if (/(?:grand\s*)?total/i.test(line) && !/total\s*qty/i.test(line)) {
      const match = line.match(/(?:total)[\s\:\+\*\#\=~]*(?:rp\.?)?\s*([0-9\.,]+)/i);
      if (match) {
        const amt = parseAmount(match[1]);
        if (amt && (!total || amt > 100)) total = amt;
      }
    }
    // Subtotal / Harga Jual
    if (/sub\s*total|harga\s*jual/i.test(line)) {
      const match = line.match(/(?:sub\s*total|harga\s*jual)[\s\:\+\*\#\=~]*(?:rp\.?)?\s*([0-9\.,]+)/i);
      if (match) {
        const amt = parseAmount(match[1]);
        if (amt) subtotal = amt;
      }
    }
    // Diskon / Anda Hemat
    if (/diskon|discount|potongan|anda\s*hemat/i.test(line)) {
      const match = line.match(/(?:diskon|discount|potongan|anda\s*hemat)[\s\:\+\*\#\=~]*(?:rp\.?)?\s*\(?([0-9\.,]+)\)?/i);
      if (match) {
        const amt = parseAmount(match[1]);
        if (amt) discount = amt;
      }
    }
    // Pajak / PPN
    if (/pajak|ppn|tax/i.test(line) && !/layanan/i.test(line)) {
      const match = line.match(/(?:pajak|ppn|tax)[\s\:\+\*\#\=~]*(?:rp\.?)?\s*([0-9\.,]+)/i);
      if (match) {
        const amt = parseAmount(match[1]);
        if (amt) tax = amt;
      }
    }
  }

  // --- 7. Ekstraksi Item Belanja ---
  const items: Array<{ name: string; qty: number; unitPrice: number }> = [];
  const stopKeywords =
    /^(sub\s*total|total|bayar|kembali|cash|tunai|layanan\s*konsumen|terima\s*kasih|barang\s*yang|history|tipe\s*:|sisa\s*limit|status\s*:)/i;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (stopKeywords.test(line)) continue;

    // Pola A: Format 1 baris Indomaret/Alfamart
    // Contoh: "POP MIE AYAM 75G 1 4900 4,900" atau "NESTLE PURE LIFE 600 2 3600 7,200"
    const indoMatch = line.match(/^(.+?)\s+(\d{1,2})\s+([0-9\.,]{3,8})\s+([0-9\.,]{3,8})$/);
    if (indoMatch && !stopKeywords.test(indoMatch[1])) {
      const itemName = indoMatch[1].replace(/^\d+[\.\-\s]+/, "").trim();
      const qty = parseInt(indoMatch[2], 10);
      const unitPrice = parseAmount(indoMatch[3]);
      if (unitPrice && unitPrice >= 100 && itemName.length >= 2) {
        items.push({
          name: itemName,
          qty: isNaN(qty) ? 1 : qty,
          unitPrice,
        });
        continue;
      }
    }

    // Pola B: Format 2 baris (Baris 1 nama, Baris 2 qty x harga)
    // Contoh: "1 lusin x 36,000 Rp 36.000", "1 500 ml x 7,000", "1 x 80.000", "1,00 x 24.500,00"
    const qtyXMatch = line.match(/^(\d+(?:[,\.]\d+)?)\s*(?:[a-zA-Z\s]{0,8})\s*[xX*]\s*([0-9\.,]+)(?:\s*(?:rp\.?)?\s*([0-9\.,]+))?/);
    if (qtyXMatch && i > 0) {
      const prevLine = lines[i - 1];
      if (!stopKeywords.test(prevLine) && !prevLine.match(/^\d{2,4}[-\/\.]/) && prevLine.length >= 3) {
        const cleanName = prevLine.replace(/^\d+[\.\-\s]+/, "").trim();
        const qtyNum = parseFloat(qtyXMatch[1].replace(",", "."));
        const unitPrice = parseAmount(qtyXMatch[2]);
        // Hindari satuan volume seperti 500 ml dianggap qty 500
        const sanitizedQty = qtyNum > 100 ? 1 : Math.max(1, Math.round(qtyNum));
        if (unitPrice && unitPrice >= 100) {
          items.push({
            name: cleanName,
            qty: sanitizedQty,
            unitPrice,
          });
          continue;
        }
      }
    }

    // Pola C: Format Warung / Rumah Makan: "AYAM GRG DADA *8500" atau "TUMIS KANGKUNG 3500"
    const warungMatch = line.match(/^([a-zA-Z\s\/\.\-]+?)\s+[\*\#]?\s*([0-9\.,]{4,8})$/);
    if (warungMatch && !stopKeywords.test(warungMatch[1])) {
      const name = warungMatch[1].trim();
      const price = parseAmount(warungMatch[2]);
      if (price && price >= 500 && name.length >= 3 && !/^(items|dpp|ppn|telp|bayar|total)/i.test(name)) {
        // Pola paling longgar (cocok ke hampir semua "teks angka") — rawan salah pisah baris/harga.
        lowConfidenceFields.push(`items.${items.length}`);
        items.push({
          name,
          qty: 1,
          unitPrice: price,
        });
      }
    }
  }

  if (!subtotal && total) subtotal = total;
  if (!total && items.length > 0) {
    // Tidak ada baris TOTAL yang terbaca — diturunkan dari penjumlahan item, bisa meleset kalau ada item yang tidak tertangkap.
    total = items.reduce((sum, item) => sum + item.qty * item.unitPrice, 0);
    lowConfidenceFields.push("total");
  }
  if (!subtotal && items.length > 0) {
    subtotal = total;
  }

  return {
    storeName,
    date,
    receiptNo,
    cashier,
    paymentMethod,
    subtotal,
    discount,
    tax,
    total,
    items,
    lowConfidenceFields: [...new Set(lowConfidenceFields)],
  };
}

export async function extractReceiptWithTesseract(image: Buffer): Promise<OcrResult> {
  let worker;
  try {
    // 1. Preprocess gambar dengan sharp: grayscale + normalize + resize untuk mempercepat OCR drastis
    let processedImage: Buffer;
    try {
      processedImage = await sharp(image)
        .resize({ width: 1200, height: 1600, fit: "inside", withoutEnlargement: true })
        .grayscale()
        .normalize()
        .sharpen()
        .toBuffer();
    } catch {
      processedImage = image;
    }

    // 2. Buat worker terisolasi untuk request ini — "ind" wajib ikut karena struk lokal
    // campur kata Indonesia (TOTAL, TUNAI, DISKON) dan nama produk/brand berbahasa Inggris.
    worker = await createWorker("eng+ind");
    const { data } = await worker.recognize(processedImage);
    if (!data.text || data.text.trim().length === 0) {
      throw new OcrFailedError("Teks pada foto struk tidak terbaca — coba foto ulang dengan pencahayaan lebih terang");
    }
    return parseReceiptText(data.text);
  } catch (err) {
    if (err instanceof OcrFailedError) throw err;
    console.error("Tesseract OCR extraction error:", err);
    throw new OcrFailedError("Gagal memproses struk dengan OCR lokal");
  } finally {
    if (worker) {
      await worker.terminate();
    }
  }
}

const SYSTEM_PROMPT = [
  "Kamu membaca foto struk belanja Indonesia dan mengubahnya jadi data terstruktur.",
  "Aturan:",
  "- Nominal selalu angka rupiah polos tanpa pemisah ribuan dan tanpa simbol (12500, bukan 'Rp 12.500').",
  "- qty default 1 kalau struk tidak mencantumkannya; unitPrice adalah harga SATUAN, bukan harga baris.",
  "- date pakai format ISO YYYY-MM-DD. Struk Indonesia umumnya DD/MM/YYYY atau DD-MM-YY — urutannya hari dulu.",
  "- discount dan tax bernilai positif (besaran potongan/pajak), bukan negatif.",
  "- Field yang benar-benar tidak terbaca atau tidak tercetak di struk diisi null, jangan dikarang.",
  "- Lewati baris non-item seperti SUBTOTAL, TOTAL, TUNAI, KEMBALI, PPN, dan header/footer toko.",
  "- lowConfidenceFields: daftar nama field yang KAMU ISI (bukan null) tapi kamu tidak yakin benar",
  "  (foto buram/terpotong/tertutup, tulisan ambigu, atau angka yang kamu tebak). Pakai nama field",
  "  persis seperti skema (storeName, date, total, dst), untuk item pakai 'items.<index>' (mis. 'items.0').",
  "  Kosongkan array ini kalau semua yang terisi memang jelas terbaca.",
].join("\n");

// Schema respons dalam format Gemini (subset OpenAPI) — dijaga manual selaras dengan ocrResultSchema
// karena SDK ini tidak punya konverter Zod->schema bawaan seperti zodOutputFormat di Anthropic SDK.
const GEMINI_RESULT_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    storeName: { type: Type.STRING, nullable: true },
    date: { type: Type.STRING, nullable: true, description: "Format ISO YYYY-MM-DD" },
    receiptNo: { type: Type.STRING, nullable: true },
    cashier: { type: Type.STRING, nullable: true },
    paymentMethod: { type: Type.STRING, nullable: true },
    subtotal: { type: Type.NUMBER, nullable: true },
    discount: { type: Type.NUMBER, nullable: true },
    tax: { type: Type.NUMBER, nullable: true },
    total: { type: Type.NUMBER, nullable: true },
    items: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          qty: { type: Type.NUMBER },
          unitPrice: { type: Type.NUMBER },
        },
        required: ["name", "qty", "unitPrice"],
      },
    },
    lowConfidenceFields: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Nama field yang terisi tapi tidak yakin benar, mis. 'storeName' atau 'items.0'.",
    },
  },
  required: [
    "storeName",
    "date",
    "receiptNo",
    "cashier",
    "paymentMethod",
    "subtotal",
    "discount",
    "tax",
    "total",
    "items",
    "lowConfidenceFields",
  ],
};

/**
 * Membaca foto struk. Jika GEMINI_API_KEY tersedia, gunakan Gemini Vision.
 * Jika tidak (mode lokal dev), otomatis menggunakan engine Tesseract.js secara offline.
 */
export async function extractReceiptWithGemini(
  image: Buffer,
  mediaType: string,
): Promise<OcrResult> {
  if (env.GEMINI_API_KEY && !env.GEMINI_API_KEY.startsWith("placeholder")) {
    const client = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
    try {
      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          {
            role: "user",
            parts: [
              { inlineData: { mimeType: mediaType, data: image.toString("base64") } },
              { text: "Baca struk ini dan keluarkan datanya." },
            ],
          },
        ],
        config: {
          systemInstruction: SYSTEM_PROMPT,
          responseMimeType: "application/json",
          responseSchema: GEMINI_RESULT_SCHEMA,
        },
      });

      const candidate = response.candidates?.[0];
      const blocked = response.promptFeedback?.blockReason != null || candidate?.finishReason === FinishReason.SAFETY;
      if (blocked) {
        throw new OcrFailedError("Gambar ditolak oleh model — pastikan yang diunggah memang foto struk");
      }
      if (!response.text) {
        throw new OcrFailedError("Struk tidak terbaca — coba foto ulang dengan cahaya lebih terang");
      }

      const parsed = ocrResultSchema.safeParse(JSON.parse(response.text));
      if (!parsed.success) {
        throw new OcrFailedError("Struk tidak terbaca — coba foto ulang dengan cahaya lebih terang");
      }

      return parsed.data;
    } catch (err) {
      if (err instanceof OcrFailedError) throw err;
      console.warn("Gemini OCR failed, falling back to local Tesseract OCR:", err);
      return extractReceiptWithTesseract(image);
    }
  }

  // Gunakan Tesseract OCR lokal secara offline
  return extractReceiptWithTesseract(image);
}

