import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Camera,
  Check,
  FileSpreadsheet,
  PencilLine,
  PieChart,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandWordmark } from "@/components/brand-mark";
import { ReceiptShowcase } from "@/components/marketing/receipt-showcase";

const STORES = ["Indomaret", "Alfamart", "Superindo", "Hypermart", "Warung kopi", "Apotek K-24", "Ace Hardware"];

// Urutan memang berarti di sini — tiga langkah yang dilalui user secara berurutan.
const STEPS = [
  {
    title: "Foto struknya",
    body: "Langsung dari kamera HP atau ambil dari galeri. Struk kusut dan cetakan tipis tetap terbaca.",
    icon: Camera,
  },
  {
    title: "AI membaca isinya",
    body: "Nama item, qty, harga satuan, diskon, pajak, dan total diekstrak dalam hitungan detik.",
    icon: PieChart,
  },
  {
    title: "Periksa lalu simpan",
    body: "Hasilnya bisa diedit per baris sebelum masuk riwayat, jadi angkamu tidak pernah asal.",
    icon: PencilLine,
  },
];

const PLANS = [
  {
    name: "Free",
    price: "Rp 0",
    note: "selamanya",
    perks: ["20 scan per bulan", "Riwayat 3 bulan terakhir", "Edit manual hasil OCR"],
    cta: "Mulai gratis",
    href: "/register",
  },
  {
    name: "Pro",
    price: "Rp 29.000",
    note: "per bulan",
    perks: [
      "500 scan per bulan",
      "Riwayat tanpa batas waktu",
      "Export CSV, Excel, laporan PDF",
      "Kategori otomatis AI & budget alert",
    ],
    cta: "Coba Pro",
    href: "/register",
    featured: true,
  },
  {
    name: "Business",
    price: "Rp 99.000",
    note: "per bulan",
    perks: ["Scan tanpa batas", "Workspace hingga 10 anggota", "Akses API", "Support prioritas 8 jam"],
    cta: "Hubungi kami",
    href: "/register",
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <section className="relative text-white">
        {/* Background Image Hero */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <Image
            src="/bg2.png"
            alt="Hero Background"
            fill
            priority
            className="object-cover object-center"
          />
          {/* Subtle soft gradient at the top so header & white text pop without darkening the scene */}
          <div className="absolute inset-0 bg-gradient-to-b from-sky-900/30 via-transparent to-black/20" />
        </div>

        <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5 md:px-8">
          <BrandWordmark className="text-white [&_svg]:text-white" />
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="lg" className="text-white hover:bg-white/15 hover:text-white">
              <Link href="/login">Masuk</Link>
            </Button>
            <Button asChild variant="accent" size="lg">
              <Link href="/register">Mulai gratis</Link>
            </Button>
          </div>
        </header>

        <div className="relative z-10 mx-auto w-full max-w-6xl px-4 pt-10 pb-40 text-center md:px-8 md:pt-16 md:pb-48">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-slate-900/30 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm backdrop-blur">
            <span className="size-1.5 rounded-full bg-accent" aria-hidden />
            Beta terbuka — paket Free tanpa kartu kredit
          </p>

          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-extrabold text-balance sm:text-5xl md:text-6xl drop-shadow-[0_2px_12px_rgba(0,0,0,0.45)]">
            Foto struk, biar AI
            <br className="hidden sm:block" /> yang catat belanjamu
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-base text-balance text-white font-medium drop-shadow-[0_1px_8px_rgba(0,0,0,0.5)] md:text-lg">
            StrukScan membaca item, harga, dan total dari foto struk belanja — lalu menyusunnya jadi
            riwayat pengeluaran yang bisa kamu telusuri kapan saja.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="xl" variant="accent" className="shadow-lg shadow-black/20">
              <Link href="/register">
                Mulai gratis
                <ArrowRight data-icon="inline-end" aria-hidden />
              </Link>
            </Button>
            <Button
              asChild
              size="xl"
              variant="outline"
              className="border-white/40 bg-slate-900/30 text-white shadow-lg backdrop-blur-xs hover:bg-slate-900/50 hover:text-white"
            >
              <Link href="/login">Sudah punya akun</Link>
            </Button>
          </div>
        </div>

        {/* Struk menembus batas section — jadi jembatan visual ke konten di bawahnya. */}
        <div className="absolute inset-x-0 -bottom-24 z-20 px-4 md:-bottom-28">
          <ReceiptShowcase />
        </div>
      </section>

      <section className="pt-36 pb-14 md:pt-44">
        <div className="mx-auto w-full max-w-6xl px-4 md:px-8">
          <p className="text-center text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
            Diuji pada struk dari
          </p>
          <ul className="mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
            {STORES.map((store) => (
              <li key={store} className="text-sm font-bold text-muted-foreground/60">
                {store}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="cara-kerja" className="pb-16 md:pb-24">
        <div className="mx-auto w-full max-w-6xl px-4 md:px-8">
          <h2 className="max-w-2xl text-3xl font-extrabold text-foreground md:text-4xl">
            Tiga langkah, dari kantong celana ke laporan
          </h2>

          <ol className="mt-8 grid gap-4 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <li key={step.title} className="rounded-2xl bg-card p-6 ring-1 ring-foreground/10">
                <div className="flex items-center justify-between">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <step.icon className="size-5" aria-hidden />
                  </span>
                  <span className="font-mono text-sm font-bold tabular-nums text-muted-foreground/50">
                    0{index + 1}
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-bold text-foreground">{step.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="pb-16 md:pb-24">
        <div className="mx-auto grid w-full max-w-6xl gap-4 px-4 md:grid-cols-3 md:px-8">
          <article className="rounded-2xl bg-ink p-6 text-ink-foreground md:col-span-2">
            <h2 className="text-2xl font-extrabold md:text-3xl">
              Riwayat yang bisa ditelusuri, bukan tumpukan foto
            </h2>
            <p className="mt-3 max-w-lg text-sm text-ink-foreground/70">
              Setiap struk tersimpan lengkap dengan item, toko, tanggal, dan metode bayar — bisa
              dicari, difilter, dan diperbaiki kapan pun ada yang meleset.
            </p>
            <dl className="mt-6 grid grid-cols-3 gap-4">
              <div>
                <dt className="text-xs text-ink-foreground/50">Waktu baca</dt>
                <dd className="font-mono text-xl font-bold tabular-nums">3–8 dtk</dd>
              </div>
              <div>
                <dt className="text-xs text-ink-foreground/50">Field diekstrak</dt>
                <dd className="font-mono text-xl font-bold tabular-nums">12+</dd>
              </div>
              <div>
                <dt className="text-xs text-ink-foreground/50">Scan gratis</dt>
                <dd className="font-mono text-xl font-bold tabular-nums">20/bln</dd>
              </div>
            </dl>
          </article>

          <article className="rounded-2xl bg-accent p-6 text-accent-foreground">
            <FileSpreadsheet className="size-6" aria-hidden />
            <h3 className="mt-4 text-xl font-extrabold">Export ke Excel & PDF</h3>
            <p className="mt-2 text-sm opacity-80">
              Tarik data sebulan jadi satu file untuk laporan kantor atau pembukuan warung.
            </p>
          </article>

          <article className="rounded-2xl bg-card p-6 ring-1 ring-foreground/10">
            <Users className="size-6 text-primary" aria-hidden />
            <h3 className="mt-4 text-lg font-bold text-foreground">Workspace tim</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Kumpulkan struk seluruh tim di satu tempat, dengan peran owner, admin, dan anggota.
            </p>
          </article>

          <article className="rounded-2xl bg-card p-6 ring-1 ring-foreground/10 md:col-span-2">
            <ShieldCheck className="size-6 text-primary" aria-hidden />
            <h3 className="mt-4 text-lg font-bold text-foreground">Fotomu tetap milikmu</h3>
            <p className="mt-2 max-w-lg text-sm text-muted-foreground">
              Struk disimpan terenkripsi dan hanya bisa dibuka lewat sesi milikmu sendiri. Mau foto
              aslinya dihapus otomatis setelah dibaca? Itu satu tombol di pengaturan.
            </p>
          </article>
        </div>
      </section>

      <section id="harga" className="pb-16 md:pb-24">
        <div className="mx-auto w-full max-w-6xl px-4 md:px-8">
          <h2 className="text-3xl font-extrabold text-foreground md:text-4xl">Harga yang jelas</h2>
          <p className="mt-2 text-muted-foreground">Mulai gratis, naik paket kalau strukmu makin banyak.</p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {PLANS.map((plan) => (
              <article
                key={plan.name}
                className={
                  plan.featured
                    ? "rounded-2xl bg-ink p-6 text-ink-foreground ring-2 ring-accent"
                    : "rounded-2xl bg-card p-6 ring-1 ring-foreground/10"
                }
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold">{plan.name}</h3>
                  {plan.featured && (
                    <span className="rounded-full bg-accent px-2.5 py-1 text-[0.65rem] font-bold text-accent-foreground">
                      Paling populer
                    </span>
                  )}
                </div>
                <p className="mt-4 font-mono text-3xl font-bold tabular-nums">{plan.price}</p>
                <p className={plan.featured ? "text-sm text-ink-foreground/60" : "text-sm text-muted-foreground"}>
                  {plan.note}
                </p>

                <ul className="mt-5 space-y-2 text-sm">
                  {plan.perks.map((perk) => (
                    <li key={perk} className="flex items-start gap-2">
                      <Check
                        className={plan.featured ? "mt-0.5 size-4 shrink-0 text-accent" : "mt-0.5 size-4 shrink-0 text-primary"}
                        aria-hidden
                      />
                      <span className={plan.featured ? "text-ink-foreground/80" : "text-muted-foreground"}>
                        {perk}
                      </span>
                    </li>
                  ))}
                </ul>

                <Button
                  asChild
                  size="xl"
                  variant={plan.featured ? "accent" : "outline"}
                  className="mt-6 w-full"
                >
                  <Link href={plan.href}>{plan.cta}</Link>
                </Button>
              </article>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t bg-card/40 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between md:px-8">
          <div className="space-y-2">
            <BrandWordmark />
            <p className="text-xs text-muted-foreground">
              Platform OCR cerdas untuk pencatatan dan pengelolaan struk belanja secara otomatis.
            </p>
          </div>
          <div className="flex flex-col gap-1 sm:items-end text-sm text-muted-foreground">
            <p>
              Dikembangkan oleh{" "}
              <span className="font-semibold text-foreground">Ido Refael Siregar</span>
            </p>
            <p className="text-xs text-muted-foreground/80">
              © {new Date().getFullYear()} StrukScan. Hak cipta dilindungi.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
