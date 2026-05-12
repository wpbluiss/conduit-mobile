// Shared empty-state card for the per-employee workspace scaffolds.
//
// Each surface above the chat composer renders one of these cards. The
// real data (briefs, builds, pipeline rows, etc.) lights up as the
// corresponding workers come online; until then the empty state explains
// the intent so the UX demonstrates the surface even with no data behind it.

import React from "react";
import { View } from "react-native";
import { usePraxisTheme } from "../../../contexts/PraxisThemeContext";
import { Text } from "../Text";

export interface WorkspaceCardProps {
  kicker: string;
  title: string;
  body: string;
  accent: string;
  accentSoft: string;
  rightSlot?: React.ReactNode;
  children?: React.ReactNode;
}

export function WorkspaceCard({
  kicker,
  title,
  body,
  accent,
  accentSoft,
  rightSlot,
  children,
}: WorkspaceCardProps) {
  const t = usePraxisTheme();
  return (
    <View
      style={{
        borderRadius: t.radii.lg,
        borderWidth: 0.5,
        borderColor: t.colors.borderSubtle,
        backgroundColor: t.colors.bgSurface,
        overflow: "hidden",
      }}
    >
      <View
        style={{
          paddingHorizontal: 16,
          paddingTop: 14,
          paddingBottom: 10,
          backgroundColor: accentSoft,
          borderBottomWidth: 0.5,
          borderBottomColor: t.colors.borderSubtle,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <View style={{ flex: 1 }}>
          <Text
            variant="caption"
            weight="semibold"
            style={{ color: accent, letterSpacing: 0.88, marginBottom: 2 }}
          >
            {kicker}
          </Text>
          <Text variant="body" weight="semibold">
            {title}
          </Text>
        </View>
        {rightSlot}
      </View>
      <View style={{ paddingHorizontal: 16, paddingVertical: 14 }}>
        <Text variant="bodySm" tone="secondary" style={{ lineHeight: 20 }}>
          {body}
        </Text>
        {children ? <View style={{ marginTop: 12 }}>{children}</View> : null}
      </View>
    </View>
  );
}
