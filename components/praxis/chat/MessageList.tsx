import React, { useEffect, useRef } from "react";
import { FlatList, View } from "react-native";
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
  /** Dept/employee accent color for bubble theming. */
  accentColor?: string;
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

/** Returns a key that identifies the "sender" for consecutive-grouping purposes. */
function senderKey(msg: Message): string {
  return msg.role === "user" ? "user" : `assistant:${msg.employee ?? "atlas"}`;
}

export function MessageList({ messages, streaming, isWaiting, stage, accentColor }: MessageListProps) {
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
      renderItem={({ item, index }) => {
        const prevMsg = index > 0 ? messages[index - 1] : null;
        const showHeader = !prevMsg || senderKey(prevMsg) !== senderKey(item);
        return (
          <ErrorBoundary fallback={() => <MessageRowFallback />}>
            <MessageBubble
              role={item.role}
              content={item.content}
              employee={item.employee}
              accentColor={accentColor}
              showHeader={showHeader}
            />
          </ErrorBoundary>
        );
      }}
      contentContainerStyle={{ paddingVertical: 8 }}
      onContentSizeChange={() => {
        if (messages.length > 0) {
          listRef.current?.scrollToEnd({ animated: true });
        }
      }}
      ListFooterComponent={
        streaming || isWaiting ? (
          <View>
            {streaming?.content ? (
              <MessageBubble
                role="assistant"
                content={streaming.content}
                employee={streaming.employee ?? "atlas"}
                accentColor={accentColor}
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
