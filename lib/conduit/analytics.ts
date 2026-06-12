import { supabase } from "../supabase";
import { getCachedAccount } from "./account";

export type AnalyticsEventName =
  | "page_view"
  | "signup_started"
  | "signup_completed"
  | "paywall_viewed"
  | "checkout_clicked";

const ALLOWED_KEYS = new Set([
  "tier_id",
  "topup_id",
  "reason",
  "employee",
  "referrer",
  "screen",
]);

type AllowedProps = Partial<{
  tier_id: string;
  topup_id: string;
  reason: string;
  employee: string;
  referrer: string;
  screen: string;
}>;

function sanitizeProps(props: AllowedProps): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(props)) {
    if (ALLOWED_KEYS.has(k) && v != null) out[k] = String(v);
  }
  return out;
}

/**
 * Fire-and-forget analytics event. Never throws; never blocks the caller.
 * account_id is resolved from the in-memory account cache (null if not yet loaded).
 */
export function trackEvent(name: AnalyticsEventName, props: AllowedProps = {}): void {
  const account = getCachedAccount();
  supabase
    .from("conduit_analytics_events")
    .insert({
      event_name: name,
      account_id: account?.id ?? null,
      properties: sanitizeProps(props),
    })
    .then(({ error }) => {
      if (error) console.warn("[analytics]", name, error.message);
    });
}

export const trackPageView = (screen: string): void =>
  trackEvent("page_view", { screen });

export const trackSignupStarted = (): void => trackEvent("signup_started");

export const trackSignupCompleted = (tierId?: string): void =>
  trackEvent("signup_completed", tierId ? { tier_id: tierId } : {});

export const trackPaywallViewed = (reason?: string): void =>
  trackEvent("paywall_viewed", reason ? { reason } : {});

export const trackCheckoutClicked = (tierId?: string): void =>
  trackEvent("checkout_clicked", tierId ? { tier_id: tierId } : {});
