import { cn } from "cn";

/**
 * Logo: kertas struk dengan tepi sobek dan tiga baris data — bentuk yang sama
 * yang dipakai sebagai elemen signature di hero.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("size-6", className)} aria-hidden focusable="false">
      <path
        d="M4.5 2.75h15a.75.75 0 0 1 .75.75v16.2l-2.1-1.2-2.1 1.2-2.1-1.2-2.1 1.2-2.1-1.2-2.1 1.2-2.1-1.2V3.5a.75.75 0 0 1 .75-.75Z"
        fill="currentColor"
      />
      <path
        d="M8 7.5h8M8 11h8M8 14.5h4.5"
        stroke="var(--color-accent)"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function BrandWordmark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <BrandMark className="size-6 text-primary" />
      <span className="font-heading text-lg font-extrabold tracking-[-0.04em]">StrukScan</span>
    </span>
  );
}
