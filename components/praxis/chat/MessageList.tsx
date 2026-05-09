import React, { useEffect, useRef } from "react";
import { FlatList, View } from "react-native";
import { MessageBubble } from "./MessageBubble";
import { StreamingIndicator } from "./StreamingIndicator";
import type { Message } from "../../../lib/conduit/types";
import type { EmployeeId } from "../../../lib/conduit/employees";

export interface MessageListProps {
  messages: Message[];
  streaming?: { content: string; employee?: EmployeeId | "team" | null } | null;
  isWaiting?: boolean;
}

export function MessageList({ messages, streaming, isWaiting }: MessageListProps) {
  const listRef = useRef<FlatList<Message>>(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollToEnd({ animated: true });
    }
  }, [messages.length, streaming?.content, isWaiting]);

  return (
    <FlatList
      ref={listRef}
      data={messages}
      keyExtractor={(m) => m.id}
      renderItem={({ item }) => (
        <MessageBubble
          role={item.role}
          content={item.content}
          employee={item.employee}
        />
      )}
      contentContainerStyle={{ paddingVertical: 8 }}
      onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
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
            {isWaiting && !streaming?.content ? <StreamingIndicator /> : null}
          </View>
        ) : null
      }
    />
  );
}
