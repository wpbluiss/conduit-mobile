import React from "react";
import { View, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  CaretRight,
  UserCircle,
  Microphone,
  Brain,
  Sun,
  CreditCard,
  Info,
} from "phosphor-react-native";
import Constants from "expo-constants";
import { usePraxisTheme } from "../../../contexts/PraxisThemeContext";
import { Text } from "../../../components/praxis";

interface Row {
  href: string;
  label: string;
  hint: string;
  icon: (color: string) => React.ReactNode;
}

const ROWS: Row[] = [
  {
    href: "/(app)/settings/account",
    label: "Account",
    hint: "Profile, email, sign out",
    icon: (c) => <UserCircle size={18} color={c} weight="fill" />,
  },
  {
    href: "/(app)/settings/billing",
    label: "Billing",
    hint: "Plan, usage, and upgrades",
    icon: (c) => <CreditCard size={18} color={c} />,
  },
  {
    href: "/(app)/settings/voice-prefs",
    label: "Voice preferences",
    hint: "Audio output, captions",
    icon: (c) => <Microphone size={18} color={c} />,
  },
  {
    href: "/(app)/settings/memory",
    label: "Memory",
    hint: "What Atlas remembers",
    icon: (c) => <Brain size={18} color={c} />,
  },
  {
    href: "/(app)/settings/appearance",
    label: "Appearance",
    hint: "Light, dark, or system",
    icon: (c) => <Sun size={18} color={c} weight="fill" />,
  },
];

export default function SettingsIndexScreen() {
  const t = usePraxisTheme();
  const router = useRouter();
  const version = Constants.expoConfig?.version ?? "1.0.0";
  const build = Constants.expoConfig?.ios?.buildNumber ?? "?";

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
        }}
      >
        <View style={{ marginBottom: 24 }}>
          <Text variant="caption" tone="indigo" weight="semibold">
            SETTINGS
          </Text>
          <Text variant="displayLg" family="display" weight="semibold">
            How Praxis behaves.
          </Text>
        </View>

        <View
          style={{
            borderRadius: t.radii.lg,
            backgroundColor: t.colors.bgSurface,
            borderWidth: 1,
            borderColor: t.colors.borderSubtle,
            overflow: "hidden",
          }}
        >
          {ROWS.map((row, i) => (
            <Pressable
              key={row.href}
              onPress={() => router.push(row.href as never)}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                gap: 14,
                paddingHorizontal: 16,
                paddingVertical: 14,
                borderTopWidth: i === 0 ? 0 : 0.5,
                borderTopColor: t.colors.borderSubtle,
                backgroundColor: pressed ? t.colors.bgElevated : "transparent",
              })}
            >
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: t.colors.indigoSoft,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {row.icon(t.colors.indigo500)}
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="body" weight="medium">
                  {row.label}
                </Text>
                <Text variant="bodySm" tone="tertiary" style={{ marginTop: 2 }}>
                  {row.hint}
                </Text>
              </View>
              <CaretRight size={14} color={t.colors.inkTertiary} />
            </Pressable>
          ))}
        </View>

        <View
          style={{
            marginTop: 32,
            alignItems: "center",
            gap: 4,
          }}
        >
          <Info size={14} color={t.colors.inkTertiary} />
          <Text variant="caption" tone="tertiary">
            Praxis Console · v{version} (build {build})
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
