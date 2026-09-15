"use client";

import { useMemo, useState, useTransition } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Save, Trash2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatIDR } from "@/lib/format";
import { updateReceiptSchema, type UpdateReceiptInput } from "@/lib/validations/receipt";
import { saveReceiptAction } from "@/app/(dashboard)/receipts/actions";
import type { ReceiptDTO } from "@/lib/dto/receipt";

type Props = {
  receipt: ReceiptDTO;
  onSaved?: (receiptId: string) => void;
  submitLabel?: string;
};

function toDateInputValue(date: Date | string | null) {
  if (!date) return "";
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString().slice(0, 10);
}

/** Bentuk nilai form: semua string supaya `<input>` terkontrol; Zod yang meng-coerce ke number/Date. */
type FormValues = {
  id: string;
  storeName: string;
  date: string;
  receiptNo: string;
  cashier: string;
  paymentMethod: string;
  discount: string;
  tax: string;
  total: string;
  items: { name: string; qty: string; unitPrice: string }[];
};

function toFormValues(receipt: ReceiptDTO): FormValues {
  return {
    id: receipt.id,
    storeName: receipt.storeName ?? "",
    date: toDateInputValue(receipt.date),
    receiptNo: receipt.receiptNo ?? "",
    cashier: receipt.cashier ?? "",
    paymentMethod: receipt.paymentMethod ?? "",
    discount: String(receipt.discount ?? 0),
    tax: String(receipt.tax ?? 0),
    total: receipt.total !== null ? String(receipt.total) : "",
    items: receipt.items.map((item) => ({
      name: item.name,
      qty: String(item.qty),
      unitPrice: String(item.unitPrice),
    })),
  };
}

function DoubtBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-warning/20 px-1.5 py-0.5 text-[0.65rem] font-semibold text-warning-foreground">
      <TriangleAlert className="size-3" aria-hidden />
      Cek foto
    </span>
  );
}

export function OcrReviewForm({ receipt, onSaved, submitLabel = "Simpan struk" }: Props) {
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const isDoubtful = (field: string) => receipt.lowConfidenceFields.includes(field);

  const form = useForm<FormValues>({
    // Schema yang sama dipakai server action — satu sumber aturan validasi.
    resolver: zodResolver(updateReceiptSchema) as never,
    defaultValues: toFormValues(receipt),
    mode: "onSubmit",
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "items" });
  const watchedItems = form.watch("items");
  const watchedDiscount = form.watch("discount");
  const watchedTax = form.watch("tax");

  const computedSubtotal = useMemo(
    () =>
      watchedItems.reduce((sum, item) => {
        const qty = Number(item.qty) || 0;
        const unitPrice = Number(item.unitPrice) || 0;
        return sum + qty * unitPrice;
      }, 0),
    [watchedItems],
  );

  const computedTotal = computedSubtotal - (Number(watchedDiscount) || 0) + (Number(watchedTax) || 0);

  const onSubmit = form.handleSubmit((values) => {
    setFormError(null);
    startTransition(async () => {
      // Subtotal selalu diturunkan dari item, bukan diketik user — cegah angka yang tidak konsisten.
      const payload: UpdateReceiptInput = {
        ...(values as unknown as UpdateReceiptInput),
        subtotal: computedSubtotal,
        total: values.total === "" ? computedTotal : (Number(values.total) as number),
      };

      const result = await saveReceiptAction(payload);
      if (result.status === "success") {
        toast.success("Struk tersimpan");
        onSaved?.(result.receiptId);
        return;
      }
      if (result.status === "error") {
        setFormError(result.message);
        toast.error(result.message);
      }
    });
  });

  const itemErrors = form.formState.errors.items;

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="storeName">Nama toko</Label>
            {isDoubtful("storeName") && <DoubtBadge />}
          </div>
          <Input
            id="storeName"
            inputSize="lg"
            placeholder="Indomaret Kebon Jeruk"
            aria-invalid={Boolean(form.formState.errors.storeName)}
            className={cn(isDoubtful("storeName") && "ring-2 ring-warning")}
            {...form.register("storeName")}
          />
        </div>
        <div className="grid gap-1.5">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="date">Tanggal</Label>
            {isDoubtful("date") && <DoubtBadge />}
          </div>
          <Input
            id="date"
            type="date"
            inputSize="lg"
            className={cn(isDoubtful("date") && "ring-2 ring-warning")}
            {...form.register("date")}
          />
        </div>
        <div className="grid gap-1.5">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="receiptNo">No. struk</Label>
            {isDoubtful("receiptNo") && <DoubtBadge />}
          </div>
          <Input
            id="receiptNo"
            inputSize="lg"
            className={cn("font-mono", isDoubtful("receiptNo") && "ring-2 ring-warning")}
            {...form.register("receiptNo")}
          />
        </div>
        <div className="grid gap-1.5">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="paymentMethod">Metode bayar</Label>
            {isDoubtful("paymentMethod") && <DoubtBadge />}
          </div>
          <Input
            id="paymentMethod"
            inputSize="lg"
            placeholder="Tunai / QRIS / Debit"
            className={cn(isDoubtful("paymentMethod") && "ring-2 ring-warning")}
            {...form.register("paymentMethod")}
          />
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-foreground">Item belanja</h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ name: "", qty: "1", unitPrice: "0" })}
          >
            <Plus data-icon="inline-start" aria-hidden />
            Tambah item
          </Button>
        </div>

        {fields.length === 0 && (
          <p className="rounded-xl border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
            Belum ada item. Tambahkan minimal satu sebelum menyimpan.
          </p>
        )}

        <ul className="flex flex-col gap-3">
          {fields.map((field, index) => {
            const qty = Number(watchedItems[index]?.qty) || 0;
            const unitPrice = Number(watchedItems[index]?.unitPrice) || 0;
            const rowError = Array.isArray(itemErrors) ? itemErrors[index] : undefined;
            const rowIsDoubtful = isDoubtful(`items.${index}`);

            return (
              <li
                key={field.id}
                className={cn("rounded-xl border bg-card p-3", rowIsDoubtful && "border-warning ring-1 ring-warning")}
              >
                {rowIsDoubtful && (
                  <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-warning-foreground">
                    <TriangleAlert className="size-3.5" aria-hidden />
                    Bandingkan baris ini dengan foto struk
                  </p>
                )}
                <div className="grid gap-3 sm:grid-cols-[1fr_5rem_8rem_auto] sm:items-end">
                  <div className="grid gap-1.5">
                    <Label htmlFor={`items.${index}.name`}>Nama item</Label>
                    <Input
                      id={`items.${index}.name`}
                      inputSize="lg"
                      aria-invalid={Boolean(rowError?.name)}
                      {...form.register(`items.${index}.name` as const)}
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor={`items.${index}.qty`}>Qty</Label>
                    <Input
                      id={`items.${index}.qty`}
                      type="number"
                      step="any"
                      min="0"
                      inputSize="lg"
                      className="font-mono tabular-nums"
                      aria-invalid={Boolean(rowError?.qty)}
                      {...form.register(`items.${index}.qty` as const)}
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor={`items.${index}.unitPrice`}>Harga satuan</Label>
                    <Input
                      id={`items.${index}.unitPrice`}
                      type="number"
                      step="any"
                      min="0"
                      inputSize="lg"
                      className="font-mono tabular-nums"
                      aria-invalid={Boolean(rowError?.unitPrice)}
                      {...form.register(`items.${index}.unitPrice` as const)}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon-lg"
                    onClick={() => remove(index)}
                    className="justify-self-start sm:justify-self-auto"
                  >
                    <Trash2 aria-hidden />
                    <span className="sr-only">Hapus item {index + 1}</span>
                  </Button>
                </div>

                <p className="mt-2 text-right text-sm text-muted-foreground">
                  Subtotal baris{" "}
                  <span className="font-mono font-semibold tabular-nums text-foreground">
                    {formatIDR(qty * unitPrice)}
                  </span>
                </p>

                {rowError && (
                  <p role="alert" className="mt-1 text-sm text-destructive">
                    {rowError.name?.message ?? rowError.qty?.message ?? rowError.unitPrice?.message}
                  </p>
                )}
              </li>
            );
          })}
        </ul>

        {itemErrors && !Array.isArray(itemErrors) && (
          <p role="alert" className="text-sm font-medium text-destructive">
            {itemErrors.message}
          </p>
        )}
      </section>

      <section className="rounded-2xl bg-secondary p-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="discount">Diskon</Label>
              {isDoubtful("discount") && <DoubtBadge />}
            </div>
            <Input
              id="discount"
              type="number"
              step="any"
              min="0"
              inputSize="lg"
              className={cn("bg-card font-mono tabular-nums", isDoubtful("discount") && "ring-2 ring-warning")}
              {...form.register("discount")}
            />
          </div>
          <div className="grid gap-1.5">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="tax">Pajak / PPN</Label>
              {isDoubtful("tax") && <DoubtBadge />}
            </div>
            <Input
              id="tax"
              type="number"
              step="any"
              min="0"
              inputSize="lg"
              className={cn("bg-card font-mono tabular-nums", isDoubtful("tax") && "ring-2 ring-warning")}
              {...form.register("tax")}
            />
          </div>
        </div>

        <dl className="mt-4 space-y-1.5 border-t pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="flex items-center gap-1.5 text-muted-foreground">
              Subtotal item
              {isDoubtful("subtotal") && <DoubtBadge />}
            </dt>
            <dd className="font-mono tabular-nums">{formatIDR(computedSubtotal)}</dd>
          </div>
          <div className="flex justify-between text-base font-bold">
            <dt className="flex items-center gap-1.5">
              Total
              {isDoubtful("total") && <DoubtBadge />}
            </dt>
            <dd className="font-mono tabular-nums text-primary">{formatIDR(computedTotal)}</dd>
          </div>
        </dl>
      </section>

      {formError && (
        <p role="alert" className="text-sm font-medium text-destructive">
          {formError}
        </p>
      )}

      <Button type="submit" size="xl" disabled={isPending} className="w-full sm:w-auto sm:self-end">
        <Save data-icon="inline-start" aria-hidden />
        {isPending ? "Menyimpan…" : submitLabel}
      </Button>
    </form>
  );
}
