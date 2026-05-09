import { supabase } from "../supabase";

export const API_URL =
  process.env.EXPO_PUBLIC_API_URL || "https://conduitai.io";

const SUPABASE_URL = "https://mvuslmfjkkuizixjpkgl.supabase.co";

function projectRef(): string {
  // Extract from URL: https://<ref>.supabase.co
  try {
    const u = new URL(SUPABASE_URL);
    return u.hostname.split(".")[0];
  } catch {
    return "mvuslmfjkkuizixjpkgl";
  }
}

/**
 * Build a Cookie header that mimics what @supabase/ssr expects for cookie-auth
 * routes on conduitai.io. The web `createServerClient` reads
 * `sb-<ref>-auth-token` (single chunk or chunked .0/.1 variants).
 */
async function buildSupabaseCookie(): Promise<string | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return null;

  const ref = projectRef();
  const cookieName = `sb-${ref}-auth-token`;

  // @supabase/ssr stores the session as a base64 array
  // [access_token, refresh_token, provider_token, provider_refresh_token, user]
  const payload: unknown[] = [
    session.access_token,
    session.refresh_token,
    null,
    null,
    session.user,
  ];

  let value: string;
  try {
    const json = JSON.stringify(payload);
    // base64-encode using btoa (available in RN 0.72+ via core-js)
    value = `base64-${btoaSafe(json)}`;
  } catch (e) {
    console.warn("[API] cookie build failed:", e);
    return null;
  }

  return `${cookieName}=${value}`;
}

function btoaSafe(input: string): string {
  if (typeof btoa === "function") return btoa(unescape(encodeURIComponent(input)));
  // Fallback: manual base64 (RN should always have btoa, but JIC)
  const buffer = Buffer.from(input, "utf-8");
  return buffer.toString("base64");
}

/** Authenticated fetch to the Praxis API. */
export async function authedFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const cookie = await buildSupabaseCookie();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers: Record<string, string> = {
    ...((init.headers as Record<string, string>) ?? {}),
    "Content-Type": "application/json",
  };

  if (cookie) headers.Cookie = cookie;
  if (session?.access_token)
    headers.Authorization = `Bearer ${session.access_token}`;

  const url = path.startsWith("http") ? path : `${API_URL}${path}`;

  return fetch(url, { ...init, headers });
}
