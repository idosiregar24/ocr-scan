"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "cn";

const STATUS_FILTERS = [
  { value: "", label: "Semua" },
  { value: "DONE", label: "Selesai" },
  { value: "PROCESSING", label: "Diproses" },
  { value: "FAILED", label: "Gagal" },
] as const;

/** Filter disimpan di URL, bukan state lokal — supaya bisa di-share dan tombol back browser jalan. */
export function ReceiptFilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeStore = searchParams.get("storeName") ?? "";
  const activeStatus = searchParams.get("status") ?? "";
  const [storeName, setStoreName] = useState(activeStore);

  useEffect(() => setStoreName(activeStore), [activeStore]);

  const pushParams = (next: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  // Debounce ketikan supaya tiap huruf tidak memicu navigasi + query baru.
  useEffect(() => {
    if (storeName === activeStore) return;
    const timer = setTimeout(() => pushParams({ storeName }), 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeName]);

  const hasFilter = Boolean(activeStore || activeStatus);

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-card p-3 ring-1 ring-foreground/10 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Label htmlFor="filter-store" className="sr-only">
          Cari nama toko
        </Label>
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          id="filter-store"
          inputSize="lg"
          value={storeName}
          onChange={(event) => setStoreName(event.target.value)}
          placeholder="Cari nama toko…"
          // `!` wajib: varian data-[size=lg] Input punya spesifisitas lebih tinggi dari class polos.
          className="pl-10!"
        />
      </div>

      <div role="group" aria-label="Filter status" className="flex flex-wrap gap-1.5">
        {STATUS_FILTERS.map((filter) => {
          const active = activeStatus === filter.value;
          return (
            <button
              key={filter.value || "all"}
              type="button"
              aria-pressed={active}
              onClick={() => pushParams({ status: filter.value })}
              className={cn(
                "rounded-full px-3 py-1.5 text-sm font-semibold transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                active
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground",
              )}
            >
              {filter.label}
            </button>
          );
        })}

        {hasFilter && (
          <Button type="button" variant="ghost" size="sm" onClick={() => router.push(pathname, { scroll: false })}>
            <X data-icon="inline-start" aria-hidden />
            Reset
          </Button>
        )}
      </div>
    </div>
  );
}
