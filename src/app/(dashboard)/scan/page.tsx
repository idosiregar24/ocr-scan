import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { quotaRemaining } from "@/lib/constants/plan";
import { ScanFlow } from "./scan-flow";

export default async function ScanPage() {
  const session = await auth();
  if (!session?.user) return null; // dijamin oleh (dashboard)/layout.tsx

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: { plan: true, quotaUsed: true },
  });

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-extrabold text-foreground md:text-3xl">Scan struk</h1>
        <p className="text-sm text-muted-foreground">
          Foto struknya, AI yang membaca item dan harganya. Kamu tinggal periksa sebelum disimpan.
        </p>
      </header>

      <ScanFlow quotaRemaining={quotaRemaining(user.plan, user.quotaUsed)} />
    </div>
  );
}
