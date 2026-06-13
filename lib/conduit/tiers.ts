// Tier definitions for Praxis Console — mirrors lib/billing/tiers.ts on
// the web app. Mobile uses this for presentational gating only; the
// backend enforces the real limits via RLS and API guards.

import type { EmployeeId } from "./employees";

export type TierId = "free" | "pro" | "enterprise";

export interface TierDefinition {
  id: TierId;
  label: string;
  allowedEmployees: EmployeeId[];
}

export const TIERS: Record<TierId, TierDefinition> = {
  free: {
    id: "free",
    label: "Free",
    allowedEmployees: ["atlas", "engineering", "sales", "marketing"],
  },
  pro: {
    id: "pro",
    label: "Pro",
    allowedEmployees: [
      "atlas",
      "engineering",
      "sales",
      "marketing",
      "finance",
      "ops",
      "hr",
    ],
  },
  enterprise: {
    id: "enterprise",
    label: "Enterprise",
    allowedEmployees: [
      "atlas",
      "engineering",
      "sales",
      "marketing",
      "finance",
      "ops",
      "hr",
      "compliance",
      "legal",
    ],
  },
};

/** Returns the tier definition for a given tier_id, defaulting to free. */
export function getTier(tierId: string | null | undefined): TierDefinition {
  if (!tierId) return TIERS.free;
  return (TIERS as Record<string, TierDefinition>)[tierId] ?? TIERS.free;
}

/** Returns true if the given employee is accessible on the given tier. */
export function isEmployeeAllowed(
  employeeId: EmployeeId,
  tierId: string | null | undefined,
): boolean {
  return getTier(tierId).allowedEmployees.includes(employeeId);
}

/** Returns the lowest tier that unlocks an employee (for upgrade messaging). */
export function requiredTierFor(employeeId: EmployeeId): TierDefinition | null {
  const order: TierId[] = ["free", "pro", "enterprise"];
  for (const id of order) {
    if (TIERS[id].allowedEmployees.includes(employeeId)) return TIERS[id];
  }
  return null;
}
