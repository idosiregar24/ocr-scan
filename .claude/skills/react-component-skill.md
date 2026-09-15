# Skill: Komponen React Reusable (shadcn/ui + Tailwind)

## Prinsip
Bangun komponen kecil dan komposabel di `components/`, dipakai ulang lintas modul (Scan, Riwayat, Dashboard, Workspace semuanya butuh Card, Badge, FilterBar, Pagination, EmptyState).

## Komponen Dasar yang Wajib Ada di Awal Project
| Komponen | Fungsi | Dipakai di |
| :--- | :--- | :--- |
| `ReceiptCard.tsx` | Card ringkasan struk (toko, tanggal, total) | Riwayat, Dashboard |
| `Badge.tsx` (shadcn) | Label status/kategori (mis. "Processing", "Pro") | Riwayat, Billing |
| `FilterBar.tsx` | Wrapper filter tanggal/toko/kategori, sync ke URL search params | Riwayat |
| `Pagination.tsx` | Cursor-based pagination untuk listing | Riwayat, Workspace member list |
| `EmptyState.tsx` | Pesan + ilustrasi saat data kosong | Semua listing |
| `ReceiptUploadDropzone.tsx` | Input upload/kamera + preview + validasi ukuran client-side | Halaman Scan |
| `OcrReviewForm.tsx` | Form editable pre-filled dari hasil OCR (react-hook-form + zodResolver) | Halaman Scan (step review) |
| `StatusPill.tsx` | Warna berbeda per status job (`PENDING`=abu, `PROCESSING`=biru, `DONE`=hijau, `FAILED`=merah) | Riwayat, Scan |

## Contoh Pola Komponen (Card ringkasan struk)
```tsx
import { formatIDR } from "@/lib/format";

interface ReceiptCardProps {
  receipt: {
    id: string;
    storeName: string;
    date: Date;
    total: number;
    imageUrl: string;
  };
}

export function ReceiptCard({ receipt }: ReceiptCardProps) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm transition hover:shadow-md">
      <div className="flex items-center gap-3">
        <img
          src={receipt.imageUrl}
          alt={`Struk dari ${receipt.storeName}`}
          className="h-12 w-12 rounded-lg object-cover"
        />
        <div>
          <p className="font-semibold text-foreground">{receipt.storeName}</p>
          <p className="text-sm text-muted-foreground">
            {new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(receipt.date)}
          </p>
        </div>
        <p className="ml-auto font-semibold text-primary">{formatIDR(receipt.total)}</p>
      </div>
    </div>
  );
}
```

## Konfigurasi Token Warna (`app/globals.css` — CSS variable shadcn, bukan hex langsung di Tailwind config)
```css
:root {
  --primary: 221 83% 53%;       /* indigo/blue — lihat design-standards.md */
  --accent: 189 78% 53%;        /* cyan */
  --warning: 38 92% 50%;        /* amber */
}
```
Panggil lewat utility (`bg-primary`, `text-primary-foreground`), jangan hardcode `#2563EB` di tiap komponen.

## Aturan Reuse
Sebelum membuat komponen baru, cek dulu `components/` — jika komponen serupa sudah ada (mis. `Card` generik dari shadcn), extend/compose lewat props, jangan duplikasi file baru dengan nama beda tipis.
