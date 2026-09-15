import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export class EmailTakenError extends Error {
  constructor() {
    super("Email sudah terdaftar");
    this.name = "EmailTakenError";
  }
}

export async function createUser(input: { name: string; email: string; password: string }) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw new EmailTakenError();

  const passwordHash = await bcrypt.hash(input.password, 10);

  return prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash,
      plan: "FREE",
    },
  });
}
