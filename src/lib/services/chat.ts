import { Prisma, type Bill, type ChatChannel } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { formatDate, formatIDR } from "@/lib/format";
import { parseChatIntent } from "@/lib/services/chat-intent";
import {
  BillAlreadyExistsError,
  BillNoRequiredError,
  ReceiptTotalMissingError,
  createBillFromReceipt,
  createManualBill,
  findBillsByNo,
  findReceiptsByNo,
  listUnpaidBills,
  selectBill,
  setBillStatus,
} from "@/lib/services/bill";
import { formatSpendingReportText, getSpendingReport, type SpendingReport } from "@/lib/services/report";
import { getTelegramChatIdForUser, sendTelegramMessage } from "@/lib/services/telegram";
import type { ChatIntent, ListChatMessagesQuery } from "@/lib/validations/chat";

export type ChatPayload = { type: "report"; report: SpendingReport };
export type ChatReply = { content: string; receiptId?: string | null; payload?: ChatPayload | null };

export class DuplicateChatMessageError extends Error {
  constructor() {
    super("Pesan sudah pernah diterima");
    this.name = "DuplicateChatMessageError";
  }
}

export const HELP_TEXT = [
  "Yang bisa saya bantu:",
  "- Kirim foto struk: saya catat transaksinya.",
  "- \"ini belum lunas\" atau \"no 32 belum lunas\": jadikan tagihan belum lunas.",
  "- \"tagihan listrik no INV-88 350rb belum lunas\": catat tagihan tanpa struk.",
  "- \"tagihan no 32 dah lunas\": tandai lunas.",
  "- \"tagihan apa aja yang belum lunas?\": daftar tagihan.",
  "- \"laporan akhir tahun\" atau \"rekap Maret 2026\": laporan pengeluaran.",
].join("\n");

function receiptLink(receiptId: string) {
  return `${env.NEXTAUTH_URL ?? ""}/receipts/${receiptId}`;
}

function describeBill(bill: Pick<Bill, "billNo" | "vendor" | "amount" | "issuedAt">) {
  return [`no ${bill.billNo}`, bill.vendor, formatIDR(Number(bill.amount)), formatDate(bill.issuedAt)]
    .filter(Boolean)
    .join(" · ");
}

function ambiguousReply(billNo: string, rows: string[]): ChatReply {
  return {
    content: [
      `Ada ${rows.length} data dengan nomor ${billNo}:`,
      ...rows.map((row, index) => `${index + 1}. ${row}`),
      "",
      `Ulangi dengan nama tokonya, mis. "tagihan no ${billNo} <nama toko> lunas".`,
    ].join("\n"),
  };
}

/** Struk terakhir yang dikirim user lewat chat — acuan untuk perintah tanpa nomor ("ini belum lunas"). */
async function getLatestChatReceipt(userId: string) {
  const message = await prisma.chatMessage.findFirst({
    where: { userId, role: "USER", receiptId: { not: null } },
    orderBy: { createdAt: "desc" },
    include: { receipt: { include: { bill: true } } },
  });
  return message?.receipt ?? null;
}

type ReceiptWithBill = NonNullable<Awaited<ReturnType<typeof getLatestChatReceipt>>>;

async function markReceiptUnpaid(userId: string, receipt: ReceiptWithBill, billNo: string | null): Promise<ChatReply> {
  if (receipt.status === "PENDING" || receipt.status === "PROCESSING") {
    return { content: "Struknya masih dibaca. Tunggu balasan ringkasan struk, lalu kirim ulang perintahnya." };
  }

  if (receipt.bill) return reopenOrConfirmUnpaid(userId, receipt.bill);

  try {
    const bill = await createBillFromReceipt(userId, receipt.id, billNo);
    return { content: `Dicatat sebagai tagihan BELUM LUNAS: ${describeBill(bill)}.`, receiptId: receipt.id };
  } catch (err) {
    if (err instanceof BillAlreadyExistsError) return reopenOrConfirmUnpaid(userId, err.bill);
    if (err instanceof BillNoRequiredError) {
      return { content: "Nomor struknya tidak terbaca. Sebutkan nomornya, mis. \"belum lunas no 32\"." };
    }
    if (err instanceof ReceiptTotalMissingError) {
      return { content: `${err.message}: ${receiptLink(receipt.id)}`, receiptId: receipt.id };
    }
    throw err;
  }
}

async function reopenOrConfirmUnpaid(userId: string, bill: Bill): Promise<ChatReply> {
  if (bill.status === "UNPAID") {
    return { content: `Tagihan ${describeBill(bill)} memang sudah tercatat belum lunas.` };
  }
  const reopened = await setBillStatus(userId, bill.id, "UNPAID");
  return { content: `Tagihan ${describeBill(reopened)} dikembalikan ke BELUM LUNAS.` };
}

async function handleMarkUnpaid(userId: string, intent: ChatIntent): Promise<ChatReply> {
  if (!intent.billNo) {
    const receipt = await getLatestChatReceipt(userId);
    if (!receipt) {
      return { content: "Kirim foto struknya dulu, atau sebutkan nomornya, mis. \"no 32 belum lunas\"." };
    }
    return markReceiptUnpaid(userId, receipt, null);
  }

  const bills = await findBillsByNo(userId, intent.billNo);
  const billMatch = selectBill(bills, intent.vendor, "UNPAID");
  if (billMatch.kind === "one") return reopenOrConfirmUnpaid(userId, billMatch.bill);
  if (billMatch.kind === "many") return ambiguousReply(intent.billNo, billMatch.bills.map(describeBill));

  const receipts = await findReceiptsByNo(userId, intent.billNo);
  if (receipts.length === 1) return markReceiptUnpaid(userId, receipts[0], null);
  if (receipts.length > 1) {
    return ambiguousReply(
      intent.billNo,
      receipts.map((r) => [r.storeName ?? "Tanpa nama toko", r.total ? formatIDR(Number(r.total)) : null, formatDate(r.date ?? r.createdAt)].filter(Boolean).join(" · ")),
    );
  }

  // Nomor tidak dikenal: kemungkinan user sedang melengkapi nomor untuk struk terakhir yang tidak punya receiptNo.
  const latest = await getLatestChatReceipt(userId);
  if (latest && !latest.receiptNo && !latest.bill) return markReceiptUnpaid(userId, latest, intent.billNo);

  return {
    content: `Tidak ada struk no ${intent.billNo}. Kirim foto struknya, atau catat manual: "tagihan <nama> no ${intent.billNo} <nominal> belum lunas".`,
  };
}

async function handleMarkPaid(userId: string, intent: ChatIntent): Promise<ChatReply> {
  let bill: Bill | null = null;

  if (intent.billNo) {
    const match = selectBill(await findBillsByNo(userId, intent.billNo), intent.vendor, "UNPAID");
    if (match.kind === "many") return ambiguousReply(intent.billNo, match.bills.map(describeBill));
    if (match.kind === "none") {
      return { content: `Tagihan no ${intent.billNo} tidak ditemukan. Ketik "tagihan apa aja yang belum lunas?" untuk melihat daftarnya.` };
    }
    bill = match.bill;
  } else {
    bill = (await getLatestChatReceipt(userId))?.bill ?? null;
    if (!bill) return { content: "Sebutkan nomor tagihannya, mis. \"tagihan no 32 lunas\"." };
  }

  if (bill.status === "PAID") {
    return { content: `Tagihan ${describeBill(bill)} sudah lunas sejak ${formatDate(bill.paidAt)}.` };
  }
  const paid = await setBillStatus(userId, bill.id, "PAID");
  return { content: `Tagihan ${describeBill(paid)} sekarang LUNAS.`, receiptId: paid.receiptId };
}

async function handleCreateBill(userId: string, intent: ChatIntent): Promise<ChatReply> {
  if (!intent.billNo || intent.amount === null) {
    return { content: "Sebutkan nomor dan nominalnya, mis. \"tagihan listrik no INV-88 350rb belum lunas\"." };
  }
  const bill = await createManualBill(userId, { billNo: intent.billNo, vendor: intent.vendor, amount: intent.amount });
  return { content: `Dicatat sebagai tagihan BELUM LUNAS: ${describeBill(bill)}.` };
}

async function handleListBills(userId: string): Promise<ChatReply> {
  const { bills, count, total } = await listUnpaidBills(userId);
  if (count === 0) return { content: "Tidak ada tagihan yang belum lunas." };

  const lines = [`${count} tagihan belum lunas, total ${formatIDR(total)}:`, ...bills.map((b, i) => `${i + 1}. ${describeBill(b)}`)];
  if (count > bills.length) lines.push(`…dan ${count - bills.length} lainnya.`);
  return { content: lines.join("\n") };
}

async function handleReport(userId: string, intent: ChatIntent, now: Date): Promise<ChatReply> {
  const report = await getSpendingReport(userId, { year: intent.year ?? now.getFullYear(), month: intent.month });
  return { content: formatSpendingReportText(report), payload: { type: "report", report } };
}

export async function handleChatText(userId: string, text: string, now = new Date()): Promise<ChatReply> {
  const intent = await parseChatIntent(text, now);

  switch (intent.intent) {
    case "mark_unpaid":
      return handleMarkUnpaid(userId, intent);
    case "mark_paid":
      return handleMarkPaid(userId, intent);
    case "create_bill":
      return handleCreateBill(userId, intent);
    case "list_bills":
      return handleListBills(userId);
    case "report":
      return handleReport(userId, intent, now);
    case "help":
      return { content: HELP_TEXT };
    default:
      return { content: `Maaf, saya belum paham maksudnya.\n\n${HELP_TEXT}` };
  }
}

export async function buildReceiptScanReply(receiptId: string): Promise<ChatReply> {
  const receipt = await prisma.receipt.findUniqueOrThrow({
    where: { id: receiptId },
    include: { _count: { select: { items: true } } },
  });

  if (receipt.status !== "DONE") {
    return {
      content: `Struk gagal dibaca otomatis. Fotonya tersimpan — lengkapi datanya di ${receiptLink(receipt.id)}`,
      receiptId,
    };
  }

  return {
    content: [
      "Struk tercatat:",
      `Toko: ${receipt.storeName ?? "tidak terbaca"}`,
      `Tanggal: ${formatDate(receipt.date ?? receipt.createdAt)}`,
      `No struk: ${receipt.receiptNo ?? "tidak terbaca"}`,
      `Total: ${receipt.total !== null ? formatIDR(Number(receipt.total)) : "tidak terbaca"} (${receipt._count.items} item)`,
      "",
      `Cek atau koreksi: ${receiptLink(receipt.id)}`,
      "Kalau belum dibayar, balas \"belum lunas\".",
    ].join("\n"),
    receiptId,
  };
}

export async function createUserChatMessage(input: {
  userId: string;
  channel: ChatChannel;
  content: string;
  receiptId?: string | null;
  externalId?: string | null;
}) {
  try {
    return await prisma.chatMessage.create({
      data: { ...input, role: "USER" },
      include: { receipt: true },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw new DuplicateChatMessageError();
    }
    throw err;
  }
}

export async function attachReceiptToChatMessage(messageId: string, receiptId: string) {
  await prisma.chatMessage.update({ where: { id: messageId }, data: { receiptId } });
}

/** Klaim atomik: hanya satu job yang boleh membalas pesan yang sama walau di-dispatch ulang. */
export async function claimChatMessage(messageId: string) {
  const claimed = await prisma.chatMessage.updateMany({
    where: { id: messageId, role: "USER", processedAt: null },
    data: { processedAt: new Date() },
  });
  return claimed.count === 1;
}

export async function createAssistantChatMessage(
  source: { userId: string; channel: ChatChannel },
  reply: ChatReply,
) {
  return prisma.chatMessage.create({
    data: {
      userId: source.userId,
      channel: source.channel,
      role: "ASSISTANT",
      content: reply.content,
      receiptId: reply.receiptId ?? null,
      payload: reply.payload ? (reply.payload as unknown as Prisma.InputJsonValue) : undefined,
      processedAt: new Date(),
    },
  });
}

export async function deliverChatReply(source: { userId: string; channel: ChatChannel }, reply: ChatReply) {
  await createAssistantChatMessage(source, reply);
  if (source.channel !== "TELEGRAM") return;

  const chatId = await getTelegramChatIdForUser(source.userId);
  if (!chatId) return;
  try {
    await sendTelegramMessage(chatId, reply.content);
  } catch (err) {
    // Balasan tetap tersimpan dan terlihat di /chat walau pengiriman ke Telegram gagal.
    console.error("Telegram delivery failed:", err);
  }
}

export async function listChatMessages(userId: string, query: ListChatMessagesQuery) {
  const messages = await prisma.chatMessage.findMany({
    where: { userId },
    include: { receipt: { include: { _count: { select: { items: true } } } } },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: query.take + 1,
    ...(query.before ? { cursor: { id: query.before }, skip: 1 } : {}),
  });

  const hasMore = messages.length > query.take;
  const chronological = messages.slice(0, query.take).reverse();
  return { messages: chronological, nextCursor: hasMore ? chronological[0].id : null };
}
