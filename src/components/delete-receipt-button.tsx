"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { deleteReceiptAction } from "@/app/(dashboard)/receipts/actions";

export function DeleteReceiptButton({ receiptId, storeName }: { receiptId: string; storeName: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const confirmDelete = () => {
    startTransition(async () => {
      const result = await deleteReceiptAction(receiptId);
      if (result.status === "error") {
        toast.error(result.message);
        return;
      }
      setOpen(false);
      toast.success("Struk dihapus");
      router.push("/receipts");
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="lg">
          <Trash2 data-icon="inline-start" aria-hidden />
          Hapus struk
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Hapus struk {storeName}?</DialogTitle>
          <DialogDescription>
            Data item dan foto struknya dihapus permanen. Kuota scan yang sudah terpakai tidak kembali.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" size="lg" disabled={isPending}>
              Batal
            </Button>
          </DialogClose>
          <Button variant="destructive" size="lg" onClick={confirmDelete} disabled={isPending}>
            {isPending ? "Menghapus…" : "Hapus struk"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
