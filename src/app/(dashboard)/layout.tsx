import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/scan", label: "Scan Struk" },
  { href: "/receipts", label: "Riwayat Transaksi" },
  { href: "/settings", label: "Pengaturan" },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  // Middleware sudah redirect kalau belum login — cek ulang di server component sebagai defense-in-depth.
  if (!session?.user) redirect("/login");

  return (
    <div className="flex min-h-svh flex-col md:flex-row">
      <nav className="flex shrink-0 gap-1 overflow-x-auto border-b p-3 md:w-56 md:flex-col md:border-b-0 md:border-r">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <main className="flex-1 p-4 md:p-8">{children}</main>
    </div>
  );
}
