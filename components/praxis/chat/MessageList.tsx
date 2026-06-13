import React, { useEffect, useRef } from "react";
import { ActivityIndicator, FlatList, Pressable, View } from "react-native";
import { MessageBubble } from "./MessageBubble";
import { StreamingIndicator } from "./StreamingIndicator";
import { ErrorBoundary } from "../ErrorBoundary";
import { Text } from "../Text";
import { usePraxisTheme } from "../../../contexts/PraxisThemeContext";
import type { Message } from "../../../lib/conduit/types";
import type { EmployeeId } from "../../../lib/conduit/employees";

export interface MessageListProps {
  messages: Message[];
  streaming?: { content: string; employee?: EmployeeId | "team" | null } | null;
  isWaiting?: boolean;
  /** Current typing-stage broadcast from chat-respond, if any. */
  stage?: { label: string; employee?: string | null } | null;
  /** IDs of messages that failed to persist. */
  failedMessageIds?: Set<string>;
  /** Called when the user taps "retry" on a failed message. */
  onRetryMessage?: (id: string) => void;
  /** Whether older messages can be loaded. */
  hasOlderMessages?: boolean;
  /** Called when the user taps "Load earlier messages". */
  onLoadOlder?: () => void;
  /** Whether older messages are currently being fetched. */
  loadingOlder?: boolean;
}

function MessageRowFallback() {
  const t = usePraxisTheme();
  return (
    <View style={{ paddingHorizontal: 16, paddingVertical: 6 }}>
      <Text variant="caption" tone="tertiary" align="center">
        couldn't render this message — skipping
      </Text>
      <View
        style={{
          height: 0.5,
          backgroundColor: t.colors.borderSubtle,
          marginTop: 4,
        }}
      />
    </View>
  );
}

export function MessageList({
  messages,
  streaming,
  isWaiting,
  stage,
  failedMessageIds,
  onRetryMessage,
  hasOlderMessages,
  onLoadOlder,
  loadingOlder,
}: MessageListProps) {
  const t = usePraxisTheme();
  const listRef = useRef<FlatList<Message>>(null);

  useEffect(() => {
    if (listRef.current && messages.length > 0) {
      listRef.current.scrollToEnd({ animated: true });
    }
  }, [messages.length, streaming?.content, isWaiting]);

  return (
    <FlatList
      ref={listRef}
      data={messages}
      keyExtractor={(m, i) =>
        typeof m?.id === "string" || typeof m?.id === "number"
          ? String(m.id)
          : `msg-${i}`
      }
      renderItem={({ item }) => {
        const isPending = String(item.id).startsWith("local-");
        const isFailed = failedMessageIds?.has(item.id) ?? false;
        return (
          <ErrorBoundary fallback={() => <MessageRowFallback />}>
            <MessageBubble
              role={item.role}
              content={item.content}
              employee={item.employee}
              pending={isPending && !isFailed}
              timestamp={!isPending ? item.created_at : undefined}
              failed={isFailed}
              onRetry={isFailed && onRetryMessage ? () => onRetryMessage(item.id) : undefined}
            />
          </ErrorBoundary>
        );
      }}
      contentContainerStyle={{ paddingVertical: 8 }}
      maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
      onContentSizeChange={() => {
        if (messages.length > 0) {
          listRef.current?.scrollToEnd({ animated: true });
        }
      }}
      ListHeaderComponent={
        hasOlderMessages ? (
          <View style={{ alignItems: "center", paddingVertical: 12 }}>
            {loadingOlder ? (
              <ActivityIndicator size="small" color={t.colors.indigo500} />
            ) : (
              <Pressable onPress={onLoadOlder} hitSlop={8}>
                <Text variant="bodySm" tone="indigo" weight="semibold">
                  Load earlier messages
                </Text>
              </Pressable>
            )}
          </View>
        ) : null
      }
      ListFooterComponent={
        streaming || isWaiting ? (
          <View>
            {streaming?.content ? (
              <MessageBubble
                role="assistant"
                content={streaming.content}
                employee={streaming.employee ?? "atlas"}
              />
            ) : null}
            {isWaiting && !streaming?.content ? (
              <StreamingIndicator
                label={stage?.label ?? null}
                employee={stage?.employee ?? null}
              />
            ) : null}
          </View>
        ) : null
      }
    />
  );
}
