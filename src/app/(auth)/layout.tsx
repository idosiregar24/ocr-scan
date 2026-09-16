import Image from "next/image";
import Link from "next/link";
import { BrandWordmark } from "@/components/brand-mark";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center gap-8 px-4 py-10 sm:py-14">
      {/* Background Hero Image with Cinematic Overlays */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <Image
          src="/bg2.png"
          alt="Hero Landscape Background"
          fill
          priority
          className="object-cover object-center scale-105 transition-transform duration-1000"
        />
        {/* Soft atmospheric gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-sky-950/35 via-sky-900/10 to-slate-950/45" />

        {/* Subtle ambient glowing spots for depth */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 size-96 rounded-full bg-sky-400/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-12 left-1/4 size-80 rounded-full bg-emerald-400/10 blur-3xl pointer-events-none" />
      </div>

      {/* Logo Brand */}
      <Link
        href="/"
        className="relative z-10 group flex flex-col items-center transition-transform duration-200 hover:scale-102"
      >
        <div className="text-white drop-shadow-[0_3px_10px_rgba(0,0,0,0.5)] [&_svg]:text-white">
          <BrandWordmark />
        </div>
      </Link>

      {/* Form Content */}
      <div className="relative z-10 w-full max-w-md">{children}</div>

      {/* Footer Attribution */}
      <footer className="relative z-10 text-center">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-slate-950/35 px-4 py-1.5 text-xs text-white/85 shadow-lg backdrop-blur-md">
          <span>Dikembangkan oleh</span>
          <span className="font-semibold text-white">Ido Refael Siregar</span>
        </div>
      </footer>
    </div>
  );
}
