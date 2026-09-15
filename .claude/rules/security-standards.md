# Security Standards — Checklist Wajib

Checklist ini WAJIB dicek AI Agent sebelum sebuah task/fitur ditandai selesai.

## Autentikasi & Otorisasi
- [ ] Route yang butuh login dicek via `auth()` (NextAuth) di `middleware.ts` DAN di server (Route Handler/Server Action/Server Component) — jangan andalkan middleware saja.
- [ ] Route/aksi khusus plan berbayar (export, kategori AI, budget alert, workspace tim, API publik) dicek status subscription aktif di server, bukan hanya disembunyikan di UI.
- [ ] Setiap aksi update/delete data milik user lain (edit struk, hapus item, ubah workspace) dicek kepemilikan (`receipt.userId === session.user.id`) atau role workspace (`admin`/`owner`) — user hanya boleh mengubah miliknya sendiri kecuali role yang berwenang.
- [ ] Quota scan (Free 20/bln, Pro 500/bln) dicek & di-increment atomik di server sebelum job OCR dijalankan — cegah race condition/bypass lewat request paralel.

## Input & Validasi
- [ ] Semua input dari form/Route Handler divalidasi via Zod schema (`lib/validations/*`), termasuk file upload struk — batasi tipe MIME (image only: jpg/png/webp/heic) dan ukuran maksimum.
- [ ] Foto struk dikompresi/diresize di server sebelum disimpan ke object storage (jangan simpan file asli tanpa batas ukuran).
- [ ] Tidak ada raw SQL dengan input user langsung disisipkan (`$queryRawUnsafe` DILARANG untuk input user) — selalu Prisma query builder / `$queryRaw` dengan parameter binding.

## Proteksi Bawaan
- [ ] Route Handler yang menerima mutasi dari client cek origin/CSRF sesuai proteksi bawaan Next.js (Server Actions punya proteksi origin-check built-in) — jangan matikan atau bypass.
- [ ] Rich content yang dirender dari data user/AI (mis. catatan/insight AI) disanitasi sebelum di-render, jangan `dangerouslySetInnerHTML` tanpa sanitasi.
- [ ] File upload disimpan di storage dengan key ter-generate (cuid/uuid), bukan nama file asli user — cegah path traversal/collision/leak nama file sensitif.

## Data Sensitif
- [ ] Field password hash, token OAuth/session, `stripe_customer_id` mentah, dan kolom sensitif lain tidak pernah muncul di response API/props ke client — selalu lewat mapper/DTO eksplisit (lihat `backend-standards.md`).
- [ ] Foto struk diakses lewat signed URL (bukan URL publik permanen) — sesuai risiko kebocoran PII di PRD (R-05).
- [ ] Opsi auto-delete foto struk asli setelah OCR selesai (jika diaktifkan user) benar-benar menghapus object di storage, bukan cuma soft-delete di DB.

## Rate Limiting & Abuse
- [ ] Endpoint registrasi, login, reset password, dan `/api/scan` punya rate limiting (mis. berbasis Redis/Upstash) per user/IP.
- [ ] Webhook Stripe/Midtrans verifikasi signature request sebelum diproses — tidak pernah percaya payload webhook tanpa validasi signature.
- [ ] API publik tier Business (F-13) pakai API key per workspace dengan scope & rate limit sendiri, terpisah dari sesi user biasa.

## Sebelum Commit/PR
- [ ] Tidak ada `console.log()`/`debugger` debugging tertinggal.
- [ ] Tidak ada kredensial/API key hardcoded — semua lewat `.env` + akses via `process.env` yang divalidasi lewat `lib/env.ts` (Zod schema untuk env vars, fail-fast saat startup kalau ada yang kosong).
- [ ] `.env.example` diperbarui jika ada environment variable baru.
- [ ] Enkripsi at-rest (storage provider) dan in-transit (TLS, default di Vercel) tetap aktif — tidak ada endpoint yang sengaja bypass HTTPS.
