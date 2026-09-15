"use client";

import { useMemo, useState, useTransition } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
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

export function OcrReviewForm({ receipt, onSaved, submitLabel = "Simpan struk" }: Props) {
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);

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
          <Label htmlFor="storeName">Nama toko</Label>
          <Input
            id="storeName"
            inputSize="lg"
            placeholder="Indomaret Kebon Jeruk"
            aria-invalid={Boolean(form.formState.errors.storeName)}
            {...form.register("storeName")}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="date">Tanggal</Label>
          <Input id="date" type="date" inputSize="lg" {...form.register("date")} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="receiptNo">No. struk</Label>
          <Input id="receiptNo" inputSize="lg" className="font-mono" {...form.register("receiptNo")} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="paymentMethod">Metode bayar</Label>
          <Input id="paymentMethod" inputSize="lg" placeholder="Tunai / QRIS / Debit" {...form.register("paymentMethod")} />
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

            return (
              <li key={field.id} className="rounded-xl border bg-card p-3">
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
            <Label htmlFor="discount">Diskon</Label>
            <Input
              id="discount"
              type="number"
              step="any"
              min="0"
              inputSize="lg"
              className="bg-card font-mono tabular-nums"
              {...form.register("discount")}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="tax">Pajak / PPN</Label>
            <Input
              id="tax"
              type="number"
              step="any"
              min="0"
              inputSize="lg"
              className="bg-card font-mono tabular-nums"
              {...form.register("tax")}
            />
          </div>
        </div>

        <dl className="mt-4 space-y-1.5 border-t pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Subtotal item</dt>
            <dd className="font-mono tabular-nums">{formatIDR(computedSubtotal)}</dd>
          </div>
          <div className="flex justify-between text-base font-bold">
            <dt>Total</dt>
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
