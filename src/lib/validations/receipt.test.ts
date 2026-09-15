import { describe, expect, it } from "vitest";
import { createReceiptSchema } from "./receipt";

describe("createReceiptSchema", () => {
  it("menerima payload struk minimal yang valid", () => {
    const result = createReceiptSchema.safeParse({
      imageKey: "receipts/abc123.jpg",
      items: [{ name: "Kopi Susu", qty: 2, unitPrice: 18000 }],
    });

    expect(result.success).toBe(true);
  });

  it("menolak payload tanpa imageKey", () => {
    const result = createReceiptSchema.safeParse({
      items: [{ name: "Kopi Susu", qty: 1, unitPrice: 18000 }],
    });

    expect(result.success).toBe(false);
  });

  it("menolak item dengan harga negatif", () => {
    const result = createReceiptSchema.safeParse({
      imageKey: "receipts/abc123.jpg",
      items: [{ name: "Kopi Susu", qty: 1, unitPrice: -1000 }],
    });

    expect(result.success).toBe(false);
  });
});
