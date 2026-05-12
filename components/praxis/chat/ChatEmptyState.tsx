import React from "react";
import { View, Pressable } from "react-native";
import Svg, { Path, Circle } from "react-native-svg";
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
      <ThreadGlyph color={t.colors.violet700} />
      <Text
        variant="caption"
        tone="indigo"
        weight="semibold"
        style={{ marginTop: 18, marginBottom: 8 }}
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

/**
 * Abstract message-thread illustration: three lines flowing into a single
 * point — reads as the start of a conversation without committing to a
 * generic chat-bubble icon. Brand-purple stroke.
 */
function ThreadGlyph({ color }: { color: string }) {
  return (
    <Svg width={72} height={48} viewBox="0 0 72 48" fill="none">
      <Path
        d="M6 12 C 26 12, 38 18, 52 24"
        stroke={color}
        strokeWidth={1.75}
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M6 24 L 52 24"
        stroke={color}
        strokeWidth={1.75}
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M6 36 C 26 36, 38 30, 52 24"
        stroke={color}
        strokeWidth={1.75}
        strokeLinecap="round"
        fill="none"
      />
      <Circle cx={58} cy={24} r={4} fill={color} />
    </Svg>
  );
}
