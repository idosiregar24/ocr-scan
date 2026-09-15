# Database Standards (Prisma + PostgreSQL)

## Penamaan
- Tabel fisik: `snake_case`, plural, di-map eksplisit dari model Prisma lewat `@@map("receipt_items")`.
- Model Prisma: singular, `PascalCase` (`Receipt`, `ReceiptItem`, `Workspace`) — bukan nama tabel jamak.
- Primary key: `id` — pakai `String @id @default(cuid())` untuk entity yang URL/ID-nya bisa terekspos ke publik atau lintas sistem (`Receipt`, `Workspace`), `Int @id @default(autoincrement())` boleh untuk tabel internal murni (mis. `ReceiptItem` kalau tidak pernah diakses langsung by ID).
- Foreign key: `<singular_model>Id` di level Prisma (`userId`, `receiptId`), kolom fisik tetap `snake_case` via `@map("user_id")`.
- Kolom boolean: prefix `is`/`has` (`isApproved`, `hasBusiness`) → `@map` ke `is_approved`/`has_business`.
- Kolom enum status pakai Prisma `enum` eksplisit (`enum ReceiptStatus { PENDING PROCESSING DONE FAILED }`), bukan string bebas — enum value konsisten UPPER_SNAKE di schema, `@map` ke lowercase snake di DB kalau perlu konsistensi dengan konvensi existing.
- Timestamp: `createdAt DateTime @default(now())` dan `updatedAt DateTime @updatedAt` selalu ada, kecuali pivot table sederhana tanpa metadata tambahan.

## Migration
- Satu migration (`prisma migrate dev --name ...`) = satu perubahan skema yang logis (jangan gabung create table tidak berelasi dalam 1 migration).
- Migration yang SUDAH di-apply di environment tim TIDAK BOLEH diedit manual di folder `prisma/migrations/` — buat migration baru (`add_..._to_..._table`, `drop_..._from_..._table`) via `prisma migrate dev`.
- Selalu definisikan `onDelete` eksplisit di setiap relasi (`onDelete: Cascade` atau `SetNull` sesuai kebutuhan) — jangan biarkan default Prisma (`Restrict`) implisit tanpa dipikir.
- `prisma db push` HANYA untuk eksperimen lokal cepat, TIDAK PERNAH dipakai sebagai pengganti migration di branch yang akan di-PR.
- Index (`@@index([...])`) wajib untuk kolom yang sering jadi filter: `userId`, `workspaceId`, `date`, `status`, `category`, dan semua foreign key.

## Relasi Utama (ringkas — detail di PRD §5.2)
- `User` 1—N `Receipt` (pemilik struk)
- `User` 1—N `Workspace` (sebagai owner) + M—N `Workspace` (sebagai member, lewat pivot `WorkspaceMember` dengan kolom `role`)
- `Receipt` 1—N `ReceiptItem`
- `Receipt` N—1 `Workspace` (nullable — struk personal tidak punya workspace)
- `Category` 1—N `ReceiptItem`
- `User` 1—1 `Subscription` (status billing Stripe/Midtrans)

## Data Sensitif
- Password (untuk credential login non-OAuth) selalu di-hash (bcrypt/argon2), tidak pernah dikirim ke client lewat DTO/response mapper.
- `stripeCustomerId`, token OAuth, dan session token tidak pernah ikut di-serialize ke response API — selalu lewat mapper eksplisit (lihat `backend-standards.md`), jangan `return user` mentah dari Prisma.
- `image_url` foto struk disimpan sebagai path/key di storage (R2/S3), bukan URL publik permanen — generate signed URL saat diakses, sesuai kebutuhan privasi PII di PRD (risiko R-05).

## Seeder
- `prisma/seed.ts` untuk data referensi (default `Category` per user baru, dsb.) wajib idempotent (`upsert`), aman dijalankan berulang.
- Seeder data dummy (demo receipts/users) hanya untuk environment lokal/staging (`NODE_ENV !== 'production'`), tidak pernah dijalankan otomatis di production.
