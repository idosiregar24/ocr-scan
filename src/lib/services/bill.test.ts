import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({ prisma: {} }));

const { billNoMatches, normalizeBillNo, selectBill } = await import("./bill");

type Candidate = { id: string; status: "UNPAID" | "PAID"; vendor: string | null };

describe("normalizeBillNo", () => {
  it("mengabaikan nol di depan, #, spasi, dan huruf besar", () => {
    expect(normalizeBillNo(" #0032 ")).toBe("32");
    expect(normalizeBillNo("INV-88")).toBe("inv-88");
    expect(normalizeBillNo("000")).toBe("0");
  });

  it("tidak menyamakan nomor yang hanya mirip", () => {
    expect(billNoMatches("0032", "32")).toBe(true);
    expect(billNoMatches("132", "32")).toBe(false);
  });
});

describe("selectBill", () => {
  const indomaret: Candidate = { id: "a", status: "UNPAID", vendor: "Indomaret Pasar Baru" };
  const alfamart: Candidate = { id: "b", status: "UNPAID", vendor: "Alfamart" };
  const paidOld: Candidate = { id: "c", status: "PAID", vendor: "Alfamart" };

  it("none saat tidak ada kandidat", () => {
    expect(selectBill<Candidate>([], null, "UNPAID")).toEqual({ kind: "none" });
  });

  it("ambigu saat lebih dari satu tagihan UNPAID bernomor sama", () => {
    expect(selectBill([indomaret, alfamart], null, "UNPAID")).toEqual({ kind: "many", bills: [indomaret, alfamart] });
  });

  it("nama toko mempersempit kandidat yang ambigu", () => {
    expect(selectBill([indomaret, alfamart], "indomaret", "UNPAID")).toEqual({ kind: "one", bill: indomaret });
  });

  it("memprioritaskan status yang diminta saat nomor bentrok", () => {
    expect(selectBill([paidOld, alfamart], null, "UNPAID")).toEqual({ kind: "one", bill: alfamart });
  });

  it("vendor yang tidak cocok tidak menghapus semua kandidat", () => {
    expect(selectBill([indomaret], "superindo", "UNPAID")).toEqual({ kind: "one", bill: indomaret });
  });
});
