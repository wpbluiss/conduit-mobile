import { authedFetch } from "./api";

export interface CurrentUser {
  id: string;
  email: string;
  plan: string;
}

/**
 * Fetches the current user from GET /api/v1/me.
 * Returns null on any failure so callers can fall back to local Supabase data.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  try {
    const res = await authedFetch("/api/v1/me");
    if (res.ok) {
      return (await res.json()) as CurrentUser;
    }
    console.warn("[me] GET /api/v1/me status:", res.status);
    return null;
  } catch (e) {
    console.warn("[me] getCurrentUser error:", e);
    return null;
  }
}
