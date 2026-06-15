import React, { useState } from "react";
import { View, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Brain, CaretDown, CaretUp, ArrowSquareOut } from "phosphor-react-native";
import { usePraxisTheme } from "../../../contexts/PraxisThemeContext";
import { Text } from "../Text";
import type { MemoryRecord } from "../../../lib/conduit/types";

// Tier memory-item caps mirror the web tiers.ts source of truth.
const TIER_MEMORY_CAPS: Record<string, number> = {
  free: 25,
  pro: 200,
  enterprise: 1000,
};

function getMemoryCap(tierId: string | null): number {
  if (!tierId) return TIER_MEMORY_CAPS.free;
  return TIER_MEMORY_CAPS[tierId.toLowerCase()] ?? TIER_MEMORY_CAPS.free;
}

const KIND_LABELS: Partial<Record<string, string>> = {
  fact: "FACT",
  preference: "PREF",
  context: "CTX",
  note: "NOTE",
};

export interface MemoryCardProps {
  memories: MemoryRecord[];
  totalCount: number;
  tierId: string | null;
}

export function MemoryCard({ memories, totalCount, tierId }: MemoryCardProps) {
  const t = usePraxisTheme();
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);

  if (totalCount === 0) return null;

  const cap = getMemoryCap(tierId);
  const preview = memories.slice(0, 5);

  return (
    <View
      style={{
        marginHorizontal: 12,
        marginTop: 8,
        marginBottom: 4,
        borderRadius: t.radii.md,
        backgroundColor: t.colors.bgSurface,
        borderWidth: 1,
        borderColor: t.colors.borderSubtle,
        overflow: "hidden",
      }}
    >
      <Pressable
        onPress={() => setExpanded((v) => !v)}
        style={({ pressed }) => ({
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          paddingHorizontal: 14,
          paddingVertical: 10,
          backgroundColor: pressed ? t.colors.bgElevated : "transparent",
        })}
      >
        <Brain size={13} color={t.colors.indigo500} weight="fill" />
        <Text
          variant="caption"
          weight="semibold"
          tone="indigo"
          style={{ flex: 1 }}
        >
          {`WHAT ATLAS KNOWS · ${totalCount}/${cap}`}
        </Text>
        {expanded ? (
          <CaretUp size={11} color={t.colors.inkTertiary} weight="bold" />
        ) : (
          <CaretDown size={11} color={t.colors.inkTertiary} weight="bold" />
        )}
      </Pressable>

      {expanded ? (
        <View
          style={{
            borderTopWidth: 0.5,
            borderTopColor: t.colors.borderSubtle,
            paddingHorizontal: 14,
            paddingTop: 8,
            paddingBottom: 10,
            gap: 8,
          }}
        >
          {preview.map((m) => (
            <View
              key={m.id}
              style={{ flexDirection: "row", gap: 8, alignItems: "flex-start" }}
            >
              <View
                style={{
                  paddingHorizontal: 5,
                  paddingVertical: 2,
                  borderRadius: t.radii.sm,
                  backgroundColor: t.colors.indigoSoft,
                  alignSelf: "flex-start",
                  marginTop: 1,
                }}
              >
                <Text
                  variant="caption"
                  tone="indigo"
                  weight="semibold"
                  style={{ fontSize: 9, lineHeight: 13 }}
                >
                  {KIND_LABELS[m.kind] ?? "FACT"}
                </Text>
              </View>
              <Text variant="bodySm" tone="secondary" style={{ flex: 1 }}>
                {m.content}
              </Text>
            </View>
          ))}

          {totalCount > 5 ? (
            <Pressable
              onPress={() =>
                router.push("/(app)/settings/memory" as never)
              }
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                marginTop: 2,
                opacity: pressed ? 0.6 : 1,
              })}
            >
              <Text variant="caption" tone="indigo" weight="semibold">
                {`View all ${totalCount} memories`}
              </Text>
              <ArrowSquareOut size={11} color={t.colors.indigo500} weight="bold" />
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
