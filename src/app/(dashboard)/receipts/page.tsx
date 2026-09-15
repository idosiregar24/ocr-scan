import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { listReceiptsByUser } from "@/lib/services/receipt";
import { listReceiptsQuerySchema } from "@/lib/validations/receipt";
import { toReceiptDTO } from "@/lib/dto/receipt";
import { formatIDR } from "@/lib/format";
import { ReceiptCard } from "@/components/receipt-card";
import { ReceiptFilterBar } from "@/components/receipt-filter-bar";
import { EmptyState } from "@/components/empty-state";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function ReceiptsPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user) return null; // dijamin oleh (dashboard)/layout.tsx

  const raw = await searchParams;
  const parsed = listReceiptsQuerySchema.safeParse(raw);
  const query = parsed.success ? parsed.data : listReceiptsQuerySchema.parse({});

  const receipts = (await listReceiptsByUser(session.user.id, query)).map(toReceiptDTO);
  const total = receipts.reduce((sum, receipt) => sum + (receipt.total ?? 0), 0);
  const isFiltered = Boolean(query.storeName || query.status || query.from || query.to);

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground md:text-3xl">Riwayat transaksi</h1>
          <p className="text-sm text-muted-foreground">
            {receipts.length} struk · total{" "}
            <span className="font-mono font-semibold tabular-nums text-foreground">{formatIDR(total)}</span>
          </p>
        </div>
      </header>

      <Suspense fallback={<div className="h-[4.5rem] rounded-2xl bg-card ring-1 ring-foreground/10" />}>
        <ReceiptFilterBar />
      </Suspense>

      {receipts.length === 0 ? (
        isFiltered ? (
          <EmptyState
            title="Tidak ada struk yang cocok"
            description="Ubah kata kunci toko atau pilih status lain."
          />
        ) : (
          <EmptyState
            title="Belum ada struk yang di-scan"
            description="Foto struk belanja pertamamu untuk mulai mengisi riwayat ini."
            action={{ href: "/scan", label: "Scan struk pertama" }}
          />
        )
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {receipts.map((receipt) => (
            <ReceiptCard key={receipt.id} receipt={receipt} />
          ))}
        </div>
      )}
    </div>
  );
}
