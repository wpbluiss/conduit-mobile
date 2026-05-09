import React from "react";
import { View } from "react-native";
import { Brain } from "phosphor-react-native";
import { usePraxisTheme } from "../../../contexts/PraxisThemeContext";
import { Text } from "../Text";
import type { MemoryRecord } from "../../../lib/conduit/types";

export interface MemorySnippetCardProps {
  memories: MemoryRecord[];
}

export function MemorySnippetCard({ memories }: MemorySnippetCardProps) {
  const t = usePraxisTheme();

  return (
    <View
      style={{
        padding: 16,
        borderRadius: t.radii.lg,
        backgroundColor: t.colors.bgSurface,
        borderWidth: 1,
        borderColor: t.colors.borderSubtle,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <Brain size={16} color={t.colors.indigo500} weight="fill" />
        <Text variant="caption" tone="tertiary" weight="semibold">
          WHAT ATLAS REMEMBERS
        </Text>
      </View>
      {memories.length === 0 ? (
        <Text variant="body" tone="secondary">
          Memory builds up as you talk. Pin facts you want kept.
        </Text>
      ) : (
        <View style={{ gap: 10 }}>
          {memories.slice(0, 3).map((m) => (
            <View key={m.id}>
              <Text variant="bodySm" tone="tertiary" weight="medium" style={{ marginBottom: 2 }}>
                {(m.kind ?? "fact").toUpperCase()}
              </Text>
              <Text variant="body" numberOfLines={3}>
                {m.content}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
