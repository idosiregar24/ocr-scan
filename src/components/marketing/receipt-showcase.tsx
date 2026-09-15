import { Check, Sparkles } from "lucide-react";
import { formatIDR } from "@/lib/format";

const RAW_LINES = [
  { label: "INDOMARET KEBON JERUK", muted: true },
  { label: "JL. PANJANG NO. 12 JAKBAR", muted: true },
];

const ITEMS = [
  { name: "Beras Setra Ramos 5kg", qty: 1, price: 68500 },
  { name: "Minyak Goreng 2L", qty: 2, price: 34900 },
  { name: "Telur Ayam Negeri 1kg", qty: 1, price: 28000 },
  { name: "Kopi Kapal Api 165g", qty: 1, price: 17800 },
];

const SUBTOTAL = ITEMS.reduce((sum, item) => sum + item.qty * item.price, 0);

/**
 * Elemen signature: satu kertas struk yang setengahnya masih cetakan kasir mentah dan
 * setengahnya sudah jadi baris data rapi — tesis produk dalam satu gambar.
 */
export function ReceiptShowcase() {
  return (
    <div className="relative mx-auto w-full max-w-md">
      <div className="edge-torn relative bg-white px-6 pt-7 pb-24 shadow-2xl shadow-black/25">
        <header className="text-center">
          {RAW_LINES.map((line) => (
            <p key={line.label} className="font-mono text-[0.6rem] tracking-[0.18em] text-slate-400">
              {line.label}
            </p>
          ))}
        </header>

        <div className="my-4 h-px w-full rule-dotted text-slate-300" aria-hidden />

        <ul className="space-y-2.5">
          {ITEMS.map((item, index) => (
            <li key={item.name} className="flex items-baseline gap-3">
              <span
                className={
                  index < 2
                    ? "flex-1 truncate font-mono text-[0.68rem] tracking-tight text-slate-400"
                    : "flex-1 truncate text-[0.8rem] font-semibold text-slate-900"
                }
              >
                {index < 2 ? item.name.toUpperCase() : item.name}
              </span>
              <span className="font-mono text-[0.68rem] tabular-nums text-slate-400">
                {item.qty}x
              </span>
              <span
                className={
                  index < 2
                    ? "w-20 text-right font-mono text-[0.68rem] tabular-nums text-slate-400"
                    : "w-20 text-right font-mono text-[0.78rem] font-bold tabular-nums text-slate-900"
                }
              >
                {formatIDR(item.qty * item.price)}
              </span>
            </li>
          ))}
        </ul>

        <div className="my-4 h-px w-full rule-dotted text-slate-300" aria-hidden />

        <div className="flex items-baseline justify-between">
          <span className="text-sm font-bold text-slate-900">TOTAL</span>
          <span className="font-mono text-lg font-bold tabular-nums text-slate-900">
            {formatIDR(SUBTOTAL)}
          </span>
        </div>

        {/* Garis pindai menandai batas antara bagian yang belum dan sudah terbaca. */}
        <div
          className="pointer-events-none absolute inset-x-0 top-[37%] h-14 bg-gradient-to-b from-transparent via-[oklch(0.92_0.18_117/0.35)] to-transparent"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-x-0 top-[37%] h-0.5 bg-[oklch(0.88_0.2_117)]"
          aria-hidden
        />
      </div>

      {/* Kartu hasil parsing — melayang di tepi kertas, menegaskan output-nya data, bukan foto. */}
      <div className="absolute -right-3 -bottom-5 w-44 rounded-2xl bg-ink p-3.5 text-ink-foreground shadow-xl shadow-black/30 sm:-right-8">
        <div className="flex items-center gap-1.5 text-accent">
          <Sparkles className="size-3.5" aria-hidden />
          <span className="text-[0.65rem] font-bold tracking-wide uppercase">Terbaca</span>
        </div>
        <dl className="mt-2.5 space-y-1.5 text-[0.7rem]">
          <div className="flex justify-between gap-2">
            <dt className="text-ink-foreground/60">Item</dt>
            <dd className="font-mono font-bold tabular-nums">{ITEMS.length}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-ink-foreground/60">Total</dt>
            <dd className="font-mono font-bold tabular-nums">{formatIDR(SUBTOTAL)}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-ink-foreground/60">Waktu</dt>
            <dd className="font-mono font-bold tabular-nums">4,2 dtk</dd>
          </div>
        </dl>
      </div>

      <div className="absolute -top-4 -left-3 flex items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 text-accent-foreground shadow-lg shadow-black/20 sm:-left-8">
        <Check className="size-3.5" aria-hidden />
        <span className="text-[0.7rem] font-bold">Tanpa ketik manual</span>
      </div>
    </div>
  );
}
