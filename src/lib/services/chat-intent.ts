import { GoogleGenAI, Type } from "@google/genai";
import { env } from "@/lib/env";
import { CHAT_INTENTS, chatIntentSchema, type ChatIntent } from "@/lib/validations/chat";

const MONTHS: [RegExp, number][] = [
  [/\b(januari|jan)\b/, 1],
  [/\b(februari|pebruari|feb)\b/, 2],
  [/\b(maret|mar)\b/, 3],
  [/\b(april|apr)\b/, 4],
  [/\bmei\b/, 5],
  [/\b(juni|jun)\b/, 6],
  [/\b(juli|jul)\b/, 7],
  [/\b(agustus|agu|agt|ags)\b/, 8],
  [/\b(september|sept|sep)\b/, 9],
  [/\b(oktober|okt)\b/, 10],
  [/\b(november|nopember|nov)\b/, 11],
  [/\b(desember|des)\b/, 12],
];

const BILL_NO_PATTERN = /(?:\b(?:no|nomor|nomer|nmr)\b\.?\s*[:.]?\s*#?|#)\s*([a-z0-9][a-z0-9\-/]*)/i;
const AMOUNT_PATTERN = /(rp\.?\s*)?(\d{1,3}(?:[.,]\d{3})+|\d+(?:[.,]\d+)?)\s*(rb|ribu|k|jt|juta)?\b/gi;
const UNPAID_PATTERN = /\b(belum|blm|belom)\s*(lunas|dibayar|dibayarkan|bayar|terbayar)\b/;
const PAID_PATTERN = /\b(lunas|dibayar|terbayar|paid|beres)\b/;
const REPORT_PATTERN = /\b(laporan|lapor|rekap|rekapan|report|ringkasan)\b/;
const LIST_VERB_PATTERN = /\b(daftar|list|lihat|tampilkan|cek|apa\s+(aja|saja)|mana\s+(aja|saja)|berapa)\b/;
const BILL_NOUN_PATTERN = /\b(tagihan|hutang|utang|bill)\b/;
const HELP_PATTERN = /^\/(start|help)\b|\b(bantuan|help|bisa\s+apa|cara\s+pakai)\b/;

const UNIT_MULTIPLIER: Record<string, number> = { rb: 1e3, ribu: 1e3, k: 1e3, jt: 1e6, juta: 1e6 };

export function extractAmount(text: string) {
  for (const match of text.matchAll(AMOUNT_PATTERN)) {
    const [, rupiahPrefix, raw, unit] = match;
    const hasThousandSeparator = /^\d{1,3}([.,]\d{3})+$/.test(raw);

    if (unit) return Math.round(parseFloat(raw.replace(",", ".")) * UNIT_MULTIPLIER[unit.toLowerCase()]);
    if (hasThousandSeparator) return Number(raw.replace(/[.,]/g, ""));

    const value = Number(raw.replace(",", "."));
    // Tanpa "rp"/satuan, angka kecil atau mirip tahun lebih mungkin nomor/tanggal daripada nominal.
    const looksLikeYear = value >= 2000 && value <= 2100;
    if (rupiahPrefix || (value >= 1000 && !looksLikeYear)) return value;
  }
  return null;
}

function extractPeriod(text: string, now: Date) {
  let year = now.getFullYear();
  let month: number | null = null;

  const explicitYear = text.match(/\b(20\d{2})\b/);
  if (explicitYear) year = Number(explicitYear[1]);
  else if (/\btahun\s+(lalu|kemarin)\b/.test(text)) year -= 1;

  if (/\bbulan\s+ini\b/.test(text)) {
    month = now.getMonth() + 1;
  } else if (/\bbulan\s+(lalu|kemarin)\b/.test(text)) {
    const previous = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    month = previous.getMonth() + 1;
    year = previous.getFullYear();
  } else {
    month = MONTHS.find(([pattern]) => pattern.test(text))?.[1] ?? null;
  }

  return { year, month };
}

function extractVendor(text: string) {
  const match = text.match(/\btagihan\s+([a-z][a-z\s.&-]{1,40}?)(?=\s+(?:no\b|nomor|nomer|#|rp|\d|belum|blm|belom))/i);
  const vendor = match?.[1].trim();
  return vendor && !/^(no|nomor|nomer|yang|ini|itu)$/i.test(vendor) ? vendor : null;
}

/** Fallback deterministik saat Gemini tidak tersedia — mencakup pola perintah yang didokumentasikan di PRD §4.3. */
export function parseChatIntentWithRules(input: string, now = new Date()): ChatIntent {
  const text = input.trim().toLowerCase();
  const billNoMatch = input.match(BILL_NO_PATTERN);
  const billNo = billNoMatch?.[1] ?? null;
  const withoutBillNo = billNoMatch ? input.replace(billNoMatch[0], " ") : input;

  const base: ChatIntent = { intent: "unknown", billNo, vendor: null, amount: null, year: null, month: null };

  if (HELP_PATTERN.test(text)) return { ...base, intent: "help" };
  if (REPORT_PATTERN.test(text)) return { ...base, intent: "report", billNo: null, ...extractPeriod(text, now) };
  if (!billNo && BILL_NOUN_PATTERN.test(text) && LIST_VERB_PATTERN.test(text)) return { ...base, intent: "list_bills" };

  if (UNPAID_PATTERN.test(text)) {
    const amount = extractAmount(withoutBillNo);
    return amount !== null
      ? { ...base, intent: "create_bill", amount, vendor: extractVendor(input) }
      : { ...base, intent: "mark_unpaid" };
  }
  if (PAID_PATTERN.test(text)) return { ...base, intent: "mark_paid" };

  return base;
}

const INTENT_SYSTEM_PROMPT = [
  "Kamu adalah parser perintah untuk asisten keuangan StrukScan. Ubah pesan user (Bahasa Indonesia informal) jadi JSON.",
  "Intent:",
  "- mark_unpaid: user bilang struk/tagihan BELUM lunas/belum dibayar (mis. 'ini belum lunas', 'no 32 belum dibayar').",
  "- create_bill: user mencatat tagihan baru BELUM lunas yang menyebut nominal, biasanya tanpa struk (mis. 'tagihan listrik no INV-88 350rb belum lunas').",
  "- mark_paid: user bilang tagihan SUDAH lunas/dibayar (mis. 'tagihan no 32 dah lunas yah').",
  "- list_bills: user minta daftar tagihan yang belum lunas.",
  "- report: user minta laporan/rekap pengeluaran.",
  "- help: user tanya cara pakai.",
  "- unknown: selain itu.",
  "Aturan field:",
  "- billNo: nomor tagihan/struk persis seperti ditulis user (tanpa kata 'no'/'#'), null kalau tidak disebut.",
  "- vendor: nama toko/penagih kalau disebut, null kalau tidak.",
  "- amount: nominal rupiah sebagai angka polos (350rb = 350000, 1,5jt = 1500000), null kalau tidak disebut.",
  "- year & month: hanya untuk report. 'akhir tahun'/'tahunan' berarti setahun penuh (month null).",
  "  Pakai tanggal hari ini untuk 'tahun ini', 'tahun lalu', 'bulan ini', 'bulan lalu'. Selain report isi null.",
].join("\n");

const GEMINI_INTENT_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    intent: { type: Type.STRING, enum: [...CHAT_INTENTS] },
    billNo: { type: Type.STRING, nullable: true },
    vendor: { type: Type.STRING, nullable: true },
    amount: { type: Type.NUMBER, nullable: true },
    year: { type: Type.INTEGER, nullable: true },
    month: { type: Type.INTEGER, nullable: true },
  },
  required: ["intent", "billNo", "vendor", "amount", "year", "month"],
};

function isGeminiConfigured() {
  return Boolean(env.GEMINI_API_KEY && !env.GEMINI_API_KEY.startsWith("placeholder"));
}

export async function parseChatIntent(text: string, now = new Date()): Promise<ChatIntent> {
  if (!isGeminiConfigured()) return parseChatIntentWithRules(text, now);

  try {
    const client = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [{ role: "user", parts: [{ text }] }],
      config: {
        systemInstruction: `${INTENT_SYSTEM_PROMPT}\nTanggal hari ini: ${now.toISOString().slice(0, 10)}.`,
        responseMimeType: "application/json",
        responseSchema: GEMINI_INTENT_SCHEMA,
      },
    });

    const parsed = chatIntentSchema.safeParse(JSON.parse(response.text ?? ""));
    if (!parsed.success) return parseChatIntentWithRules(text, now);

    const intent = parsed.data;
    if (intent.intent === "report" && intent.year === null) intent.year = now.getFullYear();
    return intent;
  } catch (err) {
    console.warn("Gemini intent parsing failed, falling back to rules:", err);
    return parseChatIntentWithRules(text, now);
  }
}
