import type { DefaultSession } from "next-auth";

// Module augmentation — sisipkan `id` ke session.user (dipakai di seluruh service layer untuk scoping query).
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}
