import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/services/chat", () => ({
  createUserChatMessage: vi.fn(),
  listChatMessages: vi.fn(),
}));
vi.mock("@/lib/services/scan", () => ({ startReceiptScan: vi.fn() }));
vi.mock("@/lib/services/receipt", () => ({ QuotaExceededError: class QuotaExceededError extends Error {} }));
vi.mock("@/lib/services/image", () => ({ UnreadableImageError: class UnreadableImageError extends Error {} }));
vi.mock("@/lib/storage", () => ({ StorageNotConfiguredError: class StorageNotConfiguredError extends Error {} }));
vi.mock("@/lib/jobs/chat-message", () => ({ enqueueChatMessage: vi.fn() }));

const { auth } = await import("@/lib/auth");
const chat = await import("@/lib/services/chat");
const scan = await import("@/lib/services/scan");
const receiptService = await import("@/lib/services/receipt");
const { enqueueChatMessage } = await import("@/lib/jobs/chat-message");
const { GET, POST } = await import("./route");

const NOW = new Date(2026, 8, 16);

function storedMessage(overrides: Record<string, unknown> = {}) {
  return {
    id: "msg_1",
    userId: "user_1",
    channel: "WEB",
    role: "USER",
    content: "tagihan no 32 lunas",
    receiptId: null,
    receipt: null,
    payload: null,
    externalId: null,
    processedAt: null,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

function postRequest(fields: Record<string, string | File>) {
  const body = new FormData();
  for (const [key, value] of Object.entries(fields)) body.append(key, value);
  return new NextRequest("http://localhost/api/chat/messages", { method: "POST", body });
}

let userCounter = 0;

beforeEach(() => {
  vi.clearAllMocks();
  // User id unik per test supaya bucket rate limit in-memory tidak terbawa antar test.
  userCounter += 1;
  vi.mocked(auth).mockResolvedValue({ user: { id: `user_${userCounter}` } } as never);
});

describe("POST /api/chat/messages", () => {
  it("401 tanpa sesi", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    const response = await POST(postRequest({ text: "halo" }));

    expect(response.status).toBe(401);
    expect(chat.createUserChatMessage).not.toHaveBeenCalled();
  });

  it("400 untuk pesan kosong tanpa foto", async () => {
    const response = await POST(postRequest({ text: "  " }));
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error.code).toBe("VALIDATION_FAILED");
  });

  it("202 dan antrekan balasan untuk pesan teks", async () => {
    vi.mocked(chat.createUserChatMessage).mockResolvedValue(storedMessage() as never);

    const response = await POST(postRequest({ text: "tagihan no 32 lunas" }));
    const payload = await response.json();

    expect(response.status).toBe(202);
    expect(scan.startReceiptScan).not.toHaveBeenCalled();
    expect(enqueueChatMessage).toHaveBeenCalledWith({ messageId: "msg_1" });
    expect(payload.data).not.toHaveProperty("externalId");
  });

  it("402 saat foto dikirim tapi kuota habis", async () => {
    vi.mocked(scan.startReceiptScan).mockRejectedValue(new receiptService.QuotaExceededError("Kuota habis"));

    const image = new File([new Uint8Array(1024)], "struk.jpg", { type: "image/jpeg" });
    const response = await POST(postRequest({ image }));

    expect(response.status).toBe(402);
    expect(chat.createUserChatMessage).not.toHaveBeenCalled();
    expect(enqueueChatMessage).not.toHaveBeenCalled();
  });
});

describe("GET /api/chat/messages", () => {
  it("401 tanpa sesi", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    const response = await GET(new NextRequest("http://localhost/api/chat/messages"));

    expect(response.status).toBe(401);
  });

  it("400 untuk cursor yang bukan cuid", async () => {
    const response = await GET(new NextRequest("http://localhost/api/chat/messages?before=../etc"));

    expect(response.status).toBe(400);
  });

  it("mengembalikan riwayat milik user yang login", async () => {
    vi.mocked(chat.listChatMessages).mockResolvedValue({ messages: [storedMessage()], nextCursor: null } as never);

    const response = await GET(new NextRequest("http://localhost/api/chat/messages"));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(chat.listChatMessages).toHaveBeenCalledWith(`user_${userCounter}`, { take: 50 });
    expect(payload.data.messages).toHaveLength(1);
  });
});
