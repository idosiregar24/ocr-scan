import { Check } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MONTHLY_QUOTA, PLAN_LABEL } from "@/lib/constants/plan";
import { Button } from "@/components/ui/button";
import { QuotaMeter } from "@/components/quota-meter";

const PRO_PERKS = [
  "500 scan per bulan",
  "Riwayat transaksi tanpa batas waktu",
  "Export CSV, Excel, dan laporan PDF",
  "Kategori otomatis AI & budget alert",
];

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) return null; // dijamin oleh (dashboard)/layout.tsx

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: { name: true, email: true, plan: true, quotaUsed: true, createdAt: true },
  });

  const limit = MONTHLY_QUOTA[user.plan];

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-extrabold text-foreground md:text-3xl">Pengaturan</h1>
        <p className="text-sm text-muted-foreground">Kelola akun dan langgananmu.</p>
      </header>

      <section className="rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
        <h2 className="text-base font-bold text-foreground">Profil</h2>
        <dl className="mt-4 divide-y text-sm">
          <div className="flex justify-between gap-4 py-2.5">
            <dt className="text-muted-foreground">Nama</dt>
            <dd className="font-semibold text-foreground">{user.name ?? "—"}</dd>
          </div>
          <div className="flex justify-between gap-4 py-2.5">
            <dt className="text-muted-foreground">Email</dt>
            <dd className="truncate font-semibold text-foreground">{user.email}</dd>
          </div>
          <div className="flex justify-between gap-4 py-2.5">
            <dt className="text-muted-foreground">Bergabung</dt>
            <dd className="font-mono tabular-nums text-foreground">
              {new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(user.createdAt)}
            </dd>
          </div>
        </dl>
      </section>

      <section className="rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-bold text-foreground">Paket {PLAN_LABEL[user.plan]}</h2>
          <p className="font-mono text-sm tabular-nums text-muted-foreground">
            {limit === null ? "Scan tanpa batas" : `${user.quotaUsed} dari ${limit} scan terpakai`}
          </p>
        </div>
        <QuotaMeter plan={user.plan} quotaUsed={user.quotaUsed} className="mt-4" />
      </section>

      {user.plan === "FREE" && (
        <section className="rounded-2xl bg-ink p-5 text-ink-foreground">
          <p className="text-xs font-semibold tracking-wide uppercase text-ink-foreground/60">Upgrade</p>
          <h2 className="mt-1 text-xl font-extrabold">Pro — Rp 29.000 / bulan</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {PRO_PERKS.map((perk) => (
              <li key={perk} className="flex items-start gap-2">
                <Check className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
                {perk}
              </li>
            ))}
          </ul>
          <Button size="xl" variant="accent" className="mt-5 w-full sm:w-auto" disabled>
            Upgrade ke Pro
          </Button>
          <p className="mt-2 text-xs text-ink-foreground/60">
            Pembayaran Stripe & Midtrans belum aktif — menyusul di rilis berikutnya.
          </p>
        </section>
      )}
    </div>
  );
}
