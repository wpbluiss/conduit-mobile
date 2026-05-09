import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft } from "phosphor-react-native";
import { usePraxisTheme } from "../../../contexts/PraxisThemeContext";
import { Text } from "../../../components/praxis";
import { MessageList } from "../../../components/praxis/chat/MessageList";
import { Composer } from "../../../components/praxis/chat/Composer";
import {
  appendUserMessage,
  createConversation,
  getConversation,
  subscribeToMessages,
} from "../../../lib/conduit/conversations";
import { streamChat } from "../../../lib/conduit/chat";
import type { Message, Conversation } from "../../../lib/conduit/types";
import type { EmployeeId } from "../../../lib/conduit/employees";

export default function ChatDetailScreen() {
  const t = usePraxisTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const isNew = params.id === "new";

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [streaming, setStreaming] = useState<{ content: string; employee: EmployeeId | "team" | null } | null>(null);
  const [waiting, setWaiting] = useState(false);

  const conversationIdRef = useRef<string | null>(isNew ? null : params.id);
  const streamingTextRef = useRef("");

  // Initial load
  useEffect(() => {
    if (isNew) return;
    let alive = true;
    (async () => {
      const result = await getConversation(params.id);
      if (!alive || !result) return;
      setConversation(result.conversation);
      setMessages(result.messages);
      conversationIdRef.current = result.conversation.id;
    })();
    return () => {
      alive = false;
    };
  }, [params.id, isNew]);

  // Realtime subscription for assistant-side messages persisted by the worker.
  useEffect(() => {
    const cid = conversationIdRef.current;
    if (!cid) return;
    const unsub = subscribeToMessages(cid, (msg) => {
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
    });
    return unsub;
  }, [conversation?.id]);

  const handleSend = useCallback(
    async (text: string) => {
      let cid = conversationIdRef.current;

      // First message in a new conversation: create it now.
      if (!cid) {
        const titleSeed = text.length > 60 ? text.slice(0, 60) + "…" : text;
        const created = await createConversation(titleSeed);
        if (!created) return;
        cid = created.id;
        conversationIdRef.current = cid;
        setConversation(created);
        // Replace URL so the back button goes to chat list, not /chat/new
        router.replace(`/(app)/chat/${cid}`);
      }

      // Optimistic insert of the user message
      const optimistic: Message = {
        id: `local-${Date.now()}`,
        conversation_id: cid,
        role: "user",
        employee: null,
        content: text,
        metadata: null,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, optimistic]);

      // Persist the user message so the realtime + server-side handler see it
      const persisted = await appendUserMessage(cid, text);
      if (persisted) {
        setMessages((prev) =>
          prev.map((m) => (m.id === optimistic.id ? persisted : m)),
        );
      }

      // Now stream the assistant response
      streamingTextRef.current = "";
      setWaiting(true);
      setStreaming({ content: "", employee: null });

      let resolvedEmployee: EmployeeId | "team" | null = null;

      await streamChat(
        { conversation_id: cid, message: text },
        {
          onMeta: (m) => {
            if (m.employee) {
              resolvedEmployee = m.employee as EmployeeId | "team";
              setStreaming((s) => (s ? { ...s, employee: resolvedEmployee } : s));
            }
          },
          onToken: (chunk) => {
            streamingTextRef.current += chunk;
            setStreaming({ content: streamingTextRef.current, employee: resolvedEmployee });
          },
          onError: (err) => {
            console.warn("[Chat] stream error:", err.message);
          },
          onDone: () => {
            // The worker will persist the final message and realtime will deliver it.
            // We still drop the streaming buffer so the realtime row takes over.
            setWaiting(false);
            setStreaming(null);
          },
        },
      );

      // Safety: if the stream ended without a done event
      setWaiting(false);
      setStreaming(null);
    },
    [router],
  );

  const title = conversation?.title ?? (isNew ? "New conversation" : "Loading…");

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.bgCanvas }} edges={["top"]}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          paddingHorizontal: 8,
          paddingVertical: 8,
          borderBottomColor: t.colors.borderSubtle,
          borderBottomWidth: 0.5,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          style={{ width: 36, height: 36, alignItems: "center", justifyContent: "center" }}
        >
          <ArrowLeft size={20} color={t.colors.inkPrimary} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text variant="caption" tone="tertiary">
            CONVERSATION
          </Text>
          <Text variant="bodyLg" weight="semibold" numberOfLines={1}>
            {title}
          </Text>
        </View>
      </View>

      <View style={{ flex: 1 }}>
        <MessageList messages={messages} streaming={streaming} isWaiting={waiting} />
      </View>

      <Composer onSubmit={handleSend} streaming={waiting || !!streaming} />
    </SafeAreaView>
  );
}
