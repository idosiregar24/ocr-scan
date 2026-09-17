import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/services/telegram", () => ({
  isTelegramConfigured: vi.fn(() => true),
  verifyTelegramSecret: vi.fn((header: string | null) => header === "rahasia"),
}));
vi.mock("@/lib/services/telegram-bot", () => ({ handleTelegramUpdate: vi.fn() }));
vi.mock("@/lib/jobs/chat-message", () => ({ enqueueChatMessage: vi.fn() }));

const telegram = await import("@/lib/services/telegram");
const { handleTelegramUpdate } = await import("@/lib/services/telegram-bot");
const { enqueueChatMessage } = await import("@/lib/jobs/chat-message");
const { POST } = await import("./route");

const VALID_UPDATE = {
  update_id: 10,
  message: { message_id: 1, chat: { id: 555, type: "private" }, text: "tagihan no 32 lunas" },
};

function webhookRequest(body: unknown, secret: string | null = "rahasia") {
  return new NextRequest("http://localhost/api/telegram/webhook", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(secret ? { "X-Telegram-Bot-Api-Secret-Token": secret } : {}),
    },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(telegram.isTelegramConfigured).mockReturnValue(true);
});

describe("POST /api/telegram/webhook", () => {
  it("401 saat secret token salah atau tidak ada", async () => {
    expect((await POST(webhookRequest(VALID_UPDATE, "tebakan"))).status).toBe(401);
    expect((await POST(webhookRequest(VALID_UPDATE, null))).status).toBe(401);
    expect(handleTelegramUpdate).not.toHaveBeenCalled();
  });

  it("404 saat bot belum dikonfigurasi", async () => {
    vi.mocked(telegram.isTelegramConfigured).mockReturnValue(false);

    expect((await POST(webhookRequest(VALID_UPDATE))).status).toBe(404);
  });

  it("400 untuk payload yang bukan Update Telegram", async () => {
    const response = await POST(webhookRequest({ hello: "world" }));

    expect(response.status).toBe(400);
    expect(handleTelegramUpdate).not.toHaveBeenCalled();
  });

  it("mengantrekan pesan yang diterima dari akun terhubung", async () => {
    vi.mocked(handleTelegramUpdate).mockResolvedValue({ status: "queued", messageId: "msg_9" });

    const response = await POST(webhookRequest(VALID_UPDATE));

    expect(response.status).toBe(200);
    expect(enqueueChatMessage).toHaveBeenCalledWith({ messageId: "msg_9" });
  });

  it("tidak mengantrekan update duplikat dari retry Telegram", async () => {
    vi.mocked(handleTelegramUpdate).mockResolvedValue({ status: "duplicate" });

    const response = await POST(webhookRequest(VALID_UPDATE));

    expect(response.status).toBe(200);
    expect(enqueueChatMessage).not.toHaveBeenCalled();
  });
});
