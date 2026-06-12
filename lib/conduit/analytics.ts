import { supabase } from "../supabase";
import { getCachedAccount, getOrCreateAccount } from "./account";

// Allowlisted property keys — matches conduit_analytics_events on the web.
// Do NOT add email, name, device, IP, or any other PII here.
type AllowedProperty = "tier_id" | "topup_id" | "reason" | "employee" | "referrer";
export type EventProperties = Partial<Record<AllowedProperty, string | null>>;

export type AnalyticsEventName =
  | "page_view"
  | "signup_started"
  | "signup_completed"
  | "paywall_viewed"
  | "checkout_clicked";

/**
 * Fire an analytics event. Fire-and-forget: never awaited by callers,
 * never throws. Failures are swallowed to protect the user-facing flow.
 */
export function trackEvent(name: AnalyticsEventName, properties?: EventProperties): void {
  void (async () => {
    try {
      const account = getCachedAccount() ?? (await getOrCreateAccount());
      await supabase.from("conduit_analytics_events").insert({
        event_name: name,
        account_id: account?.id ?? null,
        properties: properties ?? null,
      });
    } catch {
      // Silent by design — analytics must never break the user-facing flow.
    }
  })();
}
