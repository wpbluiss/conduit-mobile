import { Linking } from "react-native";
import { authedFetch } from "./api";

export type TopUpPackage = "topup_500k" | "topup_1_5m" | "topup_3_5m";

export interface TopUpOption {
  id: TopUpPackage;
  label: string;
  price: string;
  tokens: string;
  tokenCount: number;
}

export const TOP_UP_OPTIONS: TopUpOption[] = [
  { id: "topup_500k", label: "Starter", price: "$10", tokens: "500k tokens", tokenCount: 500_000 },
  { id: "topup_1_5m", label: "Standard", price: "$25", tokens: "1.5M tokens", tokenCount: 1_500_000 },
  { id: "topup_3_5m", label: "Pro", price: "$50", tokens: "3.5M tokens", tokenCount: 3_500_000 },
];

export type BillingCallResult =
  | { ok: true }
  | { ok: false; message: string };

async function openBillingUrl(url: string): Promise<void> {
  const canOpen = await Linking.canOpenURL(url);
  if (canOpen) {
    await Linking.openURL(url);
  }
}

/** Opens the Stripe billing portal in the system browser. */
export async function openBillingPortal(): Promise<BillingCallResult> {
  try {
    const res = await authedFetch("/api/conduit/billing/portal", { method: "POST" });
    if (!res.ok) {
      return { ok: false, message: `Server error (${res.status})` };
    }
    const body = await res.json();
    const url: unknown = body?.url;
    if (typeof url !== "string") {
      return { ok: false, message: "Invalid portal response from server" };
    }
    await openBillingUrl(url);
    return { ok: true };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Network error" };
  }
}

/** Creates a Stripe checkout session for a token top-up and opens it in the system browser. */
export async function openTopUp(pkg: TopUpPackage): Promise<BillingCallResult> {
  try {
    const res = await authedFetch("/api/conduit/billing/checkout", {
      method: "POST",
      body: JSON.stringify({ package: pkg }),
    });
    if (!res.ok) {
      return { ok: false, message: `Server error (${res.status})` };
    }
    const body = await res.json();
    const url: unknown = body?.url;
    if (typeof url !== "string") {
      return { ok: false, message: "Invalid checkout response from server" };
    }
    await openBillingUrl(url);
    return { ok: true };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Network error" };
  }
}

/** Returns true when the account has hit its monthly token ceiling. */
export function isOverTokenCeiling(
  used: number | null | undefined,
  cap: number | null | undefined,
): boolean {
  if (cap == null || used == null) return false;
  return used >= cap;
}

export type TierId = "free" | "pro" | "enterprise";

/** Normalises a raw tier_id string (or null) to one of the three known tiers. */
export function normaliseTier(raw: string | null | undefined): TierId {
  if (raw === "pro") return "pro";
  if (raw === "enterprise") return "enterprise";
  return "free";
}
