import { describe, expect, it } from "vitest";
import { quotaRemaining } from "./plan";

describe("quotaRemaining", () => {
  it("menghitung sisa kuota Free yang belum habis", () => {
    expect(quotaRemaining("FREE", 5)).toBe(15);
  });

  it("tidak pernah negatif saat quotaUsed melebihi limit", () => {
    expect(quotaRemaining("FREE", 999)).toBe(0);
  });

  it("mengembalikan null untuk plan Business (unlimited)", () => {
    expect(quotaRemaining("BIZ", 1000)).toBeNull();
  });
});
