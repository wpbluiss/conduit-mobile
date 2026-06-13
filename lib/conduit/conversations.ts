import { supabase } from "../supabase";
import { getOrCreateAccount } from "./account";
import {
  normalizeContent,
  normalizeConversation,
  normalizeMessage,
  normalizeMessages,
} from "./normalize";
import type { Conversation, Message } from "./types";

const PREVIEW_MAX_LEN = 140;

export async function listConversations(): Promise<Conversation[]> {
  const account = await getOrCreateAccount();
  if (!account) return [];

  const { data, error } = await supabase
    .from("conduit_conversations")
    .select("id, account_id, title, created_at, updated_at, dominant_employee")
    .eq("account_id", account.id)
    .order("updated_at", { ascending: false })
    .limit(100);

  if (error) {
    console.warn("[Conversations] list failed:", error.message);
    return [];
  }
  const conversations = (data ?? [])
    .map((row) => normalizeConversation(row))
    .filter((c): c is Conversation => c !== null);

  if (conversations.length === 0) return conversations;

  // Attach a short preview of each conversation's most recent message so
  // the drawer can render a two-line iMessage-style row. Single batched
  // query fetches all relevant messages; we group + take the latest per
  // conversation client-side. Cheap up to a few hundred messages; if this
  // grows expensive, swap to a Postgres RPC with DISTINCT ON.
  const ids = conversations.map((c) => c.id);
  const { data: msgRows, error: msgErr } = await supabase
    .from("conduit_messages")
    .select("conversation_id, content, role, created_at")
    .in("conversation_id", ids)
    .order("created_at", { ascending: false });

  if (msgErr) {
    console.warn("[Conversations] preview fetch failed:", msgErr.message);
    return conversations;
  }

  const latestByConv = new Map<string, { content: unknown }>();
  for (const m of msgRows ?? []) {
    const cid = (m as { conversation_id?: string }).conversation_id;
    if (typeof cid !== "string") continue;
    if (latestByConv.has(cid)) continue;
    latestByConv.set(cid, m as { content: unknown });
  }

  return conversations.map((c) => {
    const last = latestByConv.get(c.id);
    if (!last) return c;
    const text = normalizeContent(last.content)
      .replace(/\s+/g, " ")
      .trim();
    return {
      ...c,
      last_message_preview: text
        ? text.slice(0, PREVIEW_MAX_LEN)
        : null,
    };
  });
}

/** Return the most recent conversation, or null if none exist. */
export async function getMostRecentConversation(): Promise<Conversation | null> {
  const account = await getOrCreateAccount();
  if (!account) return null;

  const { data, error } = await supabase
    .from("conduit_conversations")
    .select("id, account_id, title, created_at, updated_at, dominant_employee")
    .eq("account_id", account.id)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.warn("[Conversations] recent failed:", error.message);
    return null;
  }
  return normalizeConversation(data);
}

const MESSAGE_PAGE_SIZE = 50;

export async function getConversation(
  id: string,
): Promise<{ conversation: Conversation; messages: Message[]; hasMoreMessages: boolean } | null> {
  const account = await getOrCreateAccount();
  if (!account) return null;

  const [convoRes, messagesRes] = await Promise.all([
    supabase
      .from("conduit_conversations")
      .select(
        "id, account_id, title, created_at, updated_at, dominant_employee",
      )
      .eq("id", id)
      .maybeSingle(),
    // Load the most recent 50 messages; if exactly 50 returned there may be older ones.
    supabase
      .from("conduit_messages")
      .select("*")
      .eq("conversation_id", id)
      .order("created_at", { ascending: false })
      .limit(MESSAGE_PAGE_SIZE),
  ]);

  if (convoRes.error) {
    console.warn("[Conversations] get failed:", convoRes.error.message);
    return null;
  }
  if (messagesRes.error) {
    console.warn(
      "[Conversations] messages fetch failed:",
      messagesRes.error.message,
    );
  }

  const conversation = normalizeConversation(convoRes.data);
  if (!conversation || conversation.account_id !== account.id) return null;

  const rows = messagesRes.data ?? [];
  // Rows are newest-first; reverse for chronological display.
  const messages = normalizeMessages([...rows].reverse(), conversation.id);

  return {
    conversation,
    messages,
    hasMoreMessages: rows.length === MESSAGE_PAGE_SIZE,
  };
}

/** Fetch messages older than `beforeCreatedAt` for load-more-history. */
export async function fetchOlderMessages(
  conversationId: string,
  beforeCreatedAt: string,
  limit = MESSAGE_PAGE_SIZE,
): Promise<{ messages: Message[]; hasMoreMessages: boolean }> {
  const { data, error } = await supabase
    .from("conduit_messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .lt("created_at", beforeCreatedAt)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.warn("[Conversations] fetchOlderMessages failed:", error.message);
    return { messages: [], hasMoreMessages: false };
  }

  const rows = data ?? [];
  return {
    messages: normalizeMessages([...rows].reverse(), conversationId),
    hasMoreMessages: rows.length === limit,
  };
}

export async function createConversation(
  title: string,
): Promise<Conversation | null> {
  const account = await getOrCreateAccount();
  if (!account) return null;

  const { data, error } = await supabase
    .from("conduit_conversations")
    .insert({
      account_id: account.id,
      title: title.slice(0, 60) || "New conversation",
    })
    .select(
      "id, account_id, title, created_at, updated_at, dominant_employee",
    )
    .single();

  if (error || !data) {
    console.warn("[Conversations] create failed:", error?.message);
    return null;
  }
  return normalizeConversation(data);
}

export async function deleteConversation(id: string): Promise<boolean> {
  const { error } = await supabase
    .from("conduit_conversations")
    .delete()
    .eq("id", id);
  if (error) {
    console.warn("[Conversations] delete failed:", error.message);
    return false;
  }
  return true;
}

export async function appendUserMessage(
  conversationId: string,
  content: string,
): Promise<Message | null> {
  const { data, error } = await supabase
    .from("conduit_messages")
    .insert({
      conversation_id: conversationId,
      role: "user",
      content,
    })
    .select("*")
    .single();

  if (error || !data) {
    console.warn("[Conversations] append message failed:", error?.message);
    return null;
  }
  return normalizeMessage(data, conversationId);
}

export interface ConversationStage {
  stage: "thinking" | "routing";
  employee: string;
  label: string;
}

/**
 * Subscribe to transient typing-indicator events broadcast from the
 * chat-respond edge function on `conv-{id}:stage`. Returns an unsubscribe fn.
 * Unlike the messages channel, this topic is stable (no nonce) because the
 * server has to address it without knowing the client's mount epoch.
 */
export function subscribeToConversationStage(
  conversationId: string,
  onStage: (s: ConversationStage) => void,
): () => void {
  const channel = supabase
    .channel(`conv-${conversationId}:stage`)
    .on("broadcast", { event: "stage" }, (msg) => {
      const payload = msg.payload as Partial<ConversationStage> | undefined;
      if (
        payload &&
        (payload.stage === "thinking" || payload.stage === "routing") &&
        typeof payload.label === "string" &&
        typeof payload.employee === "string"
      ) {
        onStage({
          stage: payload.stage,
          employee: payload.employee,
          label: payload.label,
        });
      }
    })
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}

/** Subscribe to new messages on a conversation. Returns an unsubscribe fn. */
export function subscribeToMessages(
  conversationId: string,
  onMessage: (msg: Message) => void,
): () => void {
  // RealtimeClient.channel(topic) returns the EXISTING channel for the same
  // topic. `removeChannel` is async (it waits for the leave-ack before popping
  // the channel from the registry), so a fast remount of the chat screen can
  // pick up the previous, still-draining channel — which has joinedOnce=true,
  // causing `.on('postgres_changes', ...)` to throw "cannot add postgres_changes
  // callbacks for {topic} after subscribe()". A per-subscription nonce
  // guarantees a fresh channel every mount.
  const nonce = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  const channel = supabase
    .channel(`conv-${conversationId}:${nonce}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "conduit_messages",
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        onMessage(normalizeMessage(payload.new, conversationId));
      },
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
