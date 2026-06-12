import React from "react";
import { View, ScrollView, Pressable, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, ArrowSquareOut, ShieldCheck, Scroll, Article } from "phosphor-react-native";
import { usePraxisTheme } from "../../../contexts/PraxisThemeContext";
import { Text } from "../../../components/praxis";

const PRIVACY_POLICY_URL = "https://conduitai.io/privacy";
const TERMS_URL = "https://conduitai.io/terms";
const AUP_URL = "https://conduitai.io/legal/acceptable-use";

interface LegalRow {
  label: string;
  hint: string;
  url: string;
  icon: (color: string) => React.ReactNode;
}

const ROWS: LegalRow[] = [
  {
    label: "Privacy Policy",
    hint: "How we collect and use your data",
    url: PRIVACY_POLICY_URL,
    icon: (c) => <ShieldCheck size={18} color={c} weight="fill" />,
  },
  {
    label: "Terms of Service",
    hint: "Your rights and responsibilities",
    url: TERMS_URL,
    icon: (c) => <Scroll size={18} color={c} weight="fill" />,
  },
  {
    label: "Acceptable Use Policy",
    hint: "What you may and may not do",
    url: AUP_URL,
    icon: (c) => <Article size={18} color={c} weight="fill" />,
  },
];

export default function LegalScreen() {
  const t = usePraxisTheme();
  const router = useRouter();

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
            LEGAL
          </Text>
          <Text variant="displayLg" family="display" weight="semibold">
            Policies &amp; terms.
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
              key={row.url}
              onPress={() => Linking.openURL(row.url)}
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
              <ArrowSquareOut size={14} color={t.colors.inkTertiary} />
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
