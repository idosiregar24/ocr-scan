import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env", () => ({ env: {} }));

const { extractAmount, parseChatIntent, parseChatIntentWithRules } = await import("./chat-intent");

const NOW = new Date(2026, 8, 16);

describe("parseChatIntentWithRules", () => {
  it("mengenali tandai lunas beserta nomor tagihan dari kalimat informal", () => {
    expect(parseChatIntentWithRules("tagihan no 32 dah lunas yah", NOW)).toMatchObject({
      intent: "mark_paid",
      billNo: "32",
    });
  });

  it("mengenali belum lunas tanpa nomor sebagai rujukan ke struk terakhir", () => {
    expect(parseChatIntentWithRules("ini belum lunas", NOW)).toMatchObject({ intent: "mark_unpaid", billNo: null });
  });

  it("tidak salah membaca 'belum lunas' sebagai lunas", () => {
    expect(parseChatIntentWithRules("struk nomor 0032 belum dibayar", NOW)).toMatchObject({
      intent: "mark_unpaid",
      billNo: "0032",
    });
  });

  it("membuat tagihan manual saat ada nominal", () => {
    expect(parseChatIntentWithRules("tagihan listrik no INV-88 350rb belum lunas", NOW)).toMatchObject({
      intent: "create_bill",
      billNo: "INV-88",
      vendor: "listrik",
      amount: 350000,
    });
  });

  it("laporan akhir tahun memakai tahun berjalan tanpa bulan", () => {
    expect(parseChatIntentWithRules("minta laporan akhir tahun dong", NOW)).toMatchObject({
      intent: "report",
      year: 2026,
      month: null,
    });
  });

  it("laporan dengan bulan dan tahun eksplisit", () => {
    expect(parseChatIntentWithRules("rekap maret 2025", NOW)).toMatchObject({ intent: "report", year: 2025, month: 3 });
  });

  it("bulan lalu di bulan Januari mundur ke Desember tahun sebelumnya", () => {
    expect(parseChatIntentWithRules("laporan bulan lalu", new Date(2026, 0, 10))).toMatchObject({
      year: 2025,
      month: 12,
    });
  });

  it("mengenali permintaan daftar tagihan", () => {
    expect(parseChatIntentWithRules("tagihan apa aja yang belum lunas?", NOW)).toMatchObject({ intent: "list_bills" });
  });

  it("pesan yang tidak dikenali jadi unknown", () => {
    expect(parseChatIntentWithRules("halo selamat pagi", NOW).intent).toBe("unknown");
  });
});

describe("extractAmount", () => {
  it.each([
    ["350rb", 350000],
    ["1,5jt", 1500000],
    ["Rp 75.400", 75400],
    ["bayar 125000", 125000],
  ])("membaca %s", (text, expected) => {
    expect(extractAmount(text)).toBe(expected);
  });

  it("tidak menganggap tahun atau angka kecil sebagai nominal", () => {
    expect(extractAmount("tagihan 2026 no 32")).toBeNull();
  });
});

describe("parseChatIntent", () => {
  it("memakai parser aturan saat Gemini tidak dikonfigurasi", async () => {
    await expect(parseChatIntent("tagihan no 32 lunas", NOW)).resolves.toMatchObject({ intent: "mark_paid", billNo: "32" });
  });
});
