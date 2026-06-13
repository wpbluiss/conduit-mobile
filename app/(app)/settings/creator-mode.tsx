import React, { useEffect, useRef, useState } from "react";
import { View, Pressable, Switch } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, Sparkle, X } from "phosphor-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { usePraxisTheme } from "../../../contexts/PraxisThemeContext";
import { Text } from "../../../components/praxis";
import { useCreatorModeStore } from "../../../store/creatorModeStore";

const TOOLTIP_KEY = "@praxis_creator_mode_tooltip_shown";

export default function CreatorModeScreen() {
  const t = usePraxisTheme();
  const router = useRouter();
  const { enabled, initialize, setEnabled } = useCreatorModeStore();
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const initialized = useRef(false);

  useEffect(() => {
    initialize().then(() => {
      initialized.current = true;
    });
  }, [initialize]);

  const onToggle = async (value: boolean) => {
    await setEnabled(value);
    if (value) {
      const shown = await AsyncStorage.getItem(TOOLTIP_KEY);
      if (!shown) {
        setTooltipVisible(true);
      }
    }
  };

  const dismissTooltip = async () => {
    setTooltipVisible(false);
    await AsyncStorage.setItem(TOOLTIP_KEY, "true");
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

      <View style={{ paddingHorizontal: t.layout.screenPaddingX, marginBottom: 24 }}>
        <Text variant="caption" tone="indigo" weight="semibold">
          ROUTING
        </Text>
        <Text variant="displayLg" family="display" weight="semibold">
          Creator Mode
        </Text>
      </View>

      <View style={{ paddingHorizontal: t.layout.screenPaddingX, gap: 16 }}>
        {/* Main toggle row */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            padding: 16,
            borderRadius: t.radii.md,
            backgroundColor: t.colors.bgSurface,
            borderWidth: 1,
            borderColor: enabled ? t.colors.indigo500 : t.colors.borderSubtle,
          }}
        >
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: t.colors.indigoSoft,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Sparkle size={20} color={t.colors.indigo500} weight="fill" />
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="body" weight="semibold">
              Creator Mode
            </Text>
            <Text variant="bodySm" tone="tertiary" style={{ marginTop: 2 }}>
              {enabled
                ? "Unified inbox — all team messages flow through"
                : "Adaptive routing — messages go to the right specialist"}
            </Text>
          </View>
          <Switch
            value={enabled}
            onValueChange={onToggle}
            trackColor={{ false: t.colors.borderDefault, true: t.colors.indigo500 }}
            thumbColor={t.colors.bgSurface}
          />
        </View>

        {/* Onboarding tooltip — shown only on first enable */}
        {tooltipVisible ? (
          <View
            style={{
              padding: 16,
              borderRadius: t.radii.md,
              backgroundColor: t.colors.indigoSoft,
              borderWidth: 1,
              borderColor: t.colors.indigo200,
              flexDirection: "row",
              alignItems: "flex-start",
              gap: 12,
            }}
          >
            <View style={{ flex: 1 }}>
              <Text variant="body" weight="semibold" tone="indigo">
                Creator Mode is on
              </Text>
              <Text variant="bodySm" tone="secondary" style={{ marginTop: 4 }}>
                {"All employee messages now flow into a single unified inbox. " +
                  "Adaptive routing is paused — every message goes through Atlas " +
                  "who surfaces relevant team activity without filtering.\n\n" +
                  "Turn it off to restore focused routing, where messages are " +
                  "automatically sent to the specialist most likely to help."}
              </Text>
            </View>
            <Pressable onPress={dismissTooltip} hitSlop={10}>
              <X size={16} color={t.colors.inkTertiary} />
            </Pressable>
          </View>
        ) : null}

        {/* Explainer */}
        <Text variant="bodySm" tone="tertiary" style={{ marginTop: 4 }}>
          When off, Praxis classifies your message intent (work, creative, urgent, social)
          and routes it to the most relevant team member. When on, all messages surface
          through Atlas in a unified team view — great for creative sessions where you
          want input from the whole team.
        </Text>
      </View>
    </SafeAreaView>
  );
}
