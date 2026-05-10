import React from "react";
import { View, Pressable } from "react-native";
import { ChatCircle } from "phosphor-react-native";
import { usePraxisTheme } from "../../../contexts/PraxisThemeContext";
import { Text } from "../Text";

const PROMPTS = [
  "Pick up where we left off.",
  "What's the next move?",
  "Brief me on this thread.",
];

export interface ChatEmptyStateProps {
  title: string;
  onStart: (text: string) => void;
}

/**
 * Rendered when an existing conversation has zero messages — older threads
 * sometimes lost their messages during migration; this is a calmer
 * alternative to crashing or showing a blank screen.
 */
export function ChatEmptyState({ title, onStart }: ChatEmptyStateProps) {
  const t = usePraxisTheme();
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 32,
      }}
    >
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: t.colors.indigoSoft,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 16,
        }}
      >
        <ChatCircle size={28} color={t.colors.indigo500} weight="regular" />
      </View>
      <Text
        variant="caption"
        tone="indigo"
        weight="semibold"
        style={{ marginBottom: 8 }}
      >
        EMPTY THREAD
      </Text>
      <Text
        variant="displayMd"
        family="display"
        weight="semibold"
        align="center"
        numberOfLines={2}
        style={{ marginBottom: 6 }}
      >
        {title}
      </Text>
      <Text
        variant="body"
        tone="secondary"
        align="center"
        style={{ marginBottom: 20, maxWidth: 320 }}
      >
        No messages yet. Send one to bring this thread back to life.
      </Text>
      <View style={{ gap: 8, alignSelf: "stretch" }}>
        {PROMPTS.map((p) => (
          <Pressable
            key={p}
            onPress={() => onStart(p)}
            style={({ pressed }) => ({
              paddingHorizontal: 14,
              paddingVertical: 12,
              borderRadius: t.radii.md,
              backgroundColor: pressed ? t.colors.bgElevated : t.colors.bgSurface,
              borderWidth: 1,
              borderColor: t.colors.borderSubtle,
            })}
          >
            <Text variant="bodySm" tone="primary">
              {p}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
