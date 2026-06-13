import React, { useEffect, useState } from "react";
import { View, ScrollView, Pressable, Linking, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, Lightning, Coin } from "phosphor-react-native";
import { usePraxisTheme } from "../../../contexts/PraxisThemeContext";
import { Text, Button } from "../../../components/praxis";
import { getOrCreateAccount } from "../../../lib/conduit/account";
import { trackCheckoutClicked } from "../../../lib/analytics";
import { API_URL } from "../../../lib/conduit/api";
import type { ConduitAccount } from "../../../lib/conduit/types";

const TOPUPS: Array<{ id: string; label: string; tokens: string; price: string }> = [
  { id: "500k", label: "Starter", tokens: "500k tokens", price: "$10" },
  { id: "1500k", label: "Growth", tokens: "1.5M tokens", price: "$25" },
  { id: "3500k", label: "Scale", tokens: "3.5M tokens", price: "$50" },
];

const TIER_LABELS: Record<string, string> = {
  free: "Free",
  pro: "Pro",
  enterprise: "Enterprise",
};

function nextTier(current: string | null): string | null {
  if (!current || current === "free") return "pro";
  if (current === "pro") return "enterprise";
  return null;
}

function tierBadgeColor(tier: string | null, colors: ReturnType<typeof usePraxisTheme>["colors"]) {
  if (tier === "enterprise") return "#B7791F";
  if (tier === "pro") return colors.indigo500;
  return colors.inkTertiary;
}

function formatTokens(used: number | null, cap: number | null): string {
  if (cap == null) return "—";
  const pct = used != null ? Math.min(100, Math.round((used / cap) * 100)) : 0;
  const usedM = used != null ? (used / 1_000_000).toFixed(1) : "0";
  const capM = (cap / 1_000_000).toFixed(1);
  return `${usedM}M / ${capM}M (${pct}%)`;
}

async function openBillingUrl(path: string) {
  const url = `${API_URL}${path}`;
  const supported = await Linking.canOpenURL(url);
  if (supported) {
    await Linking.openURL(url);
  } else {
    Alert.alert("Cannot open browser", "Visit conduitai.io to manage your plan.");
  }
}

export default function BillingScreen() {
  const t = usePraxisTheme();
  const router = useRouter();
  const [account, setAccount] = useState<ConduitAccount | null>(null);

  useEffect(() => {
    getOrCreateAccount().then(setAccount);
  }, []);

  const tier = account?.tier_id ?? "free";
  const upgradeToTier = nextTier(tier);

  const handleUpgrade = async () => {
    if (!upgradeToTier) return;
    trackCheckoutClicked({ tier_id: upgradeToTier });
    await openBillingUrl("/app/settings/billing");
  };

  const handleTopup = async (topupId: string) => {
    trackCheckoutClicked({ topup_id: topupId });
    await openBillingUrl("/app/settings/billing");
  };

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
          gap: 24,
        }}
      >
        <View>
          <Text variant="caption" tone="indigo" weight="semibold">
            BILLING
          </Text>
          <Text variant="displayLg" family="display" weight="semibold">
            Your plan.
          </Text>
        </View>

        {/* Current plan card */}
        <View
          style={{
            padding: 16,
            borderRadius: t.radii.lg,
            backgroundColor: t.colors.bgSurface,
            borderWidth: 1,
            borderColor: t.colors.borderSubtle,
            gap: 14,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text variant="caption" tone="tertiary" weight="semibold">
              CURRENT PLAN
            </Text>
            <View
              style={{
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 20,
                backgroundColor: tierBadgeColor(tier, t.colors) + "22",
              }}
            >
              <Text
                variant="caption"
                weight="semibold"
                style={{ color: tierBadgeColor(tier, t.colors) }}
              >
                {(TIER_LABELS[tier] ?? tier).toUpperCase()}
              </Text>
            </View>
          </View>

          <View>
            <Text variant="caption" tone="tertiary" weight="semibold" style={{ marginBottom: 6 }}>
              TOKEN USAGE THIS CYCLE
            </Text>
            <Text variant="body">
              {formatTokens(account?.monthly_tokens_used ?? null, account?.monthly_token_cap ?? null)}
            </Text>
          </View>

          {account?.bonus_tokens != null && account.bonus_tokens > 0 ? (
            <View>
              <Text variant="caption" tone="tertiary" weight="semibold" style={{ marginBottom: 4 }}>
                BONUS TOKENS
              </Text>
              <Text variant="body">
                {(account.bonus_tokens / 1_000_000).toFixed(1)}M remaining
              </Text>
            </View>
          ) : null}
        </View>

        {/* Upgrade section */}
        {upgradeToTier ? (
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
            <Text variant="caption" tone="tertiary" weight="semibold">
              UPGRADE PLAN
            </Text>
            <Text variant="bodySm" tone="secondary">
              Unlock more employees, higher token caps, and priority support.
            </Text>
            <Button
              label={`Upgrade to ${TIER_LABELS[upgradeToTier] ?? upgradeToTier}`}
              variant="primary"
              size="lg"
              fullWidth
              iconLeft={<Lightning size={16} color="#FFFFFF" weight="fill" />}
              onPress={handleUpgrade}
            />
          </View>
        ) : null}

        {/* Top-up section */}
        <View
          style={{
            borderRadius: t.radii.lg,
            backgroundColor: t.colors.bgSurface,
            borderWidth: 1,
            borderColor: t.colors.borderSubtle,
            overflow: "hidden",
          }}
        >
          <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 }}>
            <Text variant="caption" tone="tertiary" weight="semibold">
              TOKEN TOP-UPS
            </Text>
            <Text variant="bodySm" tone="secondary" style={{ marginTop: 4 }}>
              Buy extra tokens that roll over until used.
            </Text>
          </View>

          {TOPUPS.map((topup, i) => (
            <Pressable
              key={topup.id}
              onPress={() => handleTopup(topup.id)}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingHorizontal: 16,
                paddingVertical: 14,
                borderTopWidth: i === 0 ? 0.5 : 0.5,
                borderTopColor: t.colors.borderSubtle,
                backgroundColor: pressed ? t.colors.bgElevated : "transparent",
              })}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <Coin size={18} color={t.colors.indigo500} />
                <View>
                  <Text variant="body" weight="medium">
                    {topup.label}
                  </Text>
                  <Text variant="bodySm" tone="tertiary">
                    {topup.tokens}
                  </Text>
                </View>
              </View>
              <Text variant="body" weight="semibold" style={{ color: t.colors.indigo500 }}>
                {topup.price}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text variant="caption" tone="tertiary" align="center" style={{ marginTop: 4 }}>
          Billing is managed on the web. Tapping an option opens conduitai.io in your browser.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
