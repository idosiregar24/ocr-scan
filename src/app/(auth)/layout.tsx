import Image from "next/image";
import Link from "next/link";
import { BrandWordmark } from "@/components/brand-mark";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center gap-8 px-4 py-10">
      {/* Background Image */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <Image
          src="/bg2.png"
          alt="Background"
          fill
          priority
          className="object-cover object-center"
        />
        {/* Subtle soft gradient overlay so brand and card stand out */}
        <div className="absolute inset-0 bg-gradient-to-b from-sky-900/25 via-transparent to-black/25" />
      </div>

      <Link href="/" className="relative z-10 text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)] [&_svg]:text-white">
        <BrandWordmark />
      </Link>
      <div className="relative z-10 w-full max-w-sm">{children}</div>
      <footer className="relative z-10 text-center text-xs text-white/70">
        Dikembangkan oleh <span className="font-semibold text-white">Ido Refael Siregar</span>
      </footer>
    </div>
  );
}

