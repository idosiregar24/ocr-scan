import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getReceiptForUser, ReceiptNotFoundError } from "@/lib/services/receipt";
import { toReceiptDTO } from "@/lib/dto/receipt";

export const runtime = "nodejs";

/** Status job OCR = status struk-nya; client polling sampai DONE/FAILED (PRD §5.3). */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, { status: 401 });
  }

  const { id } = await params;

  try {
    const receipt = await getReceiptForUser(id, session.user.id);
    return NextResponse.json({ data: toReceiptDTO(receipt) });
  } catch (err) {
    if (err instanceof ReceiptNotFoundError) {
      return NextResponse.json({ error: { message: err.message, code: "NOT_FOUND" } }, { status: 404 });
    }
    throw err;
  }
}
