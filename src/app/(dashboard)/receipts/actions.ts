"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { updateReceiptSchema } from "@/lib/validations/receipt";
import { deleteReceipt, updateReceipt, ReceiptNotFoundError } from "@/lib/services/receipt";
import { toReceiptDTO } from "@/lib/dto/receipt";

export type ActionState =
  | { status: "idle" }
  | { status: "success"; receiptId: string }
  | { status: "error"; message: string; fieldErrors?: Record<string, string[]> };

/** Dipakai form review hasil OCR maupun edit struk lama — schema dan service-nya sama. */
export async function saveReceiptAction(input: unknown): Promise<ActionState> {
  const session = await auth();
  if (!session?.user) return { status: "error", message: "Sesi berakhir — masuk lagi untuk menyimpan" };

  const parsed = updateReceiptSchema.safeParse(input);
  if (!parsed.success) {
    const flattened = parsed.error.flatten();
    return {
      status: "error",
      message: "Periksa lagi isian yang ditandai",
      fieldErrors: flattened.fieldErrors as Record<string, string[]>,
    };
  }

  try {
    const receipt = await updateReceipt(session.user.id, parsed.data);
    revalidatePath("/receipts");
    revalidatePath("/dashboard");
    return { status: "success", receiptId: toReceiptDTO(receipt).id };
  } catch (err) {
    if (err instanceof ReceiptNotFoundError) {
      return { status: "error", message: err.message };
    }
    throw err;
  }
}

export async function deleteReceiptAction(receiptId: string): Promise<ActionState> {
  const session = await auth();
  if (!session?.user) return { status: "error", message: "Sesi berakhir — masuk lagi untuk menghapus" };

  try {
    await deleteReceipt(session.user.id, receiptId);
    revalidatePath("/receipts");
    revalidatePath("/dashboard");
    return { status: "success", receiptId };
  } catch (err) {
    if (err instanceof ReceiptNotFoundError) {
      return { status: "error", message: err.message };
    }
    throw err;
  }
}
