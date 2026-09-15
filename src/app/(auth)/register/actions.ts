"use server";

import { registerSchema } from "@/lib/validations/auth";
import { createUser, EmailTakenError } from "@/lib/services/user";
import { signIn } from "@/lib/auth";

export async function registerAction(input: unknown) {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, errors: parsed.error.flatten() };
  }

  try {
    await createUser(parsed.data);
  } catch (err) {
    if (err instanceof EmailTakenError) {
      return { success: false as const, errors: { formErrors: [err.message], fieldErrors: {} } };
    }
    throw err;
  }

  // Auto-login setelah register — signIn melempar redirect internal (NEXT_REDIRECT), itu memang perilaku normal.
  await signIn("credentials", {
    email: parsed.data.email,
    password: parsed.data.password,
    redirectTo: "/dashboard",
  });
}
