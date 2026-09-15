import { describe, expect, it } from "vitest";
import { formatIDR, formatDate } from "./format";

// Node ICU kadang pakai narrow no-break space (U+202F) antara "Rp" dan angka — normalisasi dulu
// sebelum dibandingkan supaya test tidak fragile terhadap versi ICU.
const normalizeSpaces = (s: string) => s.replace(/\s/g, " ");

describe("formatIDR", () => {
  it("format angka jadi Rupiah tanpa desimal", () => {
    expect(normalizeSpaces(formatIDR(18000))).toBe("Rp 18.000");
  });

  it("format 0 tetap tampil Rp 0, bukan string kosong", () => {
    expect(normalizeSpaces(formatIDR(0))).toBe("Rp 0");
  });
});

describe("formatDate", () => {
  it("return '-' untuk tanggal null/undefined", () => {
    expect(formatDate(null)).toBe("-");
    expect(formatDate(undefined)).toBe("-");
  });
});
