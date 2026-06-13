import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { usePraxisTheme } from "../../../contexts/PraxisThemeContext";
import { Text } from "../Text";
import { getOrCreateAccount } from "../../../lib/conduit/account";
import type { ConduitAccount } from "../../../lib/conduit/types";

function formatTokenCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}k`;
  return String(n);
}

/** Bar color based on usage fraction: green → orange → red. */
function barColor(fraction: number): string {
  if (fraction >= 0.9) return "#C8412B"; // danger red
  if (fraction >= 0.7) return "#D67817"; // warning orange
  return "#0E8A55"; // healthy green
}

export function UsageCapBar() {
  const t = usePraxisTheme();
  const [account, setAccount] = useState<ConduitAccount | null>(null);

  useEffect(() => {
    let alive = true;
    getOrCreateAccount().then((a) => {
      if (alive) setAccount(a);
    });
    return () => {
      alive = false;
    };
  }, []);

  if (!account) return null;

  const cap = account.monthly_token_cap;
  const used = account.monthly_tokens_used ?? 0;
  // No cap defined → nothing to show
  if (!cap || cap <= 0) return null;

  const totalAvailable = cap + (account.bonus_tokens ?? 0);
  const fraction = Math.min(used / totalAvailable, 1);
  const color = barColor(fraction);
  const pct = Math.round(fraction * 100);

  return (
    <View
      style={{
        marginHorizontal: 12,
        marginBottom: 4,
        gap: 4,
      }}
    >
      <View
        style={{
          height: 3,
          borderRadius: 2,
          backgroundColor: t.colors.borderSubtle,
          overflow: "hidden",
        }}
      >
        <View
          style={{
            width: `${pct}%`,
            height: "100%",
            backgroundColor: color,
            borderRadius: 2,
          }}
        />
      </View>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text variant="caption" tone="tertiary" style={{ fontSize: 10 }}>
          {formatTokenCount(used)} / {formatTokenCount(totalAvailable)} tokens used
        </Text>
        <Text
          variant="caption"
          weight="semibold"
          style={{ fontSize: 10, color: pct >= 90 ? color : t.colors.inkTertiary }}
        >
          {pct}%
        </Text>
      </View>
    </View>
  );
}
