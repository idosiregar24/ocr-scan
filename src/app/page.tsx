import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <main className="mx-auto flex min-h-svh max-w-3xl flex-col items-center justify-center gap-6 px-4 text-center">
      <span className="rounded-full bg-accent px-3 py-1 text-sm font-medium text-accent-foreground">
        Beta — Free tier tersedia
      </span>
      <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
        Foto struk, biar AI yang catat.
      </h1>
      <p className="max-w-xl text-balance text-muted-foreground">
        StrukScan mengekstrak item, harga, dan total dari foto struk belanjamu secara otomatis —
        tanpa input manual, tanpa struk hilang.
      </p>
      <div className="flex gap-3">
        <Button asChild size="lg">
          <Link href="/register">Mulai Gratis</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/login">Masuk</Link>
        </Button>
      </div>
    </main>
  );
}
