import { supabase } from "../supabase";
import { getOrCreateAccount } from "./account";
import type { Conversation, Message } from "./types";

export async function listConversations(): Promise<Conversation[]> {
  const account = await getOrCreateAccount();
  if (!account) return [];

  const { data, error } = await supabase
    .from("conduit_conversations")
    .select("id, account_id, title, created_at, updated_at")
    .eq("account_id", account.id)
    .order("updated_at", { ascending: false })
    .limit(100);

  if (error) {
    console.warn("[Conversations] list failed:", error.message);
    return [];
  }
  return (data ?? []) as Conversation[];
}

export async function getConversation(
  id: string,
): Promise<{ conversation: Conversation; messages: Message[] } | null> {
  const account = await getOrCreateAccount();
  if (!account) return null;

  const [convoRes, messagesRes] = await Promise.all([
    supabase
      .from("conduit_conversations")
      .select("id, account_id, title, created_at, updated_at")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("conduit_messages")
      .select("id, conversation_id, role, employee, content, metadata, created_at")
      .eq("conversation_id", id)
      .order("created_at", { ascending: true }),
  ]);

  const conversation = convoRes.data as Conversation | null;
  if (!conversation || conversation.account_id !== account.id) return null;

  return {
    conversation,
    messages: (messagesRes.data ?? []) as Message[],
  };
}

export async function createConversation(title: string): Promise<Conversation | null> {
  const account = await getOrCreateAccount();
  if (!account) return null;

  const { data, error } = await supabase
    .from("conduit_conversations")
    .insert({ account_id: account.id, title: title.slice(0, 60) || "New conversation" })
    .select("id, account_id, title, created_at, updated_at")
    .single();

  if (error || !data) {
    console.warn("[Conversations] create failed:", error?.message);
    return null;
  }
  return data as Conversation;
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
    .select("id, conversation_id, role, employee, content, metadata, created_at")
    .single();

  if (error || !data) {
    console.warn("[Conversations] append message failed:", error?.message);
    return null;
  }
  return data as Message;
}

/** Subscribe to new messages on a conversation. Returns an unsubscribe fn. */
export function subscribeToMessages(
  conversationId: string,
  onMessage: (msg: Message) => void,
): () => void {
  const channel = supabase
    .channel(`conv-${conversationId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "conduit_messages",
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        onMessage(payload.new as Message);
      },
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
