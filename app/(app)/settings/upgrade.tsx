import React, { useEffect } from "react";
import { View, ScrollView, Pressable, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, Star, Check } from "phosphor-react-native";
import { usePraxisTheme } from "../../../contexts/PraxisThemeContext";
import { Text, Button } from "../../../components/praxis";
import { trackEvent } from "../../../lib/conduit/analytics";

const UPGRADE_URL = "https://conduitai.io/pricing";

const PRO_FEATURES = [
  "Unlimited conversations",
  "Priority response speed",
  "All 9 AI employees",
  "Voice mode",
  "Cross-conversation memory",
];

export default function UpgradeScreen() {
  const t = usePraxisTheme();
  const router = useRouter();

  useEffect(() => {
    trackEvent("paywall_viewed", { reason: "upgrade_screen" });
  }, []);

  const handleUpgrade = () => {
    trackEvent("checkout_clicked", { reason: "upgrade_screen" });
    Linking.openURL(UPGRADE_URL).catch(() => {});
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
          gap: 20,
        }}
      >
        <View style={{ marginBottom: 8 }}>
          <Text variant="caption" tone="indigo" weight="semibold">
            UPGRADE
          </Text>
          <Text variant="displayLg" family="display" weight="semibold">
            Unlock Praxis Pro
          </Text>
          <Text variant="body" tone="secondary" style={{ marginTop: 8 }}>
            Get the full nine-employee workforce.
          </Text>
        </View>

        <View
          style={{
            borderRadius: t.radii.lg,
            backgroundColor: t.colors.bgSurface,
            borderWidth: 1,
            borderColor: t.colors.borderSubtle,
            padding: 20,
            gap: 14,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Star size={18} color={t.colors.indigo500} weight="fill" />
            <Text variant="body" weight="semibold">
              Pro plan
            </Text>
          </View>

          {PRO_FEATURES.map((f) => (
            <View key={f} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Check size={16} color={t.colors.indigo500} weight="bold" />
              <Text variant="body" tone="secondary">
                {f}
              </Text>
            </View>
          ))}
        </View>

        <Button
          label="Upgrade on Praxis.ai"
          variant="primary"
          size="lg"
          fullWidth
          onPress={handleUpgrade}
        />

        <Text variant="bodySm" tone="tertiary" style={{ textAlign: "center" }}>
          Subscription managed on conduitai.io. Cancel anytime.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
