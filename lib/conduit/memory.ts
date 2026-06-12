import { supabase } from "../supabase";
import { getOrCreateAccount } from "./account";
import type { MemoryRecord } from "./types";

/**
 * Subscribe to new memory rows for the current account. Fires the callback
 * when any INSERT lands on conduit_memory. Returns an unsubscribe function.
 */
export function subscribeToMemory(
  accountId: string,
  onInsert: (record: MemoryRecord) => void,
): () => void {
  const nonce = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  const channel = supabase
    .channel(`memory-${accountId}:${nonce}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "conduit_memory",
        filter: `account_id=eq.${accountId}`,
      },
      (payload) => {
        onInsert(payload.new as MemoryRecord);
      },
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export async function listMemory(): Promise<MemoryRecord[]> {
  const account = await getOrCreateAccount();
  if (!account) return [];

  const { data, error } = await supabase
    .from("conduit_memory")
    .select(
      "id, account_id, kind, content, tags, source_conversation_id, source_message_id, written_by, created_at, updated_at, archived_at, superseded_by",
    )
    .eq("account_id", account.id)
    .is("archived_at", null)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    console.warn("[Memory] list failed:", error.message);
    return [];
  }
  return (data ?? []) as MemoryRecord[];
}

export async function archiveMemory(id: string): Promise<boolean> {
  const { error } = await supabase
    .from("conduit_memory")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", id);
  if (error) {
    console.warn("[Memory] archive failed:", error.message);
    return false;
  }
  return true;
}
