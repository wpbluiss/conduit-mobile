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
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    cachedAccount = existing as ConduitAccount;
    return cachedAccount;
  }

  if (fetchErr && fetchErr.code !== "PGRST116") {
    console.warn("[Account] Fetch failed:", fetchErr.message);
  }

  // Create one — server side will also do this on web; keep client-side mirror minimal
  const { data: created, error: insertErr } = await supabase
    .from("conduit_accounts")
    .insert({
      user_id: user.id,
      display_name:
        user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? null,
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
