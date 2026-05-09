import React from "react";
import { View } from "react-native";
import { usePraxisTheme } from "../../../contexts/PraxisThemeContext";
import { Text } from "../Text";
import type { ConduitAccount } from "../../../lib/conduit/types";

export interface UsageStatCardProps {
  account: ConduitAccount | null;
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "k";
  return String(n);
}

export function UsageStatCard({ account }: UsageStatCardProps) {
  const t = usePraxisTheme();

  const used = account?.tokens_used ?? 0;
  const limit = account?.tokens_limit ?? null;
  const percent = limit ? Math.min(100, Math.round((used / limit) * 100)) : null;
  const tier = account?.tier_id ?? "free";

  return (
    <View
      style={{
        padding: 16,
        borderRadius: t.radii.lg,
        backgroundColor: t.colors.bgSurface,
        borderWidth: 1,
        borderColor: t.colors.borderSubtle,
        gap: 12,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Text variant="caption" tone="tertiary" weight="semibold">
          USAGE
        </Text>
        <View
          style={{
            paddingHorizontal: 10,
            paddingVertical: 3,
            borderRadius: t.radii.full,
            backgroundColor: t.colors.indigoSoft,
          }}
        >
          <Text
            variant="caption"
            weight="semibold"
            style={{ color: t.colors.indigo500, letterSpacing: 0.6 }}
          >
            {tier.toUpperCase()}
          </Text>
        </View>
      </View>

      <View>
        <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6 }}>
          <Text variant="displayLg" family="display" weight="semibold">
            {formatNumber(used)}
          </Text>
          {limit ? (
            <Text variant="body" tone="tertiary">
              / {formatNumber(limit)} tokens
            </Text>
          ) : (
            <Text variant="body" tone="tertiary">
              tokens used
            </Text>
          )}
        </View>
      </View>

      {percent !== null ? (
        <View
          style={{
            height: 6,
            borderRadius: 3,
            backgroundColor: t.colors.bgElevated,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              width: `${percent}%`,
              height: "100%",
              backgroundColor: percent > 85 ? t.colors.ember : t.colors.indigo500,
              borderRadius: 3,
            }}
          />
        </View>
      ) : null}
    </View>
  );
}
