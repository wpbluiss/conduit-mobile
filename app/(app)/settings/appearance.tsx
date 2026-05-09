import React from "react";
import { View, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, Sun, Moon, Sparkle, Check } from "phosphor-react-native";
import { usePraxisTheme } from "../../../contexts/PraxisThemeContext";
import { Text } from "../../../components/praxis";
import { useThemeStore, type ThemePreference } from "../../../store/themeStore";

interface Option {
  key: ThemePreference;
  label: string;
  hint: string;
  icon: (color: string) => React.ReactNode;
}

const OPTIONS: Option[] = [
  { key: "system", label: "Match system", hint: "Follow your device setting", icon: (c) => <Sparkle size={18} color={c} /> },
  { key: "light", label: "Light", hint: "Bone canvas, indigo accents", icon: (c) => <Sun size={18} color={c} weight="fill" /> },
  { key: "dark", label: "Dark", hint: "Deep ink, indigo glow", icon: (c) => <Moon size={18} color={c} weight="fill" /> },
];

export default function AppearanceScreen() {
  const t = usePraxisTheme();
  const router = useRouter();
  const { preference, setPreference } = useThemeStore();

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

      <View style={{ paddingHorizontal: t.layout.screenPaddingX, marginBottom: 16 }}>
        <Text variant="caption" tone="indigo" weight="semibold">
          APPEARANCE
        </Text>
        <Text variant="displayLg" family="display" weight="semibold">
          How Praxis looks
        </Text>
      </View>

      <View style={{ paddingHorizontal: t.layout.screenPaddingX, gap: 10 }}>
        {OPTIONS.map((opt) => {
          const selected = preference === opt.key;
          return (
            <Pressable
              key={opt.key}
              onPress={() => setPreference(opt.key)}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                padding: 14,
                borderRadius: t.radii.md,
                backgroundColor: pressed ? t.colors.bgElevated : t.colors.bgSurface,
                borderWidth: selected ? 1.5 : 1,
                borderColor: selected ? t.colors.indigo500 : t.colors.borderSubtle,
              })}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: t.colors.indigoSoft,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {opt.icon(t.colors.indigo500)}
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="body" weight="semibold">
                  {opt.label}
                </Text>
                <Text variant="bodySm" tone="tertiary" style={{ marginTop: 2 }}>
                  {opt.hint}
                </Text>
              </View>
              {selected ? <Check size={18} color={t.colors.indigo500} weight="bold" /> : null}
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
}
