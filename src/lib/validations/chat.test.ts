import { describe, expect, it } from "vitest";
import { sendChatMessageSchema, telegramUpdateSchema } from "./chat";

describe("sendChatMessageSchema", () => {
  it("menerima teks saja", () => {
    expect(sendChatMessageSchema.safeParse({ text: "tagihan no 32 lunas" }).success).toBe(true);
  });

  it("menerima foto tanpa teks", () => {
    const image = new File([new Uint8Array(1024)], "struk.jpg", { type: "image/jpeg" });
    expect(sendChatMessageSchema.safeParse({ text: "", image }).success).toBe(true);
  });

  it("menolak pesan kosong tanpa foto", () => {
    expect(sendChatMessageSchema.safeParse({ text: "   " }).success).toBe(false);
  });

  it("menolak lampiran selain gambar", () => {
    const pdf = new File([new Uint8Array(10)], "struk.pdf", { type: "application/pdf" });
    expect(sendChatMessageSchema.safeParse({ image: pdf }).success).toBe(false);
  });
});

describe("telegramUpdateSchema", () => {
  it("menerima update pesan teks dan mengabaikan field tambahan", () => {
    const result = telegramUpdateSchema.safeParse({
      update_id: 1,
      message: { message_id: 2, chat: { id: 123, type: "private" }, text: "halo", from: { id: 9 } },
    });
    expect(result.success).toBe(true);
  });

  it("menolak payload tanpa update_id", () => {
    expect(telegramUpdateSchema.safeParse({ message: {} }).success).toBe(false);
  });
});
