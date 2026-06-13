import React, { useEffect, useState } from "react";
import { View, ScrollView, Pressable, Alert, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, ArrowSquareOut, CreditCard, Lightning } from "phosphor-react-native";
import { usePraxisTheme } from "../../../contexts/PraxisThemeContext";
import { Text, Button } from "../../../components/praxis";
import { getOrCreateAccount } from "../../../lib/conduit/account";
import { getTierConfig, fetchBillingPortalUrl } from "../../../lib/conduit/billing";
import type { ConduitAccount } from "../../../lib/conduit/types";

export default function BillingSettingsScreen() {
  const t = usePraxisTheme();
  const router = useRouter();
  const [account, setAccount] = useState<ConduitAccount | null>(null);
  const [openingPortal, setOpeningPortal] = useState(false);

  useEffect(() => {
    getOrCreateAccount().then(setAccount);
  }, []);

  const tier = getTierConfig(account?.tier_id);
  const used = account?.monthly_tokens_used ?? 0;
  const cap = account?.monthly_token_cap ?? 0;
  const bonus = account?.bonus_tokens ?? 0;
  const totalAllowance = cap + bonus;
  const usagePercent = totalAllowance > 0 ? Math.min(1, used / totalAllowance) : 0;
  const usageHigh = usagePercent > 0.85;

  const handleOpenPortal = async () => {
    setOpeningPortal(true);
    const result = await fetchBillingPortalUrl();
    setOpeningPortal(false);
    if (!result.ok) {
      Alert.alert("Couldn't open billing portal", result.error);
      return;
    }
    Linking.openURL(result.url).catch(() => {
      Alert.alert("Couldn't open URL", "Please visit conduitai.io to manage billing.");
    });
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
          paddingBottom: 32,
          gap: 16,
        }}
      >
        <View style={{ marginBottom: 8 }}>
          <Text variant="caption" tone="indigo" weight="semibold">
            BILLING
          </Text>
          <Text variant="displayLg" family="display" weight="semibold">
            Plan & usage
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
            <TierBadge label={tier.label} color={tier.badgeColor} bg={tier.badgeBg} />
          </View>

          {cap > 0 && (
            <View style={{ gap: 6 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text variant="bodySm" tone="secondary">Monthly tokens used</Text>
                <Text variant="bodySm" weight="medium">
                  {used.toLocaleString()} / {totalAllowance.toLocaleString()}
                </Text>
              </View>
              <View
                style={{
                  height: 6,
                  borderRadius: t.radii.full,
                  backgroundColor: t.colors.bgElevated,
                  overflow: "hidden",
                }}
              >
                <View
                  style={{
                    height: "100%",
                    width: `${usagePercent * 100}%`,
                    borderRadius: t.radii.full,
                    backgroundColor: usageHigh ? t.colors.danger : t.colors.indigo500,
                  }}
                />
              </View>
              {usageHigh && (
                <Text variant="caption" style={{ color: t.colors.danger }}>
                  You're approaching your monthly limit.
                </Text>
              )}
              {bonus > 0 && (
                <Text variant="caption" tone="tertiary">
                  Includes {bonus.toLocaleString()} bonus tokens
                </Text>
              )}
            </View>
          )}

          <View style={{ gap: 8 }}>
            <Text variant="caption" tone="tertiary" weight="semibold">
              MODELS AVAILABLE
            </Text>
            {tier.models.map((m) => (
              <View key={m} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <View
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: tier.badgeColor,
                  }}
                />
                <Text variant="bodySm">{m}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Manage billing */}
        <Button
          label="Manage billing"
          variant="secondary"
          size="lg"
          fullWidth
          loading={openingPortal}
          iconLeft={<CreditCard size={16} color={t.colors.inkPrimary} />}
          iconRight={<ArrowSquareOut size={14} color={t.colors.inkTertiary} />}
          onPress={handleOpenPortal}
        />

        {/* Upgrade nudge — Free tier only */}
        {tier.id === "free" && (
          <UpgradeCard onUpgrade={handleOpenPortal} loading={openingPortal} />
        )}

        <Text variant="caption" tone="tertiary" style={{ textAlign: "center" }}>
          Billing is managed securely through Stripe.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function TierBadge({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <View
      style={{
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 9999,
        backgroundColor: bg,
      }}
    >
      <Text variant="caption" weight="semibold" style={{ color }}>
        {label.toUpperCase()}
      </Text>
    </View>
  );
}

function UpgradeCard({ onUpgrade, loading }: { onUpgrade: () => void; loading: boolean }) {
  const t = usePraxisTheme();
  return (
    <View
      style={{
        padding: 16,
        borderRadius: t.radii.lg,
        backgroundColor: t.colors.indigoSoft,
        borderWidth: 1,
        borderColor: t.colors.indigo200,
        gap: 10,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Lightning size={16} color={t.colors.indigo500} weight="fill" />
        <Text variant="body" weight="semibold" style={{ color: t.colors.indigo500 }}>
          Upgrade to Pro
        </Text>
      </View>
      <Text variant="bodySm" tone="secondary">
        Unlock 500k monthly tokens, Claude Sonnet, and priority support.
      </Text>
      <Button
        label="See upgrade options"
        variant="primary"
        size="md"
        fullWidth
        loading={loading}
        onPress={onUpgrade}
      />
    </View>
  );
}
