import React from "react";
import { View, ScrollView, Pressable, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, ArrowSquareOut, Shield, FileText, Prohibit } from "phosphor-react-native";
import { usePraxisTheme } from "../../../contexts/PraxisThemeContext";
import { Text } from "../../../components/praxis";

const LEGAL_DOCS = [
  {
    key: "privacy",
    label: "Privacy Policy",
    hint: "How we collect, use, and protect your data",
    url: "https://conduitai.io/privacy",
    icon: (c: string) => <Shield size={18} color={c} weight="fill" />,
    summary:
      "Praxis collects only what's needed to run your workspace: your email, chats, and usage data. Your data is stored in Supabase and is never used to train AI models. We share data with Anthropic, OpenAI, and ElevenLabs only to generate responses. You can request deletion at any time from Account Settings.",
  },
  {
    key: "terms",
    label: "Terms of Service",
    hint: "Your rights and responsibilities as a user",
    url: "https://conduitai.io/terms",
    icon: (c: string) => <FileText size={18} color={c} weight="fill" />,
    summary:
      "By using Praxis you agree to use it lawfully, keep your credentials secure, and not attempt to reverse-engineer the service. Praxis is provided as-is; we are not liable for output accuracy. You own your data; Praxis owns the platform.",
  },
  {
    key: "acceptable-use",
    label: "Acceptable Use Policy",
    hint: "What you may and may not do with Praxis",
    url: "https://conduitai.io/legal/acceptable-use",
    icon: (c: string) => <Prohibit size={18} color={c} weight="fill" />,
    summary:
      "You may use Praxis for lawful business purposes. You may not use it to generate harmful, deceptive, or illegal content; harass others; circumvent access controls; or resell access without authorization. Violations may result in account suspension or termination.",
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
          gap: 16,
        }}
      >
        <View style={{ marginBottom: 8 }}>
          <Text variant="caption" tone="indigo" weight="semibold">
            LEGAL
          </Text>
          <Text variant="displayLg" family="display" weight="semibold">
            Policies & terms.
          </Text>
        </View>

        {LEGAL_DOCS.map((doc) => (
          <View
            key={doc.key}
            style={{
              borderRadius: t.radii.lg,
              backgroundColor: t.colors.bgSurface,
              borderWidth: 1,
              borderColor: t.colors.borderSubtle,
              overflow: "hidden",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                paddingHorizontal: 16,
                paddingTop: 14,
                paddingBottom: 10,
                borderBottomWidth: 0.5,
                borderBottomColor: t.colors.borderSubtle,
              }}
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
                {doc.icon(t.colors.indigo500)}
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="body" weight="semibold">
                  {doc.label}
                </Text>
                <Text variant="bodySm" tone="tertiary" style={{ marginTop: 2 }}>
                  {doc.hint}
                </Text>
              </View>
            </View>

            <View style={{ padding: 16, gap: 12 }}>
              <Text variant="bodySm" tone="secondary" style={{ lineHeight: 20 }}>
                {doc.summary}
              </Text>

              <Pressable
                onPress={() => Linking.openURL(doc.url)}
                style={({ pressed }) => ({
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  alignSelf: "flex-start",
                  opacity: pressed ? 0.6 : 1,
                })}
                hitSlop={8}
              >
                <Text variant="bodySm" tone="indigo" weight="medium">
                  Read full policy
                </Text>
                <ArrowSquareOut size={14} color={t.colors.indigo500} />
              </Pressable>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
