# StrukScan

Platform SaaS OCR untuk manajemen struk & pengeluaran — foto struk, biarkan AI yang catat.

Lihat [`docs/PRD-StrukScan-SaaS.md`](docs/PRD-StrukScan-SaaS.md) untuk requirement lengkap dan [`.claude/CLAUDE.md`](.claude/CLAUDE.md) untuk panduan kontribusi/AI agent (tech stack wajib, konvensi, definition of done).

## Tech Stack

Next.js 15 (App Router) · TypeScript · Tailwind CSS v4 + shadcn/ui · Prisma + PostgreSQL · NextAuth.js v5 · Claude Vision API (OCR) · Trigger.dev · Stripe/Midtrans · Resend · Zod · TanStack Query + Zustand.

Detail & rationale tiap pilihan ada di PRD §5.1.

## Setup Awal

1. **Install dependencies** (sudah dilakukan saat scaffold, cukup `npm install` lagi kalau clone baru):
   ```bash
   npm install
   ```

2. **Siapkan environment variables** — salin `.env.example` ke `.env.local` dan isi:
   ```bash
   cp .env.example .env.local
   ```
   Minimal wajib diisi untuk `npm run dev` jalan: `DATABASE_URL`, `NEXTAUTH_SECRET`, `ANTHROPIC_API_KEY`. Sisanya (Google OAuth, R2/S3, Stripe, Midtrans, Resend, Trigger.dev, Upstash) bisa menyusul sesuai fitur yang sedang dikerjakan — lihat `src/lib/env.ts` untuk validasi Zod-nya.

3. **Setup database** (PostgreSQL — lokal, atau Neon/Supabase):
   ```bash
   npm run db:migrate   # prisma migrate dev — apply schema di prisma/schema.prisma
   npm run db:seed      # data referensi (kategori default) + 1 user demo, khusus non-production
   ```

4. **Jalankan dev server**:
   ```bash
   npm run dev
   ```
   Buka http://localhost:3000.

## Struktur Project

```
src/
  app/                 App Router — (auth)/, (dashboard)/, api/
  components/          Komponen React reusable (components/ui = shadcn base)
  lib/
    services/          Logika bisnis + akses Prisma (satu-satunya layer yang query DB)
    validations/       Zod schema — sumber tunggal validasi (client + server)
    dto/                Mapper response — cegah field sensitif ikut terkirim ke client
    stores/             Zustand store (state UI ringan)
    auth.ts             Config NextAuth penuh (Node runtime — Prisma adapter)
    auth.config.ts      Config NextAuth edge-safe (dipakai middleware.ts, TANPA Prisma)
    prisma.ts           PrismaClient singleton (driver adapter @prisma/adapter-pg)
  middleware.ts         Proteksi route berbasis sesi (edge-safe)
prisma/
  schema.prisma         Model (lihat docs/PRD-StrukScan-SaaS.md §5.2)
  seed.ts                Seed idempotent, guarded NODE_ENV !== production
prisma.config.ts         Connection URL & seed command (Prisma 7 — bukan lagi di schema.prisma)
e2e/                      Playwright — flow kritikal end-to-end
```

Konvensi lengkap: `.claude/rules/backend-standards.md`, `frontend-standards.md`, `database-standards.md`, `design-standards.md`, `security-standards.md`. Pola siap-pakai: `.claude/skills/nextjs-server-action-skill.md`, `react-component-skill.md`.

## Testing

```bash
npm run test        # Vitest — unit test (service layer, validasi Zod)
npm run test:e2e     # Playwright — flow end-to-end (perlu `npx playwright install` sekali di awal)
npm run lint
npx tsc --noEmit
```

## Catatan Setup

- **Next.js dipin ke versi 15.x** (`15.5.25`) sesuai hard constraint tech stack di PRD — JANGAN `npm audit fix --force` atau update ke Next 16 tanpa izin eksplisit Product Manager, meski itu akan "fix" advisory PostCSS bawaan Next.
- **Prisma dipin ke `7.10.0`** (stable) — `prisma` CLI dan `@prisma/client` harus selalu versi yang sama persis. Prisma 8 masih release-candidate saat scaffold ini dibuat; jangan upgrade sampai versi stabil rilis.
- **Prisma 7 memindahkan connection URL** dari `schema.prisma` ke `prisma.config.ts`, dan `PrismaClient` sekarang wajib driver adapter eksplisit (`@prisma/adapter-pg`) — lihat `src/lib/prisma.ts`.
- **NextAuth v5 + Prisma di Middleware**: `middleware.ts` sengaja pakai `lib/auth.config.ts` (edge-safe, tanpa Prisma/`pg`) supaya tidak bentrok dengan Edge Runtime. Config penuh (adapter + provider Credentials) ada di `lib/auth.ts`, hanya untuk Node runtime (Route Handler/Server Component/Server Action).
- **`npm audit`** masih melaporkan beberapa advisory moderate/high pada dependency transitif `@trigger.dev/sdk` (opentelemetry, `ws` lewat `socket.io-client`, `mysql2` opsional Prisma) yang perbaikannya butuh downgrade Prisma atau upgrade Next major — sengaja tidak di-force-fix karena melanggar tech stack pin di atas. Pantau rilis upstream `@trigger.dev/sdk` untuk update non-breaking.
- Folder `Repository/tesseract` adalah clone riset Tesseract OCR dari eksplorasi awal sebelum keputusan pakai Claude Vision API — bukan bagian dari aplikasi, di-gitignore, aman dihapus kalau tidak dipakai lagi.
