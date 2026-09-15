# Backend Standards (Next.js App Router + TypeScript)

## Struktur & Penamaan
- Route Handler: `app/api/<resource>/route.ts`, sub-resource pakai folder bersarang (`app/api/receipts/[id]/route.ts`). Export named function per HTTP method (`GET`, `POST`, `PATCH`, `DELETE`).
- Server Action: file `actions.ts` dikoleksikan per modul (`app/(dashboard)/receipts/actions.ts`), diawali `"use server"`. Nama fungsi verb + noun (`createReceipt`, `approveWorkspaceMember`).
- Service/logika bisnis: `lib/services/<domain>.ts` (`lib/services/receipt.ts`, `lib/services/billing.ts`). Fungsi murni, tidak bergantung ke `NextRequest`/`NextResponse`, supaya bisa dites tanpa mocking HTTP.
- Skema validasi: `lib/validations/<domain>.ts`, satu Zod schema per operasi (`createReceiptSchema`, `updateProfileSchema`).
- Prisma model: singular, `PascalCase` (`Receipt`, bukan `Receipts`) — lihat `database-standards.md`.

## Layer & Tanggung Jawab
- **Route Handler**: tipis. Ambil request → parse & validasi (Zod) → panggil service → return `NextResponse.json(...)` dengan status code eksplisit. Tidak ada query Prisma kompleks langsung di route handler.
- **Server Action**: sama tipisnya — validasi input (Zod) → cek sesi (`auth()`) → panggil service → `revalidatePath`/return state untuk `useFormState`. Tidak fetch manual ke Route Handler sendiri (langsung panggil service).
- **Zod schema**: satu-satunya sumber validasi input. Infer type TypeScript dari schema (`z.infer<typeof schema>`), jangan duplikasi type manual.
- **Service (`lib/services`)**: semua logika bisnis dan akses Prisma. Wajib dipakai untuk proses multi-langkah (mis. `processReceiptOcr`, `upgradeSubscription` yang melibatkan Stripe + Prisma + email).
- **Middleware/guard**: semua pengecekan auth & plan-gating dipanggil lewat helper terpusat (`requireUser()`, `requireActiveSubscription()`), bukan if-else `session.user.plan === 'pro'` yang diulang di banyak tempat.

## Response Pattern
- Route Handler untuk resource CRUD return JSON dengan shape konsisten: `{ data }` untuk sukses, `{ error: { message, code } }` untuk gagal — jangan return array/object mentah tanpa shape jelas.
- Gunakan mapper/DTO (`lib/dto/receipt.ts`) untuk membentuk shape data yang dikirim ke client, supaya field sensitif (password hash, token, `stripe_customer_id` mentah) tidak pernah ikut terkirim.
- List/pagination pakai cursor-based (`skip`/`take` + `cursor` Prisma) untuk data yang terus bertambah (riwayat transaksi), bukan `OFFSET` besar yang lambat di scale.
- Job asinkron (OCR, export PDF/Excel besar) return `202 Accepted` + `jobId`, client polling `GET /api/jobs/:id` atau pakai SSE — jangan bikin request menunggu proses OCR selesai secara sinkron (lihat PRD §5.3).

## Middleware (`middleware.ts`)
- Proteksi route `/dashboard/**`, `/receipts/**`, `/settings/**` dst via NextAuth middleware (`auth` export dari `lib/auth.ts`), redirect ke `/login` jika belum sesi.
- Plan-gating tingkat route (mis. blokir akses halaman workspace tim untuk plan Free/Pro) boleh dicek di middleware untuk UX cepat, TAPI service layer tetap WAJIB re-check server-side — middleware bukan satu-satunya lapisan proteksi.

## Query & Performa
- Selalu `include`/`select` relasi yang ditampilkan di listing (`prisma.receipt.findMany({ include: { items: true } })`), cegah N+1.
- Untuk filter kompleks (riwayat transaksi by tanggal/toko/kategori), bangun `where` clause di service layer lewat helper terpisah agar route handler/action tetap ringkas dan gampang dites.
- Index database untuk kolom yang sering difilter (lihat `database-standards.md`).

## Error Handling
- Validasi gagal (Zod) → return `400` dengan detail field error, biarkan form React menampilkannya (`useFormState`/React Hook Form), jangan custom-parse di banyak tempat.
- Untuk aksi yang gagal karena state tidak valid (mis. scan struk saat kuota habis, approve invoice yang sudah lunas), lempar custom error class (`class QuotaExceededError extends Error`) dan tangkap di level route/action untuk map ke status code yang tepat — jangan biarkan `console.log`/stack trace mentah bocor ke response.

## Job & OCR Pipeline
- Semua pemanggilan Claude Vision API terjadi di dalam job Trigger.dev (atau worker BullMQ), tidak pernah langsung dari Route Handler request-response cycle.
- Job wajib idempotent & retry-safe (pakai `receiptId` sebagai idempotency key) — kegagalan network ke Claude API tidak boleh membuat data ganda.
- Hasil mentah OCR selalu disimpan ke kolom `ocr_raw` (JSON) sebelum di-mapping ke `receipt_items`, supaya bisa di-reprocess kalau parsing logic berubah tanpa perlu foto ulang.

## Testing
- Service layer: unit test dengan Vitest, mock Prisma client (`vitest-mock-extended` atau Prisma test client terpisah).
- Route Handler/Server Action: minimal 1 test happy path + 1 unauthorized/forbidden case + 1 validasi gagal (jika terima input).
- Flow kritikal end-to-end (upload struk → hasil OCR tampil → simpan → muncul di riwayat) ditest dengan Playwright, bukan cuma unit test.
