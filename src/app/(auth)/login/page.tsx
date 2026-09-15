import { Suspense } from "react";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="rounded-2xl bg-card/95 p-6 shadow-2xl shadow-black/15 backdrop-blur-md ring-1 ring-black/5 sm:p-7">
      <h1 className="text-xl font-extrabold text-foreground">Masuk ke StrukScan</h1>
      <p className="mt-1 text-sm text-muted-foreground">Lanjutkan mencatat belanjamu.</p>
      <div className="mt-6">
        {/* LoginForm pakai useSearchParams (callbackUrl) — wajib Suspense boundary di App Router. */}
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
