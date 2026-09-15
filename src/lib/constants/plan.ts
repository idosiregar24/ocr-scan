import type { Plan } from "@prisma/client";

/** Kuota scan per bulan — null berarti unlimited (PRD §6.1). */
export const MONTHLY_QUOTA: Record<Plan, number | null> = {
  FREE: 20,
  PRO: 500,
  BIZ: null,
};

export const PLAN_LABEL: Record<Plan, string> = {
  FREE: "Free",
  PRO: "Pro",
  BIZ: "Business",
};

export function quotaRemaining(plan: Plan, quotaUsed: number) {
  const limit = MONTHLY_QUOTA[plan];
  if (limit === null) return null;
  return Math.max(limit - quotaUsed, 0);
}
