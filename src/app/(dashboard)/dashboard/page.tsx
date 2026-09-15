import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { listReceiptsByUser } from "@/lib/services/receipt";
import { listReceiptsQuerySchema } from "@/lib/validations/receipt";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatIDR } from "@/lib/format";

// Free 20/bln, Pro 500/bln — duplikat dari lib/services/receipt.ts, TODO: extract ke lib/constants/plan.ts saat quota-alert (F-09) digarap.
const MONTHLY_QUOTA: Record<"FREE" | "PRO" | "BIZ", number | null> = { FREE: 20, PRO: 500, BIZ: null };

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) return null;

  const [receipts, user] = await Promise.all([
    listReceiptsByUser(session.user.id, listReceiptsQuerySchema.parse({ take: 100 })),
    prisma.user.findUniqueOrThrow({ where: { id: session.user.id } }),
  ]);
  const totalSpend = receipts.reduce((sum, r) => sum + (r.total ? Number(r.total) : 0), 0);
  const quotaLimit = MONTHLY_QUOTA[user.plan];
  const quotaRemaining = quotaLimit === null ? "Unlimited" : Math.max(quotaLimit - user.quotaUsed, 0);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Pengeluaran</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{formatIDR(totalSpend)}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Struk Ter-scan</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{receipts.length}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Kuota Scan Tersisa</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{quotaRemaining}</CardContent>
        </Card>
      </div>
    </div>
  );
}
