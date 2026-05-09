import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Constants from "expo-constants";
import { usePraxisTheme } from "../../../contexts/PraxisThemeContext";
import { Text } from "../Text";
import { Drawer } from "./Drawer";
import { ChatTopBar } from "./ChatTopBar";
import { WelcomeState } from "./WelcomeState";
import { EmployeePicker } from "./EmployeePicker";
import { Composer } from "./Composer";
import { MessageList } from "./MessageList";
import {
  appendUserMessage,
  createConversation,
  getConversation,
  listConversations,
  subscribeToMessages,
} from "../../../lib/conduit/conversations";
import { streamChat } from "../../../lib/conduit/chat";
import { getOrCreateAccount } from "../../../lib/conduit/account";
import type { Conversation, Message } from "../../../lib/conduit/types";
import {
  EMPLOYEES,
  type EmployeeId,
} from "../../../lib/conduit/employees";
import { useAuthStore } from "../../../store/authStore";

const SUGGESTIONS = [
  "Brief me on what's pending.",
  "What did Lunaro ship today?",
  "Show me this week's builds.",
];

function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return "Late night";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export interface ChatShellProps {
  /** Existing conversation id to load, or null/'new' for a fresh thread. */
  conversationId: string | null;
  /** Pre-fill the composer with this text (e.g. via deep link). */
  initialDraft?: string;
  /** Force route into a specific employee (for pinned employee taps). */
  preferredEmployee?: EmployeeId | null;
}

export function ChatShell({
  conversationId,
  initialDraft,
  preferredEmployee,
}: ChatShellProps) {
  const t = usePraxisTheme();
  const router = useRouter();
  const { user } = useAuthStore();

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [streaming, setStreaming] = useState<{
    content: string;
    employee: EmployeeId | "team" | null;
  } | null>(null);
  const [waiting, setWaiting] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [composerDraft, setComposerDraft] = useState<string | undefined>(
    initialDraft,
  );
  const [routedEmployee, setRoutedEmployee] = useState<
    EmployeeId | "team" | null
  >(preferredEmployee ?? null);
  const [conversationsList, setConversationsList] = useState<Conversation[]>([]);

  const conversationIdRef = useRef<string | null>(conversationId);
  const streamingTextRef = useRef("");

  const displayName =
    (user?.user_metadata as Record<string, unknown> | undefined)?.full_name as
      | string
      | undefined ||
    user?.email?.split("@")[0] ||
    "there";

  // Make sure account exists before any other queries; we don't need the value
  // here, but this primes the cache so the schema-error logs don't recur.
  useEffect(() => {
    getOrCreateAccount();
  }, []);

  // Load the conversation if we have an id, refresh sidebar list always.
  useEffect(() => {
    let alive = true;
    (async () => {
      const list = await listConversations();
      if (alive) setConversationsList(list);
    })();
    return () => {
      alive = false;
    };
  }, [conversation?.id, conversation?.updated_at]);

  useEffect(() => {
    let alive = true;
    if (!conversationId) {
      setConversation(null);
      setMessages([]);
      conversationIdRef.current = null;
      return;
    }
    (async () => {
      const result = await getConversation(conversationId);
      if (!alive || !result) return;
      setConversation(result.conversation);
      setMessages(result.messages);
      conversationIdRef.current = result.conversation.id;
    })();
    return () => {
      alive = false;
    };
  }, [conversationId]);

  // Realtime: pick up assistant messages persisted by the worker.
  useEffect(() => {
    const cid = conversation?.id;
    if (!cid) return;
    const unsub = subscribeToMessages(cid, (msg) => {
      setMessages((prev) =>
        prev.some((m) => m.id === msg.id) ? prev : [...prev, msg],
      );
    });
    return unsub;
  }, [conversation?.id]);

  const handleSend = useCallback(
    async (text: string) => {
      let cid = conversationIdRef.current;

      if (!cid) {
        const titleSeed = text.length > 60 ? text.slice(0, 60) + "…" : text;
        const created = await createConversation(titleSeed);
        if (!created) return;
        cid = created.id;
        conversationIdRef.current = cid;
        setConversation(created);
        // Replace URL so back goes to active, not /new
        router.replace(`/(app)/chat/${cid}` as never);
      }

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

      const persisted = await appendUserMessage(cid, text);
      if (persisted) {
        setMessages((prev) =>
          prev.map((m) => (m.id === optimistic.id ? persisted : m)),
        );
      }

      streamingTextRef.current = "";
      setWaiting(true);
      setStreaming({ content: "", employee: routedEmployee });

      let resolved: EmployeeId | "team" | null = routedEmployee;

      await streamChat(
        {
          conversation_id: cid,
          message: text,
          employee_override: routedEmployee ?? undefined,
        },
        {
          onMeta: (m) => {
            if (m.employee) {
              resolved = m.employee as EmployeeId | "team";
              setStreaming((s) => (s ? { ...s, employee: resolved } : s));
            }
          },
          onToken: (chunk) => {
            streamingTextRef.current += chunk;
            setStreaming({
              content: streamingTextRef.current,
              employee: resolved,
            });
          },
          onError: (err) => {
            console.warn("[Chat] stream error:", err.message);
          },
          onDone: () => {
            setWaiting(false);
            setStreaming(null);
          },
        },
      );

      setWaiting(false);
      setStreaming(null);
      // After first turn we don't keep forcing the employee.
      setRoutedEmployee(null);
    },
    [router, routedEmployee],
  );

  const onSelectConversation = (id: string) => {
    if (id === conversation?.id) return;
    router.push(`/(app)/chat/${id}` as never);
  };

  const onNewChat = () => {
    if (!conversation) {
      // Already on a blank slate.
      setMessages([]);
      conversationIdRef.current = null;
      return;
    }
    router.push("/(app)/chat/new" as never);
  };

  const onSelectEmployeeFromDrawer = (id: EmployeeId) => {
    setRoutedEmployee(id);
    setComposerDraft(`@${EMPLOYEES[id].name} `);
    if (conversation) {
      router.push("/(app)/chat/new" as never);
    }
  };

  const onPickerSelect = (id: EmployeeId | "team") => {
    setRoutedEmployee(id);
    if (id === "team") {
      setComposerDraft((prev) => prev ?? "");
    } else {
      setComposerDraft((prev) => `@${EMPLOYEES[id].name} ${prev ?? ""}`);
    }
  };

  const isStreaming = waiting || !!streaming;
  const isEmpty = !conversation && messages.length === 0;

  const headerTitle = conversation?.title
    ? conversation.title
    : isEmpty
      ? "New conversation"
      : "Conversation";

  const headerSubtitle = (() => {
    if (routedEmployee && routedEmployee !== "team") {
      return `Routing to ${EMPLOYEES[routedEmployee].name}`;
    }
    if (routedEmployee === "team") return "Routing to the team";
    if (conversation?.dominant_employee) {
      const cfg = EMPLOYEES[conversation.dominant_employee as EmployeeId];
      if (cfg) return `with ${cfg.name}`;
    }
    return undefined;
  })();

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: t.colors.bgCanvas }}
      edges={["top"]}
    >
      <ChatTopBar
        title={headerTitle}
        subtitle={headerSubtitle}
        onMenuPress={() => setDrawerOpen(true)}
        onNewPress={onNewChat}
      />

      <View style={{ flex: 1 }}>
        {isEmpty ? (
          <WelcomeState
            greeting={greeting()}
            displayName={displayName}
            suggestions={SUGGESTIONS}
            onSelectSuggestion={(s) => setComposerDraft(s)}
          />
        ) : (
          <MessageList
            messages={messages}
            streaming={streaming}
            isWaiting={waiting}
          />
        )}
      </View>

      <Composer
        onSubmit={handleSend}
        onVoicePress={() => router.push("/(app)/voice" as never)}
        onPlusPress={() => setPickerOpen(true)}
        streaming={isStreaming}
        initialValue={composerDraft}
        placeholder={
          isEmpty ? "Type or talk to Praxis…" : "Reply to Praxis…"
        }
      />

      <BuildFooter />

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        conversations={conversationsList}
        activeConversationId={conversation?.id ?? null}
        onSelectConversation={onSelectConversation}
        onNewChat={onNewChat}
        onSelectEmployee={onSelectEmployeeFromDrawer}
      />

      <EmployeePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={onPickerSelect}
      />
    </SafeAreaView>
  );
}

function BuildFooter() {
  const t = usePraxisTheme();
  const router = useRouter();
  const version = Constants.expoConfig?.version ?? "1.0.0";
  const build = Constants.expoConfig?.ios?.buildNumber ?? "?";
  return (
    <Pressable
      onPress={() => router.push("/(app)/settings/account" as never)}
      hitSlop={4}
      style={({ pressed }) => ({
        paddingBottom: 8,
        paddingHorizontal: 16,
        alignItems: "center",
        opacity: pressed ? 0.5 : 1,
        backgroundColor: t.colors.bgCanvas,
      })}
    >
      <Text
        variant="caption"
        tone="tertiary"
        style={{ letterSpacing: 0.4, fontSize: 10 }}
      >
        PRAXIS CONSOLE · v{version} (BUILD {build})
      </Text>
    </Pressable>
  );
}
