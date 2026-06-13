import { Linking } from "react-native";
import { authedFetch } from "./api";

const BILLING_WEB_URL = "https://conduitai.io/app/settings/billing";

/** Tiers that have full Pro feature access. */
export function isPro(tierId: string | null | undefined): boolean {
  return tierId === "pro" || tierId === "enterprise";
}

/** Human-readable tier label. */
export function tierLabel(tierId: string | null | undefined): string {
  switch (tierId) {
    case "pro":
      return "Pro";
    case "enterprise":
      return "Enterprise";
    default:
      return "Free";
  }
}

/**
 * Open the Stripe billing portal for the current user.
 * Tries the server endpoint first; falls back to the web billing page.
 */
export async function openBillingPortal(): Promise<void> {
  try {
    const res = await authedFetch("/api/conduit/billing/portal", {
      method: "POST",
    });
    if (res.ok) {
      const body = await res.json();
      const url = body?.url as string | undefined;
      if (url) {
        await Linking.openURL(url);
        return;
      }
    }
  } catch {
    // fall through to fallback
  }
  await Linking.openURL(BILLING_WEB_URL);
}

/**
 * Open the Stripe checkout flow for the Pro plan.
 * Falls back to the web billing page if the endpoint is unavailable.
 */
export async function openCheckout(): Promise<void> {
  try {
    const res = await authedFetch("/api/conduit/billing/checkout", {
      method: "POST",
      body: JSON.stringify({ plan: "pro" }),
    });
    if (res.ok) {
      const body = await res.json();
      const url = body?.url as string | undefined;
      if (url) {
        await Linking.openURL(url);
        return;
      }
    }
  } catch {
    // fall through to fallback
  }
  await Linking.openURL(BILLING_WEB_URL);
}
