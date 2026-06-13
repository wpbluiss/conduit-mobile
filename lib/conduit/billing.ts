import { authedFetch } from "./api";
import type { ConduitAccount } from "./types";

export type TierId = "free" | "pro" | "enterprise";

export interface TierConfig {
  id: TierId;
  label: string;
  badgeColor: string;
  badgeBg: string;
  models: string[];
}

export const TIERS: Record<TierId, TierConfig> = {
  free: {
    id: "free",
    label: "Free",
    badgeColor: "#7B8194",
    badgeBg: "rgba(123,129,148,0.12)",
    models: ["Claude Haiku"],
  },
  pro: {
    id: "pro",
    label: "Pro",
    badgeColor: "#5B63E8",
    badgeBg: "rgba(91,99,232,0.12)",
    models: ["Claude Haiku", "Claude Sonnet"],
  },
  enterprise: {
    id: "enterprise",
    label: "Enterprise",
    badgeColor: "#D67817",
    badgeBg: "rgba(214,120,23,0.12)",
    models: ["Claude Haiku", "Claude Sonnet", "Claude Opus"],
  },
};

export function getTierConfig(tierId: string | null | undefined): TierConfig {
  const id = (tierId ?? "free") as TierId;
  return TIERS[id] ?? TIERS.free;
}

/** Returns true when the account has consumed its token allowance and should be paywalled.
 *  Fails open (returns false) when cap is unknown, so paid users are never blocked by a
 *  detection failure. */
export function isPaywalled(account: Pick<ConduitAccount, "monthly_tokens_used" | "monthly_token_cap" | "bonus_tokens">): boolean {
  const cap = account.monthly_token_cap;
  if (cap == null) return false;
  const used = account.monthly_tokens_used ?? 0;
  const bonus = account.bonus_tokens ?? 0;
  return used >= cap + bonus;
}

/** POST /api/conduit/billing/portal — returns the Stripe Portal session URL.
 *  The caller is responsible for opening the URL with Linking. */
export async function fetchBillingPortalUrl(): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  try {
    const res = await authedFetch("/api/conduit/billing/portal", { method: "POST" });
    if (!res.ok) {
      return { ok: false, error: `Server error (${res.status})` };
    }
    const body = await res.json() as { url?: string };
    if (!body?.url) return { ok: false, error: "No portal URL returned" };
    return { ok: true, url: body.url };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Network error" };
  }
}
