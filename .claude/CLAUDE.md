# Panduan AI Agent — Project StrukScan

Ini adalah entry point yang HARUS dibaca AI Agent sebelum menulis kode apa pun di repo ini.

## 1. Konteks Produk
Baca `docs/PRD-StrukScan-SaaS.md` untuk requirement lengkap (persona, fitur, pricing, roadmap, NFR).
Jangan berasumsi fitur di luar PRD tanpa konfirmasi ke user (Product Manager). Skema database detail ada di `.claude/rules/database-standards.md` dan PRD §5.2 — jadikan acuan tunggal, jangan menambah tabel/kolom baru tanpa alasan yang jelas dari requirement.

## 2. Tech Stack Wajib (tidak boleh diganti tanpa izin eksplisit)
- Next.js 15 (App Router) + TypeScript — fullstack, SSR/SSG + Route Handlers dalam satu project
- Tailwind CSS v4 + shadcn/ui + Lucide Icons — styling & komponen dasar
- Prisma + PostgreSQL (Neon/Supabase) — ORM & database
- NextAuth.js v5 (Auth.js) — auth, OAuth Google/GitHub, session
- Gemini Vision API (Google) — OCR engine utama untuk parsing struk
- Cloudflare R2 / AWS S3 — object storage untuk foto struk original
- Trigger.dev (atau BullMQ + Redis) — job async untuk proses OCR, TIDAK BOLEH memproses OCR secara sinkron di dalam request handler
- Stripe + Midtrans — billing (kartu internasional + QRIS/transfer lokal)
- Resend + React Email — email transaksional
- Zod — validasi skema, wajib dipakai di semua Route Handler/Server Action dan form
- Zustand / TanStack Query — state management (client state ringan / server state caching)
- Vercel (app) + Railway (worker) — hosting
- Sentry + Vercel Analytics — monitoring

Next.js Route Handler (`app/api/**/route.ts`) hanya dipakai untuk kebutuhan yang butuh HTTP endpoint eksplisit (upload struk, webhook Stripe/Midtrans, polling status job, API publik tier Business). Untuk mutasi data dari form internal aplikasi, **utamakan Server Actions** dibanding membuat Route Handler baru.

## 3. Urutan Baca Rules
Sebelum mengerjakan task, baca file rules yang relevan di `.claude/rules/`:
- `design-standards.md` — konvensi design, styling, UI/UX, aksesibilitas
- `backend-standards.md` — konvensi Route Handler/Server Action, layer, Prisma service
- `frontend-standards.md` — konvensi React/Next.js App Router
- `database-standards.md` — konvensi Prisma schema, migration, naming, relasi
- `security-standards.md` — checklist wajib sebelum PR/commit dianggap selesai

Dan skill spesifik di `.claude/skills/` saat mengerjakan modul terkait:
- `nextjs-server-action-skill.md` — pola Route Handler/Server Action ↔ Zod ↔ Prisma service
- `react-component-skill.md` — pola komponen React reusable dengan shadcn/ui

## 4. Batasan Keras (Hard Constraints)
- DILARANG menghardcode kredensial, API key, atau `.env` value di kode.
- DILARANG mengubah migration Prisma yang SUDAH dijalankan di environment tim (tidak boleh edit file migration lama) — buat migration baru untuk perubahan schema.
- Semua Route Handler/Server Action yang mengubah data (create/update/delete) WAJIB validasi input via Zod schema — tidak ada validasi manual ad-hoc di dalam handler.
- Semua fitur yang butuh sesi login WAJIB dicek lewat helper `auth()` (NextAuth) di server (Route Handler/Server Action/Server Component), bukan hanya disembunyikan di UI client.
- Semua fitur yang dibatasi plan (quota scan Free/Pro/Business, fitur Pro-only seperti export/kategori AI/budget alert) WAJIB dicek di server sebelum eksekusi — bukan cuma disable tombol di UI.
- Endpoint/Server Action publik (route handler dan action yang dipanggil dari form) WAJIB punya minimal 1 test (Vitest untuk unit/service, Playwright untuk flow kritikal seperti scan struk) sebelum dianggap "done".
- Commit message pakai format: `feat(modul): deskripsi singkat` / `fix(modul): ...` / `chore: ...`

## 5. Definisi "Selesai" (Definition of Done) per Task
1. Kode mengikuti rules di `.claude/rules/`.
2. Prisma schema + migration (`prisma migrate dev`) tersedia, dan seed (`prisma/seed.ts`, jika perlu data dummy) bisa dijalankan ulang tanpa error.
3. Halaman responsif (mobile-first) dan pakai komponen dari `components/ui` (shadcn) / `components/` (bukan style inline).
4. Ada test minimal untuk happy path + 1 validasi gagal.
5. Tidak ada N+1 query (cek pakai `include`/`select` Prisma untuk relasi yang ditampilkan di list).
6. Proses OCR (upload → parsing → simpan) tetap async lewat job queue, tidak memblokir request/route handler.

## 6. Gaya Komentar Kode
Komentar WAJIB singkat, padat, dan profesional — gaya senior developer, bukan catatan naratif.
- Jelaskan "kenapa" (rationale/edge case yang tidak jelas dari kode), bukan "apa" — jangan menarasikan ulang hal yang sudah jelas dari nama variabel/fungsi.
- Maksimal 1–3 baris per komentar. Kalau butuh lebih dari itu untuk menjelaskan satu keputusan, itu tanda logikanya perlu disederhanakan atau dipecah ke fungsi/method dengan nama yang jelas — bukan ditambah komentar lebih panjang.
- Tidak ada gaya tutorial/storytelling ("kadang user suka...", "supaya tidak bingung...", dst) — langsung ke fakta teknis.
- Tidak perlu komentar sama sekali kalau kode sudah self-explanatory.
