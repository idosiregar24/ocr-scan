# Design Standards (Tailwind CSS v4 + shadcn/ui)

> Catatan: PRD StrukScan (`docs/PRD-StrukScan-SaaS.md`) belum menetapkan brand color palette resmi (beda dengan project sebelumnya yang punya Brand Guidelines eksplisit). Palet di bawah adalah default sementara berbasis prinsip fintech/productivity SaaS (trust + clarity) — pakai ini sampai ada keputusan resmi dari user (Product Manager). JANGAN treat sebagai final brand identity.

## Prinsip Umum
- Konsisten pakai shadcn/ui sebagai basis komponen (`Button`, `Card`, `Input`, `Dialog`, dst) via CLI (`npx shadcn add <component>`), kustomisasi lewat CSS variable di `app/globals.css` + `tailwind.config.ts` — bukan style inline atau override class ad-hoc di tiap halaman.
- Ikon pakai `lucide-react` secara konsisten, jangan campur beberapa icon set berbeda.
- Semua nilai warna, radius, spacing skala didefinisikan sebagai design token (CSS variable), dipanggil lewat utility Tailwind (`bg-primary`, `text-muted-foreground`) — hindari hardcode hex/rgb di komponen.

## Palet Warna Default (placeholder, pending konfirmasi brand)
| Token | Peran | Referensi |
|---|---|---|
| `--primary` | Aksi utama (tombol Scan, CTA upgrade Pro), brand identity | Indigo/blue (`#2563EB` area) — kesan trust & finansial |
| `--secondary` | Elemen struktural sekunder (badge kategori, header card) | Slate netral |
| `--accent` | State aktif/hover, highlight hasil OCR yang butuh review | Cyan/teal |
| `--warning` | Budget alert mendekati limit, quota scan hampir habis | Amber |
| `--destructive` | Aksi hapus struk, error validasi | Red |
| `--background` / `--muted` | Latar utama & area istirahat visual (card, table zebra) | Putih/near-white (light), slate-950 (dark) |

Jangan tambah warna baru di luar token ini tanpa update file ini — cegah palet "liar" antar halaman.

## Komponen
- Komponen yang dipakai di lebih dari 1 halaman WAJIB dipindah ke `components/` (custom) atau `components/ui/` (shadcn base), bukan copy-paste antar `app/**/page.tsx`.
- Sebelum membuat komponen baru, cek dulu `components/` — kalau ada yang serupa (mis. `Card` generik), extend/compose lewat props, jangan duplikasi nama beda tipis.
- Komponen spesifik alur scan (`ReceiptUploadDropzone`, `OcrReviewForm`, `ReceiptItemRow`) harus reusable antara flow "scan baru" dan "edit struk lama".

## Mobile-First & Responsif
- Desain default untuk layar kecil (≥375px) dulu, baru breakpoint `md:`/`lg:` untuk desktop — mayoritas user (persona Rina, Pak Hendra) akses dari HP.
- Flow scan struk (kamera → hasil OCR → edit → simpan) harus tetap 1 alur linear yang nyaman di layar HP, bukan layout desktop yang di-squeeze.

## Aksesibilitas
- Kontras warna WAJIB memenuhi WCAG 2.1 AA minimum (PRD §8 NFR) — cek khusus teks di atas `--primary`/`--accent`.
- Semua form input (termasuk hasil edit OCR) punya `<label>` yang terasosiasi, bukan hanya placeholder.
- Foto struk (thumbnail riwayat, preview upload) WAJIB ada `alt` text deskriptif (mis. `Struk dari {store_name}, {date}`).

## Loading & Empty State
- Setiap listing (Riwayat Transaksi, Dashboard Analitik) WAJIB punya:
  - Loading/skeleton state saat data atau filter berubah,
  - Loading state khusus untuk polling job OCR ("Memproses struk..." dengan indikator progres, bukan spinner generik tanpa konteks),
  - Empty state yang jelas ("Belum ada struk yang di-scan bulan ini") — bukan grid/tabel kosong tanpa pesan.

## Format Angka & Mata Uang
- Format IDR pakai `Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' })` secara konsisten di seluruh UI (dashboard, riwayat, invoice) — jangan format manual per komponen.
