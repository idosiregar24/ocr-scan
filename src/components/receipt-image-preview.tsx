"use client";

import { useState } from "react";
import Image from "next/image";
import { Maximize2, RotateCcw, TriangleAlert, ZoomIn, ZoomOut } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

const FIELD_LABELS: Record<string, string> = {
  storeName: "Nama toko",
  date: "Tanggal",
  receiptNo: "No. struk",
  cashier: "Kasir",
  paymentMethod: "Metode bayar",
  subtotal: "Subtotal",
  discount: "Diskon",
  tax: "Pajak",
  total: "Total",
};

function labelFor(field: string) {
  const itemMatch = field.match(/^items\.(\d+)$/);
  if (itemMatch) return `Item #${Number(itemMatch[1]) + 1}`;
  return FIELD_LABELS[field] ?? field;
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.5;

type Props = {
  imageUrl: string;
  alt: string;
  lowConfidenceFields?: string[];
  className?: string;
};

/**
 * Preview foto struk asli. Dipakai di flow scan baru maupun halaman detail/edit struk lama.
 * Sticky di layar besar supaya tetap terlihat saat form di sampingnya di-scroll; klik gambar
 * untuk buka modal zoom (butuh cocokkan detail kecil di struk dengan hasil OCR).
 */
export function ReceiptImagePreview({ imageUrl, alt, lowConfidenceFields = [], className }: Props) {
  const hasDoubt = lowConfidenceFields.length > 0;
  const [open, setOpen] = useState(false);
  const [zoom, setZoom] = useState(MIN_ZOOM);

  const zoomIn = () => setZoom((z) => Math.min(MAX_ZOOM, z + ZOOM_STEP));
  const zoomOut = () => setZoom((z) => Math.max(MIN_ZOOM, z - ZOOM_STEP));

  return (
    <>
      <figure className={cn("overflow-hidden rounded-2xl bg-ink lg:sticky lg:top-20 lg:self-start", className)}>
        <button
          type="button"
          onClick={() => {
            setZoom(MIN_ZOOM);
            setOpen(true);
          }}
          className="group relative block w-full cursor-zoom-in"
        >
          <Image
            src={imageUrl}
            alt={alt}
            width={600}
            height={900}
            unoptimized
            className={cn(
              "max-h-[26rem] w-full object-contain lg:max-h-[75svh]",
              hasDoubt && "ring-4 ring-inset ring-warning",
            )}
          />
          <span className="absolute inset-0 flex items-center justify-center bg-ink/0 opacity-0 transition-all group-hover:bg-ink/30 group-hover:opacity-100">
            <span className="flex items-center gap-1.5 rounded-full bg-ink/80 px-3 py-1.5 text-xs font-semibold text-ink-foreground">
              <Maximize2 className="size-3.5" aria-hidden />
              Lihat detail
            </span>
          </span>
          {hasDoubt && (
            <span className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-warning px-2.5 py-1 text-xs font-semibold text-warning-foreground shadow">
              <TriangleAlert className="size-3.5" aria-hidden />
              Perlu dicek ulang
            </span>
          )}
        </button>

        {hasDoubt && (
          <figcaption className="flex flex-wrap items-center gap-1.5 bg-warning/12 p-3 text-xs text-warning-foreground">
            <span className="font-semibold">Bandingkan dengan foto:</span>
            {lowConfidenceFields.map((field) => (
              <span key={field} className="rounded-full bg-warning/25 px-2 py-0.5">
                {labelFor(field)}
              </span>
            ))}
          </figcaption>
        )}
      </figure>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="flex h-[90svh] w-full max-w-[95vw] flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl">
          <DialogTitle className="sr-only">{alt}</DialogTitle>
          <div className="flex-1 overflow-auto bg-ink">
            <div className="flex min-h-full min-w-full items-center justify-center p-4">
              {/* Ukuran berubah dinamis lewat zoom state — next/image butuh dimensi tetap, jadi pakai <img> biasa. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt={alt}
                onClick={zoomIn}
                style={{ width: `${zoom * 100}%` }}
                // shrink-0 wajib ada — tanpanya flexbox mengecilkan img kembali ke lebar container di setiap level zoom.
                className="max-w-none shrink-0 cursor-zoom-in transition-[width] duration-150"
              />
            </div>
          </div>
          <div className="flex items-center justify-center gap-2 border-t bg-popover p-2">
            <Button type="button" variant="outline" size="icon-sm" onClick={zoomOut} disabled={zoom <= MIN_ZOOM}>
              <ZoomOut aria-hidden />
              <span className="sr-only">Perkecil</span>
            </Button>
            <span className="min-w-12 text-center font-mono text-xs tabular-nums text-muted-foreground">
              {Math.round(zoom * 100)}%
            </span>
            <Button type="button" variant="outline" size="icon-sm" onClick={zoomIn} disabled={zoom >= MAX_ZOOM}>
              <ZoomIn aria-hidden />
              <span className="sr-only">Perbesar</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={() => setZoom(MIN_ZOOM)}
              disabled={zoom === MIN_ZOOM}
            >
              <RotateCcw aria-hidden />
              <span className="sr-only">Reset zoom</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
