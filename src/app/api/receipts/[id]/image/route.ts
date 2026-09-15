import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getReceiptForUser, ReceiptNotFoundError } from "@/lib/services/receipt";
import { getObject } from "@/lib/storage";

export const runtime = "nodejs";

/**
 * Foto struk tidak pernah punya URL publik permanen (risiko PII R-05): setiap akses lewat sini
 * dan dicek kepemilikannya dulu. Saat driver R2 aktif, endpoint ini yang jadi penerbit signed URL.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, { status: 401 });
  }

  const { id } = await params;

  try {
    const receipt = await getReceiptForUser(id, session.user.id);
    const object = await getObject(receipt.imageKey);
    if (!object) {
      return NextResponse.json({ error: { message: "Foto tidak ditemukan", code: "NOT_FOUND" } }, { status: 404 });
    }

    return new NextResponse(new Uint8Array(object.body), {
      headers: {
        "Content-Type": object.contentType,
        "Content-Length": String(object.body.byteLength),
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (err) {
    if (err instanceof ReceiptNotFoundError) {
      return NextResponse.json({ error: { message: err.message, code: "NOT_FOUND" } }, { status: 404 });
    }
    throw err;
  }
}
