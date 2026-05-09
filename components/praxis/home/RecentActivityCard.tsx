import React from "react";
import { View, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { ChatCircleText, ArrowRight } from "phosphor-react-native";
import { formatDistanceToNow } from "date-fns";
import { usePraxisTheme } from "../../../contexts/PraxisThemeContext";
import { Text } from "../Text";
import type { Conversation } from "../../../lib/conduit/types";

export interface RecentActivityCardProps {
  conversations: Conversation[];
}

export function RecentActivityCard({ conversations }: RecentActivityCardProps) {
  const t = usePraxisTheme();
  const router = useRouter();

  if (conversations.length === 0) {
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
        <Text variant="caption" tone="tertiary" weight="semibold">
          RECENT
        </Text>
        <Text variant="body" tone="secondary" style={{ marginTop: 6 }}>
          Your first thread will appear here.
        </Text>
      </View>
    );
  }

  return (
    <View
      style={{
        borderRadius: t.radii.lg,
        backgroundColor: t.colors.bgSurface,
        borderWidth: 1,
        borderColor: t.colors.borderSubtle,
        overflow: "hidden",
      }}
    >
      <View style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6 }}>
        <Text variant="caption" tone="tertiary" weight="semibold">
          RECENT CONVERSATIONS
        </Text>
      </View>
      {conversations.slice(0, 3).map((c, i) => (
        <Pressable
          key={c.id}
          onPress={() => router.push(`/(app)/chat/${c.id}`)}
          style={({ pressed }) => ({
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderTopWidth: i === 0 ? 0 : 0.5,
            borderTopColor: t.colors.borderSubtle,
            backgroundColor: pressed ? t.colors.bgElevated : "transparent",
          })}
        >
          <View
            style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              backgroundColor: t.colors.indigoSoft,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ChatCircleText size={14} color={t.colors.indigo500} />
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="body" weight="medium" numberOfLines={1}>
              {c.title ?? "Untitled"}
            </Text>
            <Text variant="bodySm" tone="tertiary" style={{ marginTop: 2 }}>
              {formatDistanceToNow(new Date(c.updated_at), { addSuffix: true })}
            </Text>
          </View>
          <ArrowRight size={14} color={t.colors.inkTertiary} />
        </Pressable>
      ))}
    </View>
  );
}
