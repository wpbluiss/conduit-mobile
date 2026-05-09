import { supabase } from "../supabase";
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

export function clearAccountCache() {
  cachedAccount = null;
}

export function getCachedAccount(): ConduitAccount | null {
  return cachedAccount;
}
