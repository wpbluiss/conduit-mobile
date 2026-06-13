import { authedFetch } from "./api";
import type { EmployeeId } from "./employees";

export type MessageIntent = "work" | "creative" | "urgent" | "social";

export interface IntentResult {
  intent: MessageIntent;
  /** Suggested employee to route to, if any. */
  suggested_employee: EmployeeId | null;
}

/**
 * Call the adaptive intent classifier endpoint to determine how a message
 * should be routed. Returns null on any error so callers can fall back to
 * default (Atlas) routing without interrupting the send flow.
 */
export async function classifyIntent(message: string): Promise<IntentResult | null> {
  if (!message.trim()) return null;
  try {
    const encoded = encodeURIComponent(message.slice(0, 500));
    const res = await authedFetch(`/api/v1/routing/intent?message=${encoded}`);
    if (!res.ok) return null;
    const body = await res.json();
    const intent = body?.intent as MessageIntent | undefined;
    if (!intent) return null;
    return {
      intent,
      suggested_employee: (body?.suggested_employee as EmployeeId | null) ?? null,
    };
  } catch {
    return null;
  }
}
