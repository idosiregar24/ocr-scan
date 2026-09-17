-- CreateEnum
CREATE TYPE "BillStatus" AS ENUM ('UNPAID', 'PAID');

-- CreateTable
CREATE TABLE "bills" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "receipt_id" TEXT,
    "bill_no" TEXT NOT NULL,
    "vendor" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "issued_at" TIMESTAMP(3),
    "status" "BillStatus" NOT NULL DEFAULT 'UNPAID',
    "paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bills_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bills_receipt_id_key" ON "bills"("receipt_id");

-- CreateIndex
CREATE INDEX "bills_user_id_bill_no_idx" ON "bills"("user_id", "bill_no");

-- CreateIndex
CREATE INDEX "bills_user_id_status_idx" ON "bills"("user_id", "status");

-- CreateIndex
CREATE INDEX "bills_status_idx" ON "bills"("status");

-- AddForeignKey
ALTER TABLE "bills" ADD CONSTRAINT "bills_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bills" ADD CONSTRAINT "bills_receipt_id_fkey" FOREIGN KEY ("receipt_id") REFERENCES "receipts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

