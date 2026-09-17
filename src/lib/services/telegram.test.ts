import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env", () => ({ env: { TELEGRAM_BOT_TOKEN: "token", TELEGRAM_WEBHOOK_SECRET: "rahasia-webhook" } }));
vi.mock("@/lib/prisma", () => ({ prisma: {} }));

const { splitTelegramText, verifyTelegramSecret } = await import("./telegram");

describe("verifyTelegramSecret", () => {
  it("hanya menerima secret yang persis sama", () => {
    expect(verifyTelegramSecret("rahasia-webhook")).toBe(true);
    expect(verifyTelegramSecret("rahasia-webhoo")).toBe(false);
    expect(verifyTelegramSecret(null)).toBe(false);
  });
});

describe("splitTelegramText", () => {
  it("memecah di batas baris tanpa melewati limit", () => {
    const text = ["a".repeat(6), "b".repeat(6), "c".repeat(6)].join("\n");
    const chunks = splitTelegramText(text, 14);

    expect(chunks).toEqual(["aaaaaa\nbbbbbb", "cccccc"]);
    expect(chunks.every((chunk) => chunk.length <= 14)).toBe(true);
  });
});
