import Link from "next/link";
import { Sparkles } from "lucide-react";
import { RegisterForm } from "./register-form";

export default function RegisterPage() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/40 bg-card/92 p-6 shadow-2xl shadow-black/25 backdrop-blur-xl sm:p-8">
      {/* Subtle top inner glow highlight */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

      <div className="mb-6 text-center sm:text-left">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
          <Sparkles className="size-3" />
          <span>Paket Free Tersedia</span>
        </div>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-foreground">Buat Akun StrukScan</h1>
        <p className="mt-1 text-sm text-muted-foreground">Mulai scan struk belanjamu dengan OCR cerdas berbasis AI.</p>
      </div>

      <div className="flex flex-col gap-4">
        <RegisterForm />
        <p className="text-center text-sm text-muted-foreground">
          Sudah punya akun?{" "}
          <Link href="/login" className="font-semibold text-primary transition-colors hover:underline">
            Masuk sekarang
          </Link>
        </p>
      </div>
    </div>
  );
}
