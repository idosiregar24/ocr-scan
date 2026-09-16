import { Suspense } from "react";
import Link from "next/link";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/40 bg-card/92 p-6 shadow-2xl shadow-black/25 backdrop-blur-xl sm:p-8">
      {/* Subtle top inner glow highlight */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

      <div className="mb-6 text-center sm:text-left">
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Masuk ke StrukScan</h1>
        <p className="mt-1 text-sm text-muted-foreground">Lanjutkan mengelola dan mencatat struk belanjamu.</p>
      </div>

      <div className="mt-4">
        {/* LoginForm pakai useSearchParams (callbackUrl) — wajib Suspense boundary di App Router. */}
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Belum memiliki akun?{" "}
        <Link href="/register" className="font-semibold text-primary transition-colors hover:underline">
          Daftar gratis
        </Link>
      </p>
    </div>
  );
}
