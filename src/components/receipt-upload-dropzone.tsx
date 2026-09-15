"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Camera, ImageUp, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "cn";
import { ACCEPTED_IMAGE_MIME, MAX_RECEIPT_IMAGE_BYTES } from "@/lib/validations/scan";

const ACCEPT_ATTR = ACCEPTED_IMAGE_MIME.join(",");

type Props = {
  onUpload: (file: File) => void;
  isUploading: boolean;
  disabled?: boolean;
  disabledReason?: string;
};

/** Validasi cepat di client; server tetap re-validate lewat scanUploadSchema. */
function localValidationError(file: File) {
  if (!ACCEPTED_IMAGE_MIME.includes(file.type as (typeof ACCEPTED_IMAGE_MIME)[number])) {
    return "Format harus JPG, PNG, WEBP, atau HEIC";
  }
  if (file.size > MAX_RECEIPT_IMAGE_BYTES) return "Ukuran foto maksimal 10 MB";
  return null;
}

export function ReceiptUploadDropzone({ onUpload, isUploading, disabled, disabledReason }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<{ url: string; name: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview.url);
  }, [preview]);

  const accept = useCallback(
    (file: File | undefined) => {
      if (!file) return;
      const validationError = localValidationError(file);
      if (validationError) {
        setError(validationError);
        return;
      }
      setError(null);
      setPreview((current) => {
        if (current) URL.revokeObjectURL(current.url);
        return { url: URL.createObjectURL(file), name: file.name };
      });
      onUpload(file);
    },
    [onUpload],
  );

  const clear = () => {
    setPreview((current) => {
      if (current) URL.revokeObjectURL(current.url);
      return null;
    });
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
    if (cameraRef.current) cameraRef.current.value = "";
  };

  if (preview) {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-ink">
        <Image
          src={preview.url}
          alt={`Pratinjau struk ${preview.name}`}
          width={800}
          height={1000}
          unoptimized
          className="max-h-[340px] w-full object-contain"
        />
        {isUploading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-ink/80 text-ink-foreground">
            <Loader2 className="size-6 animate-spin" aria-hidden />
            <p className="text-sm font-medium">Mengunggah foto…</p>
          </div>
        )}
        {!isUploading && (
          <Button
            type="button"
            variant="ink"
            size="icon-sm"
            onClick={clear}
            className="absolute top-2 right-2 rounded-full"
          >
            <X aria-hidden />
            <span className="sr-only">Hapus foto</span>
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          if (!disabled) accept(event.dataTransfer.files[0]);
        }}
        className={cn(
          "flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-border bg-card px-6 py-10 text-center transition-colors",
          isDragging && "border-primary bg-primary/5",
          disabled && "opacity-60",
        )}
      >
        <span className="flex size-12 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
          <Camera className="size-6" aria-hidden />
        </span>
        <div className="space-y-1">
          <p className="font-semibold text-foreground">Ambil foto struk belanjamu</p>
          <p className="text-sm text-muted-foreground">
            {disabled ? disabledReason : "JPG, PNG, WEBP, atau HEIC — maksimal 10 MB"}
          </p>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Button
            type="button"
            size="xl"
            variant="accent"
            disabled={disabled || isUploading}
            onClick={() => cameraRef.current?.click()}
          >
            <Camera data-icon="inline-start" aria-hidden />
            Buka kamera
          </Button>
          <Button
            type="button"
            size="xl"
            variant="outline"
            disabled={disabled || isUploading}
            onClick={() => inputRef.current?.click()}
          >
            <ImageUp data-icon="inline-start" aria-hidden />
            Pilih dari galeri
          </Button>
        </div>

        <label className="sr-only" htmlFor="receipt-file">
          Foto struk dari galeri
        </label>
        <input
          id="receipt-file"
          ref={inputRef}
          type="file"
          accept={ACCEPT_ATTR}
          className="sr-only"
          onChange={(event) => accept(event.target.files?.[0])}
        />
        <label className="sr-only" htmlFor="receipt-camera">
          Foto struk dari kamera
        </label>
        <input
          id="receipt-camera"
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          onChange={(event) => accept(event.target.files?.[0])}
        />
      </div>

      {error && (
        <p role="alert" className="text-sm font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
