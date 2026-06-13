import React from "react";
import { View } from "react-native";
import { usePraxisTheme } from "../../contexts/PraxisThemeContext";
import { Text } from "./Text";
import { normaliseTier, type TierId } from "../../lib/conduit/billing";

interface TierConfig {
  label: string;
  bg: (t: ReturnType<typeof usePraxisTheme>) => string;
  ink: (t: ReturnType<typeof usePraxisTheme>) => string;
}

const TIER_CONFIG: Record<TierId, TierConfig> = {
  free: {
    label: "FREE",
    bg: (t) => t.colors.bgElevated,
    ink: (t) => t.colors.inkTertiary,
  },
  pro: {
    label: "PRO",
    bg: (t) => t.colors.indigoSoft,
    ink: (t) => t.colors.indigo500,
  },
  enterprise: {
    label: "ENTERPRISE",
    bg: (t) => t.colors.indigoSoft,
    ink: (t) => t.colors.indigo700,
  },
};

interface TierBadgeProps {
  tierId?: string | null;
}

export function TierBadge({ tierId }: TierBadgeProps) {
  const t = usePraxisTheme();
  const tier = normaliseTier(tierId);
  const cfg = TIER_CONFIG[tier];

  return (
    <View
      style={{
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: t.radii.sm,
        backgroundColor: cfg.bg(t),
        alignSelf: "flex-start",
      }}
    >
      <Text
        variant="caption"
        weight="semibold"
        style={{ color: cfg.ink(t), letterSpacing: 1.2 }}
      >
        {cfg.label}
      </Text>
    </View>
  );
}
