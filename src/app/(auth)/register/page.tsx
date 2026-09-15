import Link from "next/link";
import { RegisterForm } from "./register-form";

export default function RegisterPage() {
  return (
    <div className="rounded-2xl bg-card p-6 shadow-xl shadow-black/10 sm:p-7">
      <h1 className="text-xl font-extrabold text-foreground">Buat akun StrukScan</h1>
      <p className="mt-1 text-sm text-muted-foreground">Gratis, 20 scan per bulan.</p>
      <div className="mt-6 flex flex-col gap-4">
        <RegisterForm />
        <p className="text-center text-sm text-muted-foreground">
          Sudah punya akun?{" "}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            Masuk
          </Link>
        </p>
      </div>
    </div>
  );
}
