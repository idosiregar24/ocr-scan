import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/lib/auth.config";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

// Config penuh (Node runtime only — pakai Prisma/pg) untuk Route Handler, Server Action, Server Component.
// JANGAN import file ini dari middleware.ts, pakai lib/auth.config.ts di sana.
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      credentials: { email: {}, password: {} },
      authorize: async (raw) => {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
        if (!user?.passwordHash) return null;

        const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!valid) return null;

        return { id: user.id, name: user.name, email: user.email, image: user.image };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    // Sisipkan id user ke session supaya server/service layer tidak perlu query ulang by email.
    session: ({ session, token }) => {
      if (session.user && token.sub) session.user.id = token.sub;
      return session;
    },
  },
});
