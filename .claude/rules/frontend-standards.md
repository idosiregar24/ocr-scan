# Frontend Standards (React + Next.js App Router)

## Struktur Halaman
- Satu route = satu `app/<segment>/page.tsx` (App Router), pakai route group untuk memisahkan layout (`app/(auth)/login/page.tsx`, `app/(dashboard)/receipts/page.tsx`).
- Semua halaman dashboard dibungkus `layout.tsx` yang sesuai (`app/(dashboard)/layout.tsx` untuk sidebar+navbar, `app/(auth)/layout.tsx` untuk halaman login/register) — jangan duplikasi header/sidebar di tiap page.
- Komponen yang dipakai di lebih dari 1 halaman WAJIB dipindah ke `components/`, bukan copy-paste (lihat `design-standards.md`).

## Komponen
- Functional component + hooks saja. Tidak ada class component baru.
- Props divalidasi minimal lewat TypeScript interface/type eksplisit + destructuring jelas, hindari `props.xxx.yyy.zzz` bertingkat tanpa optional chaining.
- Komponen UI dasar (button, input, card, badge, dsb) pakai shadcn/ui sebagai basis, dikustomisasi lewat token Tailwind (`design-standards.md`), bukan inline style.
- Default Server Component kecuali butuh interaktivitas (event handler, hook state/effect) — baru tambahkan `"use client"` di komponen paling spesifik yang butuh, jangan taruh di level `page.tsx`/`layout.tsx` yang menyeret seluruh subtree jadi client.

## State & Data Fetching
- Data awal halaman diambil di Server Component langsung lewat service layer (`lib/services/*`), BUKAN fetch ke Route Handler sendiri dari server (hindari network hop yang tidak perlu).
- Data yang butuh refetch/polling di client (status job OCR, live update quota) pakai TanStack Query (`useQuery`/`useMutation`), bukan `useEffect` + `fetch` manual berulang.
- State UI ringan lintas komponen (mis. sidebar collapsed, dialog open) pakai Zustand store kecil di `lib/stores/`, bukan prop-drilling dalam ataupun Context yang berat.
- Form pakai `react-hook-form` + `zodResolver` dari schema yang sama dengan validasi server (`lib/validations/*`) — satu schema, dua tempat pakai (client UX + server enforcement), jangan duplikasi aturan validasi.
- Untuk pencarian/filter (Riwayat Transaksi by tanggal/toko/kategori), sinkronkan ke URL search params (`useSearchParams`/`router.push` dengan `scroll: false`) + debounce, supaya filter bisa di-share via link & browser back/forward jalan — jangan simpan filter di state lokal yang lepas dari URL.

## Styling & Aksesibilitas
- Mobile-first: desain default untuk layar kecil dulu, baru breakpoint `md:`/`lg:` untuk desktop.
- Kontras warna WAJIB memenuhi WCAG AA minimum (lihat `design-standards.md`).
- Semua form input punya `<label>` yang terasosiasi (bukan hanya placeholder).
- Gambar (foto struk, avatar) WAJIB ada `alt` text deskriptif.

## Konvensi Penamaan
- Komponen: `PascalCase.tsx`.
- Hook custom: `camelCase.ts` diawali `use` (`useDebounce.ts`, `useReceiptPolling.ts`).
- Props/variable: `camelCase`. Data dari Prisma/service (sudah `camelCase` karena field Prisma model camelCase) dipakai apa adanya di props — tidak ada transformasi snake↔camel manual.

## Loading & Empty State
- Setiap listing (Riwayat Transaksi, Dashboard Analitik) WAJIB punya:
  - Loading state via `loading.tsx` (Suspense boundary bawaan App Router) untuk initial load, dan state loading eksplisit untuk mutation (`isPending` dari `useMutation`/`useFormStatus`),
  - Empty state yang jelas ("Belum ada struk yang di-scan") — bukan tabel/grid kosong tanpa pesan.

## Alur Upload & Review OCR
- Upload struk (kamera/galeri) → kirim ke Route Handler `/api/scan` → tampilkan status polling (`useQuery` dengan `refetchInterval`) → render hasil parsing di form yang bisa diedit (`OcrReviewForm`) sebelum disimpan permanen — jangan langsung commit hasil OCR mentah ke database tanpa tahap review pengguna (lihat PRD F-02).
- Form review WAJIB pre-fill dari hasil OCR tapi tetap fully editable per field (nama item, qty, harga, kategori) — validasi Zod yang sama dipakai baik saat "Simpan" pertama kali maupun saat user mengedit riwayat lama.
