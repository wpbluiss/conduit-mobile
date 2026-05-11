import { supabase } from "../supabase";
import { getOrCreateAccount } from "./account";
import {
  normalizeConversation,
  normalizeMessage,
  normalizeMessages,
} from "./normalize";
import type { Conversation, Message } from "./types";

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
  return (data ?? [])
    .map((row) => normalizeConversation(row))
    .filter((c): c is Conversation => c !== null);
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

export async function getConversation(
  id: string,
): Promise<{ conversation: Conversation; messages: Message[] } | null> {
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
    supabase
      .from("conduit_messages")
      .select("*")
      .eq("conversation_id", id)
      .order("created_at", { ascending: true }),
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
    // Don't crash the screen — render the conversation with zero messages
    // and let the empty state explain.
  }

  const conversation = normalizeConversation(convoRes.data);
  if (!conversation || conversation.account_id !== account.id) return null;

  return {
    conversation,
    messages: normalizeMessages(messagesRes.data, conversation.id),
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
