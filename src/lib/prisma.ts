import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Prisma 7: schema.prisma tidak lagi membawa connection url — PrismaClient wajib
// menerima driver adapter secara eksplisit (lihat prisma.config.ts untuk Migrate).
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

// Cegah multiple PrismaClient instance saat hot-reload di dev (Next.js re-evaluates modules).
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
