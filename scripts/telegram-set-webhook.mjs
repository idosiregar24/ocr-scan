#!/usr/bin/env node
// Daftarkan webhook bot Telegram ke deployment StrukScan.
// Usage: node scripts/telegram-set-webhook.mjs https://domain-anda
import "dotenv/config";

const baseUrl = process.argv[2];
const { TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET } = process.env;

if (!baseUrl?.startsWith("https://")) {
  console.error("Usage: node scripts/telegram-set-webhook.mjs https://domain-anda (Telegram mewajibkan HTTPS)");
  process.exit(1);
}
if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_WEBHOOK_SECRET) {
  console.error("TELEGRAM_BOT_TOKEN dan TELEGRAM_WEBHOOK_SECRET wajib diisi di .env");
  process.exit(1);
}

const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    url: `${baseUrl.replace(/\/$/, "")}/api/telegram/webhook`,
    secret_token: TELEGRAM_WEBHOOK_SECRET,
    allowed_updates: ["message"],
  }),
});

const payload = await response.json();
console.log(payload.ok ? "Webhook terdaftar." : `Gagal: ${payload.description}`);
process.exit(payload.ok ? 0 : 1);
