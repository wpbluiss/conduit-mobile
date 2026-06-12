import React, { useEffect, useState } from "react";
import { View, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, G } from "react-native-svg";
import { useRouter } from "expo-router";
import { ArrowLeft } from "phosphor-react-native";
import { usePraxisTheme } from "../../../contexts/PraxisThemeContext";
import { Text } from "../../../components/praxis";
import { getOrCreateAccount } from "../../../lib/conduit/account";
import type { ConduitAccount } from "../../../lib/conduit/types";

const DONUT_SIZE = 140;
const DONUT_STROKE = 14;
const DONUT_RADIUS = (DONUT_SIZE - DONUT_STROKE) / 2;
const DONUT_CIRCUMFERENCE = 2 * Math.PI * DONUT_RADIUS;

function UsageDonut({ used, cap }: { used: number; cap: number }) {
  const t = usePraxisTheme();
  const fraction = Math.min(used / Math.max(cap, 1), 1);
  const filledLength = DONUT_CIRCUMFERENCE * fraction;
  const cx = DONUT_SIZE / 2;
  const cy = DONUT_SIZE / 2;

  return (
    <Svg width={DONUT_SIZE} height={DONUT_SIZE}>
      {/* Track */}
      <Circle
        cx={cx}
        cy={cy}
        r={DONUT_RADIUS}
        stroke={t.colors.bgElevated}
        strokeWidth={DONUT_STROKE}
        fill="none"
      />
      {/* Progress — rotate so arc starts at top */}
      <G rotation="-90" origin={`${cx}, ${cy}`}>
        <Circle
          cx={cx}
          cy={cy}
          r={DONUT_RADIUS}
          stroke={t.colors.indigo500}
          strokeWidth={DONUT_STROKE}
          strokeDasharray={`${filledLength} ${DONUT_CIRCUMFERENCE - filledLength}`}
          strokeLinecap="round"
          fill="none"
        />
      </G>
    </Svg>
  );
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}k`;
  return String(n);
}

function CapBar({ used, cap }: { used: number; cap: number }) {
  const t = usePraxisTheme();
  const fraction = Math.min(used / Math.max(cap, 1), 1);
  const pct = Math.round(fraction * 100);
  const overLimit = fraction >= 1;

  return (
    <View style={{ gap: 8 }}>
      <View
        style={{
          height: 8,
          borderRadius: t.radii.full,
          backgroundColor: t.colors.bgElevated,
          overflow: "hidden",
        }}
      >
        <View
          style={{
            height: "100%",
            width: `${pct}%`,
            borderRadius: t.radii.full,
            backgroundColor: overLimit ? t.colors.danger : t.colors.indigo500,
          }}
        />
      </View>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text variant="bodySm" tone="secondary">
          {formatTokens(used)} used
        </Text>
        <Text variant="bodySm" tone={overLimit ? "danger" : "tertiary"}>
          {overLimit ? "Limit reached" : `${formatTokens(cap - used)} remaining`}
        </Text>
      </View>
    </View>
  );
}

export default function UsageScreen() {
  const t = usePraxisTheme();
  const router = useRouter();
  const [account, setAccount] = useState<ConduitAccount | null>(null);

  useEffect(() => {
    getOrCreateAccount().then(setAccount);
  }, []);

  const used = account?.monthly_tokens_used ?? 0;
  const cap = account?.monthly_token_cap ?? null;
  const bonus = account?.bonus_tokens ?? 0;
  const tier = (account?.tier_id ?? "free").toUpperCase();

  const hasUsageCap = cap !== null && cap > 0;
  const pct = hasUsageCap ? Math.min(Math.round((used / cap) * 100), 100) : 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.bgCanvas }} edges={["top"]}>
      <View style={{ paddingHorizontal: 8, paddingVertical: 8 }}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          style={{ width: 36, height: 36, alignItems: "center", justifyContent: "center" }}
        >
          <ArrowLeft size={20} color={t.colors.inkPrimary} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: t.layout.screenPaddingX,
          paddingBottom: 40,
          gap: 20,
        }}
      >
        <View style={{ marginBottom: 4 }}>
          <Text variant="caption" tone="indigo" weight="semibold">
            SETTINGS
          </Text>
          <Text variant="displayLg" family="display" weight="semibold">
            Usage
          </Text>
        </View>

        {/* Donut + summary card */}
        <View
          style={{
            padding: 20,
            borderRadius: t.radii.lg,
            backgroundColor: t.colors.bgSurface,
            borderWidth: 1,
            borderColor: t.colors.borderSubtle,
            alignItems: "center",
            gap: 16,
          }}
        >
          <View style={{ position: "relative", alignItems: "center", justifyContent: "center" }}>
            {hasUsageCap ? (
              <>
                <UsageDonut used={used} cap={cap} />
                <View
                  style={{
                    position: "absolute",
                    alignItems: "center",
                  }}
                >
                  <Text variant="displayMd" family="display" weight="semibold">
                    {pct}%
                  </Text>
                  <Text variant="caption" tone="tertiary">
                    used
                  </Text>
                </View>
              </>
            ) : (
              <View
                style={{
                  width: DONUT_SIZE,
                  height: DONUT_SIZE,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text variant="displayMd" family="display" weight="semibold">
                  ∞
                </Text>
                <Text variant="caption" tone="tertiary">
                  unlimited
                </Text>
              </View>
            )}
          </View>

          {hasUsageCap && <CapBar used={used} cap={cap} />}

          <View
            style={{
              flexDirection: "row",
              gap: 12,
              width: "100%",
            }}
          >
            <StatBox label="Tier" value={tier} />
            <StatBox label="Used" value={formatTokens(used)} />
            {hasUsageCap ? (
              <StatBox label="Monthly cap" value={formatTokens(cap)} />
            ) : (
              <StatBox label="Monthly cap" value="Unlimited" />
            )}
          </View>
        </View>

        {bonus > 0 && (
          <View
            style={{
              padding: 14,
              borderRadius: t.radii.md,
              backgroundColor: t.colors.indigoSoft,
              borderWidth: 1,
              borderColor: t.colors.indigo200,
            }}
          >
            <Text variant="bodySm" weight="medium" tone="indigo">
              +{formatTokens(bonus)} bonus tokens available
            </Text>
          </View>
        )}

        <View
          style={{
            padding: 14,
            borderRadius: t.radii.md,
            backgroundColor: t.colors.bgSurface,
            borderWidth: 1,
            borderColor: t.colors.borderSubtle,
            gap: 6,
          }}
        >
          <Text variant="caption" tone="tertiary" weight="semibold">
            BILLING CYCLE
          </Text>
          <Text variant="body" tone="secondary">
            {account?.billing_cycle_start
              ? `Resets on the ${new Date(account.billing_cycle_start).getDate()}th of each month.`
              : "Usage resets at the start of each billing cycle."}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  const t = usePraxisTheme();
  return (
    <View
      style={{
        flex: 1,
        padding: 12,
        borderRadius: t.radii.md,
        backgroundColor: t.colors.bgElevated,
        gap: 4,
      }}
    >
      <Text variant="caption" tone="tertiary">
        {label.toUpperCase()}
      </Text>
      <Text variant="bodySm" weight="semibold" numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}
