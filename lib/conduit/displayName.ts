// Resolve a user's first-name-style display name from a Supabase auth user.
//
// Priority chain (matches the dashboard's profile schema):
//   1. user_metadata.display_name
//   2. user_metadata.full_name → user_metadata.name → user_metadata.first_name
//   3. cleaned email username (digits stripped, separator-split, capitalized)
//
// Important: user_metadata can be stale if the session was issued before a
// server-side write to auth.users. The authStore now calls getUser() on
// launch to refresh metadata; this helper assumes that has run.

export interface DisplayNameUserShape {
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
}

export function deriveDisplayName(
  user: DisplayNameUserShape | null | undefined,
): string {
  const meta = user?.user_metadata;
  const fromMeta = (key: string): string | null => {
    const v = meta?.[key];
    return typeof v === "string" && v.trim() ? v.trim() : null;
  };

  const explicit = fromMeta("display_name");
  if (explicit) return explicit.split(/\s+/)[0];

  const full =
    fromMeta("full_name") ?? fromMeta("name") ?? fromMeta("first_name");
  if (full) return full.split(/\s+/)[0];

  const email = typeof user?.email === "string" ? user.email : "";
  const username = email.split("@")[0] ?? "";
  if (!username) return "there";

  const stripped = username.replace(/\d+/g, "");
  const firstChunk = stripped.split(/[._\-+]+/).filter(Boolean)[0] ?? "";
  if (!firstChunk) return "there";
  return firstChunk.charAt(0).toUpperCase() + firstChunk.slice(1).toLowerCase();
}

/** First letter of the derived display name, for avatar/initial UIs. */
export function deriveInitial(user: DisplayNameUserShape | null | undefined): string {
  const name = deriveDisplayName(user);
  return name === "there" ? "•" : name.charAt(0).toUpperCase();
}
