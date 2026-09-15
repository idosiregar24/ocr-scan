import Link from "next/link";
import { redirect } from "next/navigation";
import { Camera } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { BrandWordmark } from "@/components/brand-mark";
import { DashboardSidebarNav, DashboardTabBar } from "@/components/dashboard-nav";
import { QuotaMeter } from "@/components/quota-meter";
import { UserMenu } from "@/components/user-menu";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  // Middleware sudah redirect kalau belum login — cek ulang di server component sebagai defense-in-depth.
  if (!session?.user) redirect("/login");

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: { name: true, email: true, image: true, plan: true, quotaUsed: true },
  });

  return (
    <div className="flex min-h-svh flex-col bg-background md:flex-row">
      <aside className="sticky top-0 hidden h-svh w-64 shrink-0 flex-col justify-between border-r bg-sidebar p-4 md:flex">
        <div className="flex flex-col gap-6">
          <Link href="/dashboard" className="px-1">
            <BrandWordmark />
          </Link>
          <DashboardSidebarNav />
        </div>
        <div className="flex flex-col gap-3">
          <QuotaMeter plan={user.plan} quotaUsed={user.quotaUsed} />
          <Button asChild size="xl" variant="accent">
            <Link href="/scan">
              <Camera data-icon="inline-start" aria-hidden />
              Scan struk
            </Link>
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b bg-background/95 px-4 py-2.5 backdrop-blur md:px-8">
          <Link href="/dashboard" className="md:hidden">
            <BrandWordmark />
          </Link>
          <div className="hidden md:block" />
          <UserMenu name={user.name} email={user.email} image={user.image} />
        </header>

        {/* pb ekstra di mobile supaya konten terakhir tidak tertutup tab bar. */}
        <main className="flex-1 px-4 pt-5 pb-24 md:px-8 md:pt-8 md:pb-10">{children}</main>
      </div>

      <DashboardTabBar />
    </div>
  );
}
