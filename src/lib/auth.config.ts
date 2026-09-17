import type { NextAuthConfig } from "next-auth";

const PROTECTED_PREFIXES = ["/dashboard", "/receipts", "/settings", "/scan", "/chat"];

// Config edge-safe — TANPA Prisma adapter/provider yang butuh DB (pg tidak jalan di Edge Runtime).
// Dipakai di middleware.ts. Config lengkap (dengan adapter & Credentials provider) ada di lib/auth.ts.
export const authConfig = {
  trustHost: true,
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const isProtected = PROTECTED_PREFIXES.some((prefix) => request.nextUrl.pathname.startsWith(prefix));
      return isProtected ? Boolean(auth?.user) : true;
    },
  },
} satisfies NextAuthConfig;
