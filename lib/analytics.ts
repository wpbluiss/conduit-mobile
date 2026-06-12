/**
 * Signup-funnel analytics — mirrors conduit-nextjs#33.
 *
 * Writes to `conduit_analytics_events` in Supabase.
 * Fire-and-forget: never throws, never blocks UI.
 *
 * Only the five allowlisted property keys are persisted to avoid accidental PII.
 */
import { supabase } from "./supabase";
import { getCachedAccount } from "./conduit/account";

type FunnelEvent =
  | "page_view"
  | "signup_started"
  | "signup_completed"
  | "paywall_viewed"
  | "checkout_clicked";

interface AllowedProps {
  tier_id?: string;
  topup_id?: string;
  reason?: string;
  employee?: string;
  referrer?: string;
}

async function track(event: FunnelEvent, props?: AllowedProps): Promise<void> {
  try {
    const account_id = getCachedAccount()?.id ?? null;
    const { error } = await supabase.from("conduit_analytics_events").insert({
      account_id,
      event,
      properties: props ?? {},
    });
    if (error) {
      console.warn("[Analytics] track failed:", error.message);
    }
  } catch (e) {
    console.warn("[Analytics] track threw:", e instanceof Error ? e.message : e);
  }
}

/** Signup screen became visible, or pricing screen loaded. */
export function trackPageView(props?: Pick<AllowedProps, "referrer">): void {
  void track("page_view", props);
}

/** User tapped the submit button on the signup form. */
export function trackSignupStarted(): void {
  void track("signup_started");
}

/** Supabase session returned after successful signup. */
export function trackSignupCompleted(props?: Pick<AllowedProps, "tier_id">): void {
  void track("signup_completed", props);
}

/** Paywall modal became visible (call when paywall UI lands). */
export function trackPaywallViewed(props?: Pick<AllowedProps, "reason" | "tier_id">): void {
  void track("paywall_viewed", props);
}

/** User tapped the upgrade / checkout button (call when paywall UI lands). */
export function trackCheckoutClicked(props?: Pick<AllowedProps, "tier_id" | "topup_id">): void {
  void track("checkout_clicked", props);
}
