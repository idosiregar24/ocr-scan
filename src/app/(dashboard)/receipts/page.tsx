import { auth } from "@/lib/auth";
import { listReceiptsByUser } from "@/lib/services/receipt";
import { listReceiptsQuerySchema } from "@/lib/validations/receipt";
import { toReceiptDTO } from "@/lib/dto/receipt";
import { ReceiptCard } from "@/components/receipt-card";
import { EmptyState } from "@/components/empty-state";

export default async function ReceiptsPage() {
  const session = await auth();
  if (!session?.user) return null; // dijamin oleh (dashboard)/layout.tsx

  const query = listReceiptsQuerySchema.parse({});
  const receipts = await listReceiptsByUser(session.user.id, query);
  const items = receipts.map(toReceiptDTO);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold text-foreground">Riwayat Transaksi</h1>

      {items.length === 0 ? (
        <EmptyState
          title="Belum ada struk yang di-scan"
          description="Mulai scan struk pertamamu untuk melihat riwayat transaksi di sini."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((receipt) => (
            <ReceiptCard key={receipt.id} receipt={receipt} />
          ))}
        </div>
      )}
    </div>
  );
}
