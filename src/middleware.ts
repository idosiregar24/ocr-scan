import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

// Instance auth terpisah & edge-safe khusus middleware — TIDAK boleh import dari lib/auth.ts
// (itu menyeret Prisma/pg yang tidak jalan di Edge Runtime). Proteksi route aktual ada di
// authConfig.callbacks.authorized; service layer tetap WAJIB re-check auth & plan server-side.
export default NextAuth(authConfig).auth;

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
