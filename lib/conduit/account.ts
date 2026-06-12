import { supabase } from "../supabase";
import { authedFetch } from "./api";
import type { ConduitAccount } from "./types";

let cachedAccount: ConduitAccount | null = null;

export async function getOrCreateAccount(): Promise<ConduitAccount | null> {
  if (cachedAccount) return cachedAccount;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: existing, error: fetchErr } = await supabase
    .from("conduit_accounts")
    .select("*")
    .eq("owner_user_id", user.id)
    .maybeSingle();

  if (existing) {
    cachedAccount = existing as ConduitAccount;
    return cachedAccount;
  }

  if (fetchErr && fetchErr.code !== "PGRST116") {
    console.warn("[Account] Fetch failed:", fetchErr.message);
  }

  const fullName =
    (user.user_metadata?.full_name as string | undefined) ??
    user.email?.split("@")[0] ??
    "Workspace";

  const { data: created, error: insertErr } = await supabase
    .from("conduit_accounts")
    .insert({
      owner_user_id: user.id,
      name: fullName,
    })
    .select("*")
    .single();

  if (insertErr || !created) {
    console.warn("[Account] Create failed:", insertErr?.message);
    return null;
  }
  cachedAccount = created as ConduitAccount;
  return cachedAccount;
}

export async function updateAccountOnboarding(fields: {
  business_type: string;
  business_description: string;
}): Promise<{ ok: boolean; error?: string }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  const { data, error } = await supabase
    .from("conduit_accounts")
    .update(fields)
    .eq("owner_user_id", user.id)
    .select("*")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Update failed" };
  }
  cachedAccount = data as ConduitAccount;
  return { ok: true };
}

export function clearAccountCache() {
  cachedAccount = null;
}

export function getCachedAccount(): ConduitAccount | null {
  return cachedAccount;
}

export type DeleteAccountResult =
  | { ok: true }
  | { ok: false; protected: true }
  | { ok: false; protected?: false; message: string };

/**
 * Permanently delete the authenticated user's account.
 * Calls the server-side endpoint which cascades all data and deletes the auth
 * user. Returns { ok: true } on success, { ok: false, protected: true } if
 * the account is an internal/founder account (403), or an error message.
 */
export async function deleteAccount(): Promise<DeleteAccountResult> {
  try {
    const res = await authedFetch("/api/conduit/account/delete", {
      method: "POST",
    });

    if (res.ok || res.status === 404) {
      cachedAccount = null;
      return { ok: true };
    }

    if (res.status === 403) {
      return { ok: false, protected: true };
    }

    let message = `Server error (${res.status})`;
    try {
      const body = await res.json();
      if (typeof body?.error === "string") message = body.error;
    } catch {
      // ignore parse error, use default message
    }
    return { ok: false, message };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Network error";
    return { ok: false, message };
  }
}
