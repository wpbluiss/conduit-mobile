// Latest activity per AI employee for the /team status board.
//
// Reads the most recent assistant messages across all of the user's
// conversations and groups them by `employee`. One row per employee with
// the freshest message wins. Employees with zero activity surface with
// `lastAt: null`.

import { supabase } from "../supabase";
import { getOrCreateAccount } from "./account";
import { normalizeContent } from "./normalize";
import type { EmployeeId } from "./employees";
import { EMPLOYEE_LIST } from "./employees";

const PREVIEW_MAX_LEN = 120;
// Wide enough that the freshest message per employee is almost certainly
// present, narrow enough that the round-trip stays cheap on slow networks.
const SCAN_LIMIT = 300;

export interface EmployeeActivity {
  employee: EmployeeId;
  lastAt: string | null;
  lastPreview: string | null;
  lastConversationId: string | null;
}

export async function getTeamActivity(): Promise<EmployeeActivity[]> {
  const account = await getOrCreateAccount();
  if (!account) {
    return EMPLOYEE_LIST.map((e) => emptyActivity(e.id));
  }

  // First grab the user's conversation ids — RLS already scopes
  // conduit_messages to the owner, but filtering by conversation_id keeps
  // the index hot.
  const { data: convoRows } = await supabase
    .from("conduit_conversations")
    .select("id")
    .eq("account_id", account.id)
    .limit(500);

  const ids = (convoRows ?? []).map((c) => c.id as string).filter(Boolean);
  if (ids.length === 0) {
    return EMPLOYEE_LIST.map((e) => emptyActivity(e.id));
  }

  const { data: msgRows, error } = await supabase
    .from("conduit_messages")
    .select("conversation_id, content, employee, created_at")
    .eq("role", "assistant")
    .in("conversation_id", ids)
    .order("created_at", { ascending: false })
    .limit(SCAN_LIMIT);

  if (error) {
    console.warn("[Team] activity fetch failed:", error.message);
    return EMPLOYEE_LIST.map((e) => emptyActivity(e.id));
  }

  const latest = new Map<EmployeeId, EmployeeActivity>();
  for (const row of msgRows ?? []) {
    const emp = (row as { employee?: string | null }).employee;
    if (!emp) continue;
    const id = emp as EmployeeId;
    if (latest.has(id)) continue;
    const content = normalizeContent((row as { content: unknown }).content)
      .replace(/\s+/g, " ")
      .trim();
    latest.set(id, {
      employee: id,
      lastAt: (row as { created_at: string }).created_at,
      lastPreview: content
        ? content.slice(0, PREVIEW_MAX_LEN)
        : null,
      lastConversationId:
        (row as { conversation_id?: string | null }).conversation_id ?? null,
    });
  }

  return EMPLOYEE_LIST.map((e) => latest.get(e.id) ?? emptyActivity(e.id));
}

function emptyActivity(employee: EmployeeId): EmployeeActivity {
  return {
    employee,
    lastAt: null,
    lastPreview: null,
    lastConversationId: null,
  };
}

export interface EmployeeRecentMessage {
  conversationId: string;
  content: string;
  createdAt: string;
  role: "user" | "assistant";
}

/** Fetch the last `limit` messages involving a specific employee. */
export async function getEmployeeRecentMessages(
  employee: EmployeeId,
  limit = 10,
): Promise<EmployeeRecentMessage[]> {
  const account = await getOrCreateAccount();
  if (!account) return [];

  const { data: convoRows } = await supabase
    .from("conduit_conversations")
    .select("id")
    .eq("account_id", account.id)
    .limit(500);

  const ids = (convoRows ?? []).map((c) => c.id as string).filter(Boolean);
  if (ids.length === 0) return [];

  const { data, error } = await supabase
    .from("conduit_messages")
    .select("conversation_id, content, role, created_at")
    .in("conversation_id", ids)
    .eq("employee", employee)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.warn("[Team] employee messages fetch failed:", error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    conversationId: (row as { conversation_id: string }).conversation_id,
    content: normalizeContent((row as { content: unknown }).content)
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 200),
    createdAt: (row as { created_at: string }).created_at,
    role: (row as { role: string }).role as "user" | "assistant",
  }));
}

/** Compact "2h ago" / "now" / "yesterday" / "May 8" formatter. */
export function formatRelative(iso: string | null, now: Date = new Date()): string {
  if (!iso) return "—";
  const then = new Date(iso);
  const diffMs = now.getTime() - then.getTime();
  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day === 1) return "yesterday";
  if (day < 7) return `${day}d ago`;
  return then.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
