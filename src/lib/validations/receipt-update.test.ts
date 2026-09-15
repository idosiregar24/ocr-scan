import { describe, expect, it } from "vitest";
import { listReceiptsQuerySchema, updateReceiptSchema } from "./receipt";

describe("updateReceiptSchema", () => {
  it("menerima payload hasil review OCR yang valid", () => {
    const result = updateReceiptSchema.safeParse({
      id: "clx0000000000000000000000",
      storeName: "Indomaret Kebon Jeruk",
      items: [{ name: "Kopi Susu", qty: 2, unitPrice: 18000 }],
      total: 36000,
    });

    expect(result.success).toBe(true);
  });

  it("menolak struk tanpa item sama sekali", () => {
    const result = updateReceiptSchema.safeParse({
      id: "clx0000000000000000000000",
      items: [],
    });

    expect(result.success).toBe(false);
  });

  it("memperlakukan string kosong pada field opsional sebagai tidak diisi", () => {
    const result = updateReceiptSchema.safeParse({
      id: "clx0000000000000000000000",
      storeName: "",
      items: [{ name: "Kopi Susu", qty: 1, unitPrice: 18000 }],
    });

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.storeName).toBeUndefined();
  });
});

describe("listReceiptsQuerySchema", () => {
  it("default take ke 20 saat query kosong", () => {
    const result = listReceiptsQuerySchema.parse({});
    expect(result.take).toBe(20);
  });

  it("menolak status di luar enum ReceiptStatus", () => {
    const result = listReceiptsQuerySchema.safeParse({ status: "UNKNOWN" });
    expect(result.success).toBe(false);
  });
});
