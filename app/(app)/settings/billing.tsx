import React, { useEffect, useState } from "react";
import {
  View,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, Lightning, ArrowSquareOut } from "phosphor-react-native";
import { usePraxisTheme } from "../../../contexts/PraxisThemeContext";
import { Text, Button } from "../../../components/praxis";
import { TierBadge } from "../../../components/praxis/TierBadge";
import { getOrCreateAccount } from "../../../lib/conduit/account";
import {
  TOP_UP_OPTIONS,
  openTopUp,
  openBillingPortal,
  isOverTokenCeiling,
  type TopUpPackage,
} from "../../../lib/conduit/billing";
import type { ConduitAccount } from "../../../lib/conduit/types";

export default function BillingSettingsScreen() {
  const t = usePraxisTheme();
  const router = useRouter();

  const [account, setAccount] = useState<ConduitAccount | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    getOrCreateAccount().then(setAccount);
  }, []);

  const handleTopUp = async (pkg: TopUpPackage) => {
    setLoading(pkg);
    const result = await openTopUp(pkg);
    setLoading(null);
    if (!result.ok) {
      Alert.alert("Checkout unavailable", result.message);
    }
  };

  const handlePortal = async () => {
    setLoading("portal");
    const result = await openBillingPortal();
    setLoading(null);
    if (!result.ok) {
      Alert.alert("Billing portal unavailable", result.message);
    }
  };

  const used = account?.monthly_tokens_used ?? null;
  const cap = account?.monthly_token_cap ?? null;
  const bonus = account?.bonus_tokens ?? null;
  const overCeiling = isOverTokenCeiling(used, cap);

  const formatTokens = (n: number | null) =>
    n == null ? "—" : n >= 1_000_000
      ? `${(n / 1_000_000).toFixed(1)}M`
      : `${(n / 1_000).toFixed(0)}k`;

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: t.colors.bgCanvas }}
      edges={["top"]}
    >
      <View style={{ paddingHorizontal: 8, paddingVertical: 8 }}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          style={{
            width: 36,
            height: 36,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ArrowLeft size={20} color={t.colors.inkPrimary} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: t.layout.screenPaddingX,
          paddingBottom: 32,
          gap: 20,
        }}
      >
        {/* Title */}
        <View style={{ marginBottom: 4 }}>
          <Text variant="caption" tone="indigo" weight="semibold">
            BILLING
          </Text>
          <Text variant="displayLg" family="display" weight="semibold">
            Your plan
          </Text>
        </View>

        {/* Current plan card */}
        <View
          style={{
            padding: 16,
            borderRadius: t.radii.lg,
            backgroundColor: t.colors.bgSurface,
            borderWidth: 1,
            borderColor: overCeiling ? t.colors.warning : t.colors.borderSubtle,
            gap: 12,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Text variant="bodySm" tone="tertiary" weight="semibold">
              CURRENT PLAN
            </Text>
            <TierBadge tierId={account?.tier_id} />
          </View>

          {/* Token usage */}
          <View style={{ gap: 6 }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
              }}
            >
              <Text variant="bodySm" tone="secondary">
                Monthly tokens used
              </Text>
              <Text variant="bodySm" weight="medium">
                {formatTokens(used)} / {formatTokens(cap)}
              </Text>
            </View>
            {bonus != null && bonus > 0 && (
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <Text variant="bodySm" tone="secondary">
                  Bonus tokens
                </Text>
                <Text variant="bodySm" weight="medium" style={{ color: t.colors.success }}>
                  +{formatTokens(bonus)}
                </Text>
              </View>
            )}
            {cap != null && used != null && (
              <View
                style={{
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: t.colors.borderDefault,
                  overflow: "hidden",
                  marginTop: 4,
                }}
              >
                <View
                  style={{
                    height: 4,
                    borderRadius: 2,
                    width: `${Math.min((used / cap) * 100, 100)}%`,
                    backgroundColor: overCeiling
                      ? t.colors.warning
                      : t.colors.indigo500,
                  }}
                />
              </View>
            )}
          </View>

          {overCeiling && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                padding: 10,
                borderRadius: t.radii.sm,
                backgroundColor: "rgba(183, 121, 31, 0.10)",
              }}
            >
              <Lightning size={14} color={t.colors.warning} weight="fill" />
              <Text variant="bodySm" style={{ color: t.colors.warning, flex: 1 }}>
                Monthly cap reached — add tokens below to keep chatting.
              </Text>
            </View>
          )}
        </View>

        {/* Top-up section */}
        <View style={{ gap: 8 }}>
          <Text variant="caption" tone="tertiary" weight="semibold">
            ADD TOKENS
          </Text>
          {TOP_UP_OPTIONS.map((opt) => (
            <Pressable
              key={opt.id}
              onPress={() => handleTopUp(opt.id)}
              disabled={loading !== null}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                padding: 16,
                borderRadius: t.radii.md,
                borderWidth: 1,
                borderColor: t.colors.borderDefault,
                backgroundColor: pressed
                  ? t.colors.bgElevated
                  : t.colors.bgSurface,
                opacity: loading !== null && loading !== opt.id ? 0.5 : 1,
              })}
            >
              <View style={{ gap: 2 }}>
                <Text variant="body" weight="medium">
                  {opt.label}
                </Text>
                <Text variant="bodySm" tone="secondary">
                  {opt.tokens}
                </Text>
              </View>
              {loading === opt.id ? (
                <ActivityIndicator size="small" color={t.colors.indigo500} />
              ) : (
                <View style={{ alignItems: "flex-end", gap: 2 }}>
                  <Text variant="body" weight="semibold" style={{ color: t.colors.indigo500 }}>
                    {opt.price}
                  </Text>
                  <Text variant="caption" tone="tertiary">
                    one-time
                  </Text>
                </View>
              )}
            </Pressable>
          ))}
        </View>

        {/* Billing portal */}
        <View style={{ gap: 8 }}>
          <Text variant="caption" tone="tertiary" weight="semibold">
            MANAGE SUBSCRIPTION
          </Text>
          <Button
            label="Open billing portal"
            variant="secondary"
            size="lg"
            fullWidth
            loading={loading === "portal"}
            iconRight={<ArrowSquareOut size={16} color={t.colors.inkPrimary} />}
            onPress={handlePortal}
          />
          <Text variant="caption" tone="tertiary" style={{ textAlign: "center" }}>
            Upgrade, downgrade, or manage payment methods in Stripe.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
