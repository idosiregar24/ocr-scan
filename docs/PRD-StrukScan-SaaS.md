# 🧾 StrukScan — Product Requirements Document (PRD)

**Platform SaaS OCR Manajemen Struk & Pengeluaran**

| | |
|---|---|
| **Versi** | v1.0 — Draft Awal |
| **Tanggal** | September 2026 |
| **Status** | 🟡 In Review |
| **Penulis** | Tim Produk StrukScan |
| **Kategori** | B2C SaaS / Productivity |

---

## Daftar Isi

1. [Executive Summary](#1-executive-summary)
2. [Analisis Pasar](#2-analisis-pasar)
3. [Product Overview](#3-product-overview)
4. [Fitur Produk](#4-fitur-produk)
5. [Arsitektur Teknis](#5-arsitektur-teknis)
6. [Model Bisnis & Pricing](#6-model-bisnis--pricing)
7. [Product Roadmap](#7-product-roadmap)
8. [Non-Functional Requirements](#8-non-functional-requirements)
9. [Analisis Risiko](#9-analisis-risiko)
10. [Metrik Keberhasilan](#10-metrik-keberhasilan)
11. [Tim & Tanggung Jawab](#11-tim--tanggung-jawab)

---

## 1. Executive Summary

> **Ringkasan:** StrukScan adalah platform SaaS berbasis AI yang memungkinkan individu dan bisnis kecil mengotomatiskan pencatatan pengeluaran hanya dengan foto struk belanja, tanpa input manual.

### 1.1 Deskripsi Produk

StrukScan adalah aplikasi web dan mobile SaaS yang menggunakan teknologi OCR (Optical Character Recognition) berbasis AI untuk mengekstrak data dari foto struk belanja secara otomatis. Pengguna cukup memotret struk, dan sistem langsung menyimpan data produk yang dibeli, harga satuan, diskon, pajak, dan total ke dalam database yang terstruktur — tanpa ketik manual.

Produk ini menjawab pain point nyata: banyak individu dan pemilik UMKM yang masih mencatat pengeluaran secara manual di buku atau spreadsheet, yang tidak efisien, rawan error, dan tidak memberikan insight.

### 1.2 Problem Statement

| No | Masalah | Dampak |
|----|---------|--------|
| 1 | Pencatatan struk masih manual — tulis tangan atau spreadsheet | Memakan waktu, mudah lupa, dan error |
| 2 | Struk fisik mudah hilang atau rusak | Data pengeluaran tidak terdokumentasi dengan baik |
| 3 | Tidak ada insight dari data belanja | Sulit mengontrol keuangan dan membuat keputusan bisnis |
| 4 | Software akuntansi terlalu kompleks untuk UMKM kecil | Biaya tinggi, kurva belajar curam, overkill untuk skala kecil |

### 1.3 Proposed Solution

StrukScan menawarkan solusi tiga langkah yang sederhana:

1. **Foto** → upload struk melalui kamera ponsel atau web browser
2. **Scan** → AI membaca dan mengekstrak semua data item, harga, total secara otomatis
3. **Insight** → data tersimpan rapi, tersaji dalam dashboard laporan dan analitik pengeluaran

### 1.4 Target Go-to-Market (2026–2027)

- **Fase 1 (Q4 2026):** Beta — individu / mahasiswa / freelancer — free tier
- **Fase 2 (Q1 2027):** UMKM kecil — kantin, warung, toko kelontong — tier berbayar
- **Fase 3 (Q2 2027):** Integrasi akuntansi & ERP — B2B / enterprise kecil

---

## 2. Analisis Pasar

### 2.1 Target Market & Segmentasi

| Segmen | Deskripsi | Ukuran Est. | Prioritas |
|--------|-----------|-------------|-----------|
| **Individu / Mahasiswa** | Usia 18–35, sadar finansial, sudah terbiasa menggunakan aplikasi ponsel | ~45 juta (Indonesia) | 🔴 P1 |
| **UMKM Retail Kecil** | Warung, toko kelontong, kantin — butuh pencatatan pembelian stok sederhana | ~64 juta unit (Indonesia) | 🔴 P1 |
| **Freelancer / Solopreneur** | Butuh dokumentasi pengeluaran untuk klaim pajak atau laporan klien | ~5 juta (Indonesia) | 🟡 P2 |
| **Finance Manager UMKM** | Butuh konsolidasi struk dari multiple kasir/cabang | ~2 juta bisnis | 🟡 P2 |

### 2.2 Competitive Analysis

| Produk | Kekuatan | Kelemahan vs StrukScan | Harga |
|--------|----------|------------------------|-------|
| **StrukScan** | OCR AI native, UI sederhana, harga terjangkau, bahasa Indonesia | — | Freemium |
| Expense report manual (Excel) | Gratis, fleksibel | Manual, tidak ada OCR, tidak ada insight otomatis | Gratis |
| Jurnal / Bukukas | Brand kuat di Indonesia, fitur akuntansi lengkap | Terlalu kompleks untuk kasual, mahal, bukan OCR-first | Rp 200K+/bln |
| Expensify (global) | OCR bagus, terintegrasi akuntansi global | Tidak lokalisasi Indonesia, mahal, UI kompleks | $5–18/user |
| Evernote Scan | Ekosistem Evernote luas | Bukan fokus keuangan, tidak ada parsing item | $7.99/bln |

> **Keunggulan Kompetitif:** StrukScan adalah satu-satunya produk yang menggabungkan OCR AI, parsing item-level (bukan hanya total), laporan analitik, dan harga terjangkau dalam satu platform yang dilokalisasi untuk pasar Indonesia.

---

## 3. Product Overview

### 3.1 Visi & Misi Produk

| | Pernyataan |
|---|---|
| 🎯 **Visi** | *"Menjadi platform pengelolaan pengeluaran berbasis AI yang paling mudah digunakan oleh individu dan UMKM di Asia Tenggara."* |
| 🚀 **Misi** | *"Menghilangkan kerumitan pencatatan keuangan dengan teknologi OCR yang cerdas, sehingga setiap orang bisa fokus pada pertumbuhan, bukan administrasi."* |

### 3.2 User Personas

#### Persona 1 — "Rina, Mahasiswi Kos" (Primary)
- Usia 21 tahun, mahasiswi, uang jajan terbatas
- Sering bingung *"kemana aja duit aku pergi?"* di akhir bulan
- Terbiasa pakai ponsel, tidak suka buka laptop untuk hal remeh
- **Goal:** tahu pengeluaran harian tanpa ribet catat manual

#### Persona 2 — "Pak Hendra, Pemilik Warung Makan" (Secondary)
- Usia 42 tahun, pemilik warung, belanja bahan baku tiap pagi di pasar
- Sering kehilangan struk, pembukuan masih di buku tulis
- **Goal:** rekap pengeluaran belanja bahan otomatis, bisa dilaporkan ke istri / mitra

#### Persona 3 — "Dian, Finance UMKM" (Tertiary)
- Usia 28 tahun, mengelola keuangan bisnis catering kecil
- Harus konsolidasi struk dari 3 orang belanja setiap minggu
- **Goal:** laporan pengeluaran bersih, siap untuk audit atau laporan pajak

### 3.3 User Journey Map

| Fase | Aksi Pengguna | Touchpoint | Pain Point |
|------|--------------|-----------|------------|
| **1. Aware** | Mencari solusi pencatatan struk di Google / medsos | Google Search, Instagram, TikTok | Banyak pilihan tidak jelas, kebanyakan mahal |
| **2. Signup** | Daftar akun free, verifikasi email | Landing page, form registrasi | Proses onboarding yang panjang |
| **3. First Scan** | Upload foto struk pertama, lihat hasil parsing | Web/App — upload interface | Hasil OCR tidak akurat / lambat |
| **4. Habit** | Rutin scan struk setelah belanja | Notifikasi reminder, widget | Lupa scan, tidak ada pengingat |
| **5. Upgrade** | Kehabisan kuota scan free, upgrade ke Pro | Pricing page, payment gateway | Ragu nilai Pro vs biaya |
| **6. Advocacy** | Rekomendasikan ke teman / rekan bisnis | Referral program, review app store | Tidak ada insentif untuk share |

---

## 4. Fitur Produk

### 4.1 Feature List & Prioritas (MoSCoW)

| ID | Fitur | Deskripsi | MoSCoW | Tier |
|----|-------|-----------|--------|------|
| F-01 | **OCR Upload Struk** | Upload foto struk, AI parsing item, harga, total secara otomatis | 🔴 Must | Free |
| F-02 | **Manual Edit Hasil OCR** | Edit nama item, qty, harga sebelum disimpan | 🔴 Must | Free |
| F-03 | **Database Transaksi** | Simpan semua struk dengan metadata lengkap (toko, tanggal, kasir, metode bayar) | 🔴 Must | Free |
| F-04 | **Riwayat Transaksi** | List semua transaksi, filter by tanggal / toko, detail per struk | 🔴 Must | Free |
| F-05 | **Auth & Multi-user** | Registrasi, login, OAuth Google/GitHub, manajemen sesi | 🔴 Must | Free |
| F-06 | **Dashboard Analitik** | Total pengeluaran, rata-rata, toko favorit, produk paling sering dibeli | 🔴 Must | Free |
| F-07 | **Export CSV / Excel** | Download laporan transaksi dalam format CSV atau XLSX | 🟡 Should | Pro |
| F-08 | **Kategori Otomatis AI** | AI mengkategorikan item (Makanan, Minuman, ATK, dll) secara otomatis | 🟡 Should | Pro |
| F-09 | **Budget Alert** | Notifikasi email/push ketika pengeluaran mendekati batas budget bulanan | 🟡 Should | Pro |
| F-10 | **Laporan PDF Bulanan** | Generate laporan pengeluaran bulanan dalam format PDF siap cetak | 🟡 Should | Pro |
| F-11 | **Multi-mata Uang** | Dukungan IDR, MYR, SGD, USD — konversi otomatis | 🟡 Should | Pro |
| F-12 | **Tim / Workspace** | Multiple user dalam satu workspace bisnis, role admin/member | 🟢 Could | Biz |
| F-13 | **API Publik** | REST API untuk integrasi dengan sistem akuntansi eksternal (Jurnal, Accurate) | 🟢 Could | Biz |
| F-14 | **Scan via WhatsApp Bot** | Kirim foto struk ke WhatsApp bot, data masuk otomatis | 🟢 Could | Biz |
| F-15 | **AI Financial Advisor** | Saran penghematan berbasis pola belanja pengguna | ⚪ Won't (v1) | v2 |

### 4.2 Alur Utama — OCR Scan Struk (Happy Path)

```
1. Pengguna buka halaman Scan Struk di web/mobile
2. Upload foto struk (kamera langsung atau pilih dari galeri)
3. Sistem kirim gambar ke AI OCR engine (Gemini Vision API)
4. AI kembalikan JSON terstruktur:
   { store_name, date, items[], subtotal, discount, tax, total }
5. Sistem tampilkan hasil dalam form yang bisa diedit pengguna
6. Pengguna review → koreksi jika perlu → klik Simpan
7. Data tersimpan ke DB → muncul di riwayat dan analitik
```

---

## 5. Arsitektur Teknis

### 5.1 Tech Stack

| Layer | Teknologi | Justifikasi |
|-------|-----------|-------------|
| **Framework Fullstack** | Next.js 15 (App Router) | SSR + SSG + API Routes dalam satu project, deployment mudah ke Vercel |
| **Bahasa** | TypeScript | Type safety end-to-end, mengurangi bug runtime, DX lebih baik |
| **Styling** | Tailwind CSS v4 + shadcn/ui | Utility-first, komponen siap pakai, konsisten di seluruh UI |
| **Database ORM** | Prisma + PostgreSQL (Neon / Supabase) | Type-safe queries, schema migration otomatis, serverless-friendly |
| **Auth** | NextAuth.js v5 (Auth.js) | OAuth Google/GitHub, session management, built-in untuk Next.js |
| **AI / OCR Engine** | Gemini Vision API (Google) | Akurasi tinggi untuk dokumen tidak terstruktur, support Bahasa Indonesia, tier gratis tersedia untuk development |
| **File Storage** | Cloudflare R2 / AWS S3 | Object storage murah untuk menyimpan foto struk original |
| **Queue / Worker** | Trigger.dev / BullMQ + Redis | Proses OCR async agar tidak block request, retry otomatis |
| **Billing** | Stripe + Midtrans (via custom integration) | Stripe untuk kartu internasional, Midtrans untuk QRIS & transfer lokal |
| **Email** | Resend + React Email | Kirim email transaksional dengan template berbasis React component |
| **Validasi** | Zod | Schema validation yang type-safe, dipakai di API route dan form |
| **State Management** | Zustand / TanStack Query | Client state ringan + server state caching untuk data fetching |
| **Hosting** | Vercel (frontend + API) + Railway (worker) | Zero-config deploy Next.js, auto-scaling, preview per PR |
| **Monitoring** | Sentry + Vercel Analytics | Error tracking real-time, performance monitoring built-in |

### 5.2 Database Schema — Tabel Utama

| Tabel | Kolom Utama | Relasi |
|-------|-------------|--------|
| `users` | id, name, email, password, plan (free\|pro\|biz), quota_used, stripe_customer_id, timestamps | has many receipts, workspaces |
| `receipts` | id, user_id, workspace_id, store_name, date, receipt_no, cashier, payment_method, image_url, subtotal, discount, tax, total, ocr_raw (JSON), timestamps | belongs to user; has many receipt_items |
| `receipt_items` | id, receipt_id, name, qty, unit_price, subtotal, category, timestamps | belongs to receipt |
| `workspaces` | id, owner_id, name, plan, member_limit, timestamps | has many users (pivot), receipts |
| `categories` | id, user_id, name, color, icon, budget_limit, timestamps | has many receipt_items |
| `subscriptions` | id, user_id, stripe_id, stripe_status, stripe_price, trial_ends_at, ends_at, timestamps | belongs to user (via Cashier) |

### 5.3 Alur OCR — Sequence

```
Client (Next.js)    API Route           Trigger.dev       Gemini API      DB (Prisma)
  │                     │                    │                 │               │
  │── POST /api/scan ──►│                    │                 │               │
  │   FormData {image}  │                    │                 │               │
  │                     │── upload R2 ──────►│                 │               │
  │                     │── trigger job ────►│                 │               │
  │◄── 202 + jobId ─────│                    │                 │               │
  │                     │                    │── fetch image ─►│               │
  │                     │                    │                 │               │
  │                     │                    │── Gemini Vision►│               │
  │                     │                    │◄── JSON ────────│               │
  │                     │                    │── prisma.create►│               │
  │                     │                    │                 │               │
  │◄── polling /api/job/:id ────────────────────────────────── │               │
  │    { status: done, data }               │                 │               │
```

> **Catatan Teknis:** OCR diproses secara asynchronous via Trigger.dev job untuk menghindari timeout serverless function (batas 10–30 detik di Vercel). Estimasi waktu proses: 3–8 detik per struk. Client melakukan polling tiap 2 detik atau bisa pakai Server-Sent Events (SSE) untuk notifikasi real-time.

---

## 6. Model Bisnis & Pricing

### 6.1 Pricing Tiers

| Fitur | Free | Pro | Business |
|-------|------|-----|----------|
| **Harga** | Rp 0 / bulan | **Rp 29.000 / bulan** | **Rp 99.000 / bulan** |
| Kuota Scan | 20 scan / bulan | 500 scan / bulan | Unlimited |
| Riwayat Transaksi | 3 bulan terakhir | Unlimited | Unlimited |
| Export CSV/Excel | ✕ | ✓ | ✓ |
| Laporan PDF | ✕ | ✓ | ✓ |
| Kategori Otomatis AI | ✕ | ✓ | ✓ |
| Budget Alert | ✕ | ✓ | ✓ |
| Anggota Tim | 1 (diri sendiri) | 1 (diri sendiri) | Hingga 10 user |
| API Access | ✕ | ✕ | ✓ |
| Prioritas Support | Community | Email (48 jam) | Priority (8 jam) |

### 6.2 Revenue Model

- Subscription bulanan / tahunan (diskon 20% untuk tahunan)
- Add-on scan pack: Rp 15.000 untuk 100 scan extra (Free tier)
- White-label enterprise: negosiasi custom untuk bisnis >50 user

### 6.3 Unit Economics (Proyeksi Awal)

| Metrik | Target 6 Bulan | Target 12 Bulan |
|--------|----------------|-----------------|
| Total Pengguna Terdaftar | 500 | 3.000 |
| Konversi Free → Pro | 5% | 8% |
| Paying Customers | 25 | 240 |
| MRR (Monthly Recurring Revenue) | Rp 725.000 | Rp 7.000.000 |
| Cost per OCR call (Claude API) | ~Rp 150–250 / scan | Menurun seiring volume |
| Churn Rate Target | < 10% / bulan | < 6% / bulan |

---

## 7. Product Roadmap

### 7.1 Release Plan

| Fase | Periode | Goal | Deliverables Utama |
|------|---------|------|--------------------|
| 🔴 **MVP** | Q4 2026 (3 bln) | Validasi core OCR + retensi early adopter | Auth, OCR scan, riwayat, dashboard dasar, free tier |
| 🟡 **v1.0** | Q1 2027 (3 bln) | Monetisasi pertama — 25 paying customers | Pro tier, export CSV/PDF, kategori AI, budget alert, payment gateway |
| 🔵 **v1.5** | Q2 2027 (3 bln) | Ekspansi ke B2B kecil — UMKM | Business tier, workspace tim, multi-user, API publik v1 |
| 🟢 **v2.0** | Q3–Q4 2027 | Platform ekosistem — integrasi & AI advisor | WhatsApp bot, integrasi Jurnal/Accurate, AI financial advisor |

### 7.2 MVP Scope

| ✅ Masuk MVP | ❌ Tidak Masuk MVP |
|-------------|------------------|
| Registrasi & login (email + Google OAuth) | Workspace tim / multi-user |
| Upload & OCR struk (Gemini Vision) | Export CSV/PDF |
| Edit manual hasil OCR | Budget alert & notifikasi |
| Simpan ke database (items, harga, total) | Kategori otomatis AI |
| Riwayat transaksi (list + detail) | API publik |
| Dashboard analitik dasar (total, toko, produk) | Mobile native app (hanya PWA dulu) |
| Manajemen akun & profil | Integrasi akuntansi eksternal |

---

## 8. Non-Functional Requirements

| Dimensi | Target | Cara Ukur |
|---------|--------|-----------|
| **Akurasi OCR** | >90% field-level accuracy (struk jelas) | Benchmark 100 struk sample per sprint |
| **Response Time OCR** | < 10 detik end-to-end (P95) | APM monitoring, Sentry performance |
| **Uptime** | 99.5% SLA | UptimeRobot / Betterstack monitoring |
| **Skalabilitas** | Hingga 10.000 concurrent users tanpa degradasi | Load testing dengan k6 sebelum tiap rilis besar |
| **Keamanan Data** | Enkripsi at-rest (AES-256) dan in-transit (TLS 1.3) | Security audit, OWASP checklist |
| **GDPR / Data Privacy** | Comply UU PDP Indonesia, user bisa hapus akun + data | Privacy policy, data deletion endpoint |
| **Aksesibilitas** | WCAG 2.1 Level AA minimum | Axe / Lighthouse audit per sprint |

---

## 9. Analisis Risiko

| ID | Risiko | Probabilitas | Dampak | Mitigasi |
|----|--------|-------------|--------|----------|
| R-01 | Akurasi OCR rendah untuk struk buram/miring | 🔴 Tinggi | 🔴 Tinggi | Image preprocessing (deskew, denoise), fallback ke manual edit, panduan foto ke user |
| R-02 | Biaya API Claude/OpenAI naik signifikan | 🟡 Sedang | 🔴 Tinggi | Rate limiting ketat, caching hasil OCR, evaluasi model open-source (Tesseract hybrid) |
| R-03 | Kompetitor besar masuk pasar dengan fitur serupa gratis | 🟡 Sedang | 🔴 Tinggi | Fokus niche Indonesia, lokalisasi mendalam, community building |
| R-04 | Retensi rendah — pengguna scan sekali lalu churn | 🔴 Tinggi | 🟡 Sedang | Reminder push/email, gamifikasi (streak), insight mingguan otomatis |
| R-05 | Kebocoran data foto struk (PII sensitif) | 🟢 Rendah | 🔴 Sangat Tinggi | Enkripsi S3, IAM roles minimum privilege, audit log, opsi auto-delete foto setelah OCR |
| R-06 | Payment gateway gagal atau fraud | 🟢 Rendah | 🟡 Sedang | Multi-gateway (Stripe + Midtrans), fraud monitoring, dunning management via Cashier |

---

## 10. Metrik Keberhasilan

### 10.1 North Star Metric

> **"Jumlah struk yang berhasil di-scan dan tersimpan per bulan"** — metrik ini merepresentasikan nilai inti yang diberikan produk kepada pengguna secara langsung.

### 10.2 KPI Utama per Fase

| Kategori | Metrik | MVP Target | v1.0 Target | Cara Ukur |
|----------|--------|-----------|-------------|-----------|
| **Akuisisi** | Pengguna terdaftar baru / bulan | 100 | 500 | Analytics |
| | Conversion rate landing page → signup | >3% | >5% | GA4 |
| **Aktivasi** | % user lakukan scan pertama dalam 24 jam | >60% | >70% | Mixpanel |
| | Akurasi OCR (item-level) | >85% | >90% | QA eval |
| **Retensi** | Day-7 retention | >30% | >40% | Mixpanel |
| | Day-30 retention | >15% | >25% | Mixpanel |
| | Scan / user aktif / bulan | >8 | >15 | DB query |
| **Pendapatan** | MRR | Rp 0 (MVP) | Rp 3 juta | Stripe |
| | Free → Pro conversion | N/A | >5% | Analytics |
| | Monthly Churn Rate | N/A | <10% | Stripe |

---

## 11. Tim & Tanggung Jawab

| Role | Tanggung Jawab | Prioritas Awal |
|------|----------------|----------------|
| **Product Manager** | PRD, roadmap, prioritas fitur, stakeholder alignment | Roadmap & metric tracking |
| **Fullstack Developer (Lead)** | Arsitektur, backend Laravel, API, integrasi OCR, database | OCR pipeline & auth |
| **Frontend Developer** | React UI, Inertia.js, komponen, responsiveness | Upload + dashboard UI |
| **UI/UX Designer** | Wireframe, prototype Figma, user testing, design system | Flow onboarding & scan |
| **QA / Tester** | Test akurasi OCR, regression test, bug reporting | OCR accuracy benchmark |

---

*Dokumen ini bersifat living document — akan diperbarui setiap iterasi sprint dan saat ada perubahan signifikan pada arah produk.*

*StrukScan PRD v1.0 — September 2026 — Confidential*
