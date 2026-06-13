import React, { useCallback, useEffect, useRef, useState } from "react";
import { Keyboard, View, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Constants from "expo-constants";
import { usePraxisTheme } from "../../../contexts/PraxisThemeContext";
import { Text } from "../Text";
import { Drawer } from "./Drawer";
import { ChatTopBar } from "./ChatTopBar";
import { WelcomeState } from "./WelcomeState";
import { EmployeeWelcomeState } from "../surfaces/EmployeeWelcomeState";
import { Composer } from "./Composer";
import { MessageList } from "./MessageList";
import { ChatLoadingSkeleton } from "./ChatLoadingSkeleton";
import { ChatEmptyState } from "./ChatEmptyState";
import { ErrorBoundary } from "../ErrorBoundary";
import {
  appendUserMessage,
  createConversation,
  fetchOlderMessages,
  getConversation,
  listConversations,
  subscribeToConversationStage,
  subscribeToMessages,
  type ConversationStage,
} from "../../../lib/conduit/conversations";
import { respondToMessage } from "../../../lib/conduit/chat";
import { getOrCreateAccount } from "../../../lib/conduit/account";
import type { Conversation, Message } from "../../../lib/conduit/types";
import {
  EMPLOYEES,
  type EmployeeId,
} from "../../../lib/conduit/employees";
import { useAuthStore } from "../../../store/authStore";
import { deriveDisplayName } from "../../../lib/conduit/displayName";

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
  preferredEmployee?: EmployeeId | "team" | null;
  /** Auto-focus the composer when the screen mounts. */
  autoFocus?: boolean;
}

export function ChatShell({
  conversationId,
  initialDraft,
  preferredEmployee,
  autoFocus,
}: ChatShellProps) {
  const t = usePraxisTheme();
  const router = useRouter();
  const { user } = useAuthStore();

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState<boolean>(
    !!conversationId,
  );
  const [waiting, setWaiting] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [composerDraft, setComposerDraft] = useState<string | undefined>(
    initialDraft,
  );
  const [routedEmployee, setRoutedEmployee] = useState<
    EmployeeId | "team" | null
  >(preferredEmployee ?? null);
  const [conversationsList, setConversationsList] = useState<Conversation[]>([]);
  const [stage, setStage] = useState<ConversationStage | null>(null);
  /** Epoch ms after which the user can send again (null = not rate limited). */
  const [rateLimitUntil, setRateLimitUntil] = useState<number | null>(null);
  const [rateLimitSecondsLeft, setRateLimitSecondsLeft] = useState(0);
  const [hasOlderMessages, setHasOlderMessages] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [failedIds, setFailedIds] = useState<Set<string>>(new Set());

  const conversationIdRef = useRef<string | null>(conversationId);

  const displayName = deriveDisplayName(user);

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
      setLoadingMessages(false);
      setHasOlderMessages(false);
      conversationIdRef.current = null;
      return;
    }
    setLoadingMessages(true);
    (async () => {
      const result = await getConversation(conversationId);
      if (!alive) return;
      if (!result) {
        setConversation(null);
        setMessages([]);
        setLoadingMessages(false);
        return;
      }
      setConversation(result.conversation);
      setMessages(result.messages);
      setHasOlderMessages(result.hasMoreMessages);
      conversationIdRef.current = result.conversation.id;
      setLoadingMessages(false);
    })();
    return () => {
      alive = false;
    };
  }, [conversationId]);

  // Realtime: pick up assistant messages persisted by the worker. When an
  // assistant message lands, clear any in-flight stage label — the bubble
  // replaces the typing indicator.
  useEffect(() => {
    const cid = conversation?.id;
    if (!cid) return;
    const unsub = subscribeToMessages(cid, (msg) => {
      setMessages((prev) =>
        prev.some((m) => m.id === msg.id) ? prev : [...prev, msg],
      );
      if (msg.role === "assistant") setStage(null);
    });
    return unsub;
  }, [conversation?.id]);

  // Realtime: typing-stage broadcasts from chat-respond.
  useEffect(() => {
    const cid = conversation?.id;
    if (!cid) return;
    const unsub = subscribeToConversationStage(cid, (s) => setStage(s));
    return unsub;
  }, [conversation?.id]);

  // Countdown ticker for rate-limit cooldown.
  useEffect(() => {
    if (!rateLimitUntil) return;
    const tick = () => {
      const remaining = Math.ceil((rateLimitUntil - Date.now()) / 1000);
      if (remaining <= 0) {
        setRateLimitUntil(null);
        setRateLimitSecondsLeft(0);
      } else {
        setRateLimitSecondsLeft(remaining);
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [rateLimitUntil]);

  // Apply preferredEmployee/initialDraft when params change (deep links).
  useEffect(() => {
    if (preferredEmployee !== undefined) {
      setRoutedEmployee(preferredEmployee ?? null);
    }
  }, [preferredEmployee]);

  useEffect(() => {
    if (initialDraft !== undefined) setComposerDraft(initialDraft);
  }, [initialDraft]);

  const handleLoadOlder = useCallback(async () => {
    const cid = conversationIdRef.current;
    if (!cid || !hasOlderMessages || loadingOlder) return;
    const oldest = messages[0];
    if (!oldest) return;
    setLoadingOlder(true);
    const result = await fetchOlderMessages(cid, oldest.created_at);
    setLoadingOlder(false);
    if (result.messages.length > 0) {
      setMessages((prev) => {
        const existingIds = new Set(prev.map((m) => m.id));
        const fresh = result.messages.filter((m) => !existingIds.has(m.id));
        return [...fresh, ...prev];
      });
    }
    setHasOlderMessages(result.hasMoreMessages);
  }, [hasOlderMessages, loadingOlder, messages]);

  const handleRetry = useCallback(
    async (messageId: string) => {
      const msg = messages.find((m) => m.id === messageId);
      if (!msg) return;
      setFailedIds((prev) => {
        const next = new Set(prev);
        next.delete(messageId);
        return next;
      });
      const cid = conversationIdRef.current;
      if (!cid) return;
      const persisted = await appendUserMessage(cid, msg.content);
      if (persisted) {
        setMessages((prev) => prev.map((m) => (m.id === messageId ? persisted : m)));
      } else {
        setFailedIds((prev) => new Set(prev).add(messageId));
      }
    },
    [messages],
  );

  const handleSend = useCallback(
    async (text: string) => {
      let cid = conversationIdRef.current;

      if (!cid) {
        const titleSeed = text.length > 60 ? text.slice(0, 60) + "…" : text;
        const created = await createConversation(titleSeed);
        if (!created) {
          console.warn("[Chat] createConversation returned null — aborting send");
          return;
        }
        cid = created.id;
        conversationIdRef.current = cid;
        setConversation(created);
        // Do NOT router.replace here — switching routes unmounts /chat/new
        // mid-send, orphans appendUserMessage + the streaming response, and
        // the freshly-mounted /chat/[id] races getConversation against the
        // not-yet-persisted message → empty thread. Stay in-place; the
        // conversation is saved server-side and will surface in the drawer.
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
      } else {
        console.warn("[Chat] appendUserMessage failed — marking message as failed");
        setFailedIds((prev) => new Set(prev).add(optimistic.id));
      }

      setWaiting(true);
      setStage(null);

      const result = await respondToMessage(
        {
          conversation_id: cid,
          employee_override: routedEmployee ?? null,
        },
        {
          onError: (err) => {
            console.warn("[Chat] respond error:", err.message);
          },
        },
      );

      if (result.rateLimited) {
        const waitSeconds = result.retryAfterSeconds ?? 60;
        setRateLimitUntil(Date.now() + waitSeconds * 1000);
      }

      // Realtime subscription will push the new assistant row into the list,
      // but if for any reason the subscription is slow / lost, fall back to
      // fetching the row we know exists.
      if (result.ok && result.messageId) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === result.messageId)) return prev;
          // Realtime hasn't fired yet — defer one tick so the typing
          // indicator has time to clear before the bubble lands.
          return prev;
        });
      }

      setWaiting(false);
      setStage(null);
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
    // From drawer: route to a fresh thread with the employee pre-mentioned.
    router.push(`/(app)/chat/new?employee=${id}` as never);
  };

  const isRateLimited = !!rateLimitUntil;
  const isStreaming = waiting;
  const isEmpty = !conversation && messages.length === 0;
  const isLoadedEmptyConversation =
    !!conversation && !loadingMessages && messages.length === 0;

  // The "active employee" for header theming. Prefer the routed override
  // (deep-linked from a pinned employee tap) over the conversation's
  // dominant employee. "team" stays as team (no per-employee theming).
  const activeEmployee: EmployeeId | "team" | null = (() => {
    if (routedEmployee) return routedEmployee;
    if (conversation?.dominant_employee) {
      const id = conversation.dominant_employee as EmployeeId;
      return EMPLOYEES[id] ? id : null;
    }
    return null;
  })();

  const headerTitle = (() => {
    if (conversation?.title) return conversation.title;
    if (isEmpty && routedEmployee && routedEmployee !== "team") {
      return EMPLOYEES[routedEmployee].name;
    }
    if (isEmpty && routedEmployee === "team") return "The team";
    if (isEmpty) return "New conversation";
    return "Conversation";
  })();

  const headerSubtitle = (() => {
    if (isEmpty && routedEmployee && routedEmployee !== "team") {
      return EMPLOYEES[routedEmployee].title;
    }
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

  // The empty-state surface: when an employee is routed, render their
  // bespoke workspace. Otherwise fall back to the generic greeting.
  const showEmployeeSurface =
    isEmpty && routedEmployee !== null && routedEmployee !== "team";

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: t.colors.bgCanvas }}
      edges={["top"]}
    >
      <ChatTopBar
        title={headerTitle}
        subtitle={headerSubtitle}
        onMenuPress={() => {
          Keyboard.dismiss();
          setDrawerOpen(true);
        }}
        onNewPress={onNewChat}
        employee={activeEmployee}
      />

      <View style={{ flex: 1 }}>
        <ErrorBoundary resetKey={conversation?.id ?? "new"}>
          {showEmployeeSurface ? (
            <EmployeeWelcomeState
              employee={routedEmployee as EmployeeId}
              onSelectChip={(text) => setComposerDraft(text)}
            />
          ) : isEmpty ? (
            <WelcomeState
              greeting={greeting()}
              displayName={displayName}
              suggestions={SUGGESTIONS}
              onSelectSuggestion={(s) => setComposerDraft(s)}
            />
          ) : loadingMessages ? (
            <ChatLoadingSkeleton />
          ) : isLoadedEmptyConversation ? (
            <ChatEmptyState
              title={conversation?.title ?? "New conversation"}
              onStart={(text) => setComposerDraft(text)}
            />
          ) : (
            <MessageList
              messages={messages}
              streaming={null}
              isWaiting={waiting}
              stage={stage}
              failedIds={failedIds}
              onRetry={handleRetry}
              onLoadOlder={hasOlderMessages ? handleLoadOlder : undefined}
              loadingOlder={loadingOlder}
            />
          )}
        </ErrorBoundary>
      </View>

      {isRateLimited ? (
        <View
          style={{
            marginHorizontal: 12,
            marginBottom: 4,
            paddingHorizontal: 14,
            paddingVertical: 10,
            borderRadius: t.radii.md,
            backgroundColor: t.colors.bgSurface,
            borderWidth: 1,
            borderColor: t.colors.borderDefault,
          }}
        >
          <Text variant="bodySm" tone="secondary">
            {`Slow down — you're chatting too fast. Try again in ${rateLimitSecondsLeft}s.`}
          </Text>
        </View>
      ) : null}

      <Composer
        onSubmit={handleSend}
        onVoicePress={() => {
          const path = conversation?.id
            ? `/(app)/voice?conversationId=${conversation.id}`
            : "/(app)/voice";
          router.push(path as never);
        }}
        streaming={isStreaming}
        disabled={isRateLimited}
        initialValue={composerDraft}
        autoFocus={autoFocus}
        placeholder={
          isRateLimited
            ? `Try again in ${rateLimitSecondsLeft}s…`
            : isEmpty
              ? "Type or talk to Praxis…"
              : "Reply to Praxis…"
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
