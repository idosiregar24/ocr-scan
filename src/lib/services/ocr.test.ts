import { describe, expect, it, vi } from "vitest";

// parseReceiptText tidak menyentuh Claude API, tapi ocr.ts mengimpor `env` di top-level
// yang fail-fast tanpa .env lengkap — mock supaya test murni untuk parser lokal ini.
vi.mock("@/lib/env", () => ({ env: {} }));

const { parseReceiptText } = await import("./ocr");

describe("parseReceiptText — lowConfidenceFields", () => {
  it("tidak menandai total kalau baris TOTAL terbaca langsung dari struk", () => {
    const result = parseReceiptText(
      ["TOKO SEJAHTERA", "AYAM GORENG 15000", "TOTAL : 15000"].join("\n"),
    );

    expect(result.total).toBe(15000);
    expect(result.lowConfidenceFields).not.toContain("total");
  });

  it("menandai total sebagai low-confidence saat diturunkan dari penjumlahan item", () => {
    const result = parseReceiptText(
      ["TOKO SEJAHTERA", "AYAM GORENG 15000", "ES TEH 5000"].join("\n"),
    );

    expect(result.total).toBe(20000);
    expect(result.lowConfidenceFields).toContain("total");
  });

  it("menandai storeName saat diambil dari heuristik fallback tanpa kata indikator toko", () => {
    const result = parseReceiptText(
      ["Sejahtera Jaya Abadi", "AYAM GORENG 15000", "TOTAL : 15000"].join("\n"),
    );

    expect(result.storeName).toBe("Sejahtera Jaya Abadi");
    expect(result.lowConfidenceFields).toContain("storeName");
  });
});
