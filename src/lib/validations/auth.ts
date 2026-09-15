import { z } from "zod";

export const registerSchema = z
  .object({
    name: z.string().min(2, "Nama minimal 2 karakter").max(100),
    email: z.string().email("Email tidak valid"),
    password: z.string().min(8, "Password minimal 8 karakter"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Konfirmasi password tidak cocok",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;
