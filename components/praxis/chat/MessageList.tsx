import React, { useEffect, useRef } from "react";
import { ActivityIndicator, FlatList, NativeScrollEvent, NativeSyntheticEvent, View } from "react-native";
import { MessageBubble } from "./MessageBubble";
import { StreamingIndicator } from "./StreamingIndicator";
import { ErrorBoundary } from "../ErrorBoundary";
import { Text } from "../Text";
import { usePraxisTheme } from "../../../contexts/PraxisThemeContext";
import type { Message } from "../../../lib/conduit/types";
import type { EmployeeId } from "../../../lib/conduit/employees";

const OLDER_LOAD_THRESHOLD_PX = 120;

export interface MessageListProps {
  messages: Message[];
  streaming?: { content: string; employee?: EmployeeId | "team" | null } | null;
  isWaiting?: boolean;
  stage?: { label: string; employee?: string | null } | null;
  failedIds?: Set<string>;
  onRetry?: (messageId: string) => void;
  onLoadOlder?: () => void;
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
  failedIds,
  onRetry,
  onLoadOlder,
  loadingOlder,
}: MessageListProps) {
  const t = usePraxisTheme();
  const listRef = useRef<FlatList<Message>>(null);
  const scrollYRef = useRef(0);

  useEffect(() => {
    if (listRef.current && messages.length > 0) {
      listRef.current.scrollToEnd({ animated: true });
    }
  }, [messages.length, streaming?.content, isWaiting]);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollYRef.current = e.nativeEvent.contentOffset.y;
    if (
      e.nativeEvent.contentOffset.y < OLDER_LOAD_THRESHOLD_PX &&
      !loadingOlder &&
      onLoadOlder
    ) {
      onLoadOlder();
    }
  };

  return (
    <FlatList
      ref={listRef}
      data={messages}
      keyExtractor={(m, i) =>
        typeof m?.id === "string" || typeof m?.id === "number"
          ? String(m.id)
          : `msg-${i}`
      }
      renderItem={({ item }) => (
        <ErrorBoundary fallback={() => <MessageRowFallback />}>
          <MessageBubble
            role={item.role}
            content={item.content}
            employee={item.employee}
            failed={failedIds?.has(item.id)}
            onRetry={onRetry ? () => onRetry(item.id) : undefined}
          />
        </ErrorBoundary>
      )}
      contentContainerStyle={{ paddingVertical: 8 }}
      onScroll={handleScroll}
      scrollEventThrottle={150}
      onContentSizeChange={() => {
        if (messages.length > 0) {
          listRef.current?.scrollToEnd({ animated: true });
        }
      }}
      ListHeaderComponent={
        loadingOlder ? (
          <View style={{ paddingVertical: 12, alignItems: "center" }}>
            <ActivityIndicator size="small" color={t.colors.indigo500} />
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
