import React from "react";
import { View, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  Rocket,
  Browsers,
  Funnel,
  AddressBook,
  EnvelopeOpen,
  ArrowRight,
} from "phosphor-react-native";
import * as Haptics from "expo-haptics";
import { usePraxisTheme } from "../../../contexts/PraxisThemeContext";
import { Text } from "../../../components/praxis";
import { EMPLOYEE_SURFACES } from "../../../lib/conduit/surfaces";

interface Template {
  id: string;
  name: string;
  desc: string;
  Icon: typeof Rocket;
}

const TEMPLATES: Template[] = [
  {
    id: "landing-page",
    name: "Landing Page",
    desc: "A conversion-focused page with hero, features, and CTA.",
    Icon: Rocket,
  },
  {
    id: "basic-crm",
    name: "Basic CRM",
    desc: "Contact list, deal tracking, and simple pipeline view.",
    Icon: AddressBook,
  },
  {
    id: "blog",
    name: "Blog",
    desc: "SEO-ready blog with Markdown posts and RSS feed.",
    Icon: Browsers,
  },
  {
    id: "lead-capture",
    name: "Lead Capture",
    desc: "Form-first page that collects leads and syncs to your CRM.",
    Icon: Funnel,
  },
  {
    id: "contact-form",
    name: "Contact Form",
    desc: "Simple contact page with email routing and spam filtering.",
    Icon: EnvelopeOpen,
  },
];

export default function NewBuildScreen() {
  const t = usePraxisTheme();
  const router = useRouter();
  const surface = EMPLOYEE_SURFACES.engineering;

  const pick = (tmpl: Template) => {
    Haptics.selectionAsync().catch(() => {});
    const draft = `Build me a ${tmpl.name} using the ${tmpl.id} template.`;
    router.push(`/(app)/chat/new?employee=engineering&draft=${encodeURIComponent(draft)}` as never);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.bgCanvas }} edges={["top"]}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          paddingHorizontal: 8,
          paddingVertical: 8,
          borderBottomWidth: 0.5,
          borderBottomColor: t.colors.borderSubtle,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          style={{ width: 36, height: 36, alignItems: "center", justifyContent: "center" }}
        >
          <ArrowLeft size={20} color={t.colors.inkPrimary} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text variant="caption" style={{ color: surface.accentColor, letterSpacing: 0.88 }}>
            ENGINEERING
          </Text>
          <Text variant="bodyLg" weight="semibold">
            New Build
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: t.layout.screenPaddingX,
          paddingTop: 20,
          paddingBottom: 40,
          gap: 12,
        }}
      >
        <Text variant="body" tone="secondary" style={{ marginBottom: 4 }}>
          Pick a starting template. Engineering will scaffold the project,
          create the repo, and stream the build — you can watch it live.
        </Text>

        {TEMPLATES.map((tmpl) => {
          const Icon = tmpl.Icon;
          return (
            <Pressable
              key={tmpl.id}
              onPress={() => pick(tmpl)}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                gap: 14,
                paddingHorizontal: 16,
                paddingVertical: 16,
                borderRadius: t.radii.lg,
                backgroundColor: pressed ? surface.accentSoft : t.colors.bgSurface,
                borderWidth: 1,
                borderColor: pressed ? surface.accentColor : t.colors.borderSubtle,
              })}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  backgroundColor: surface.accentSoft,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon size={22} color={surface.accentColor} weight="duotone" />
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="body" weight="semibold">
                  {tmpl.name}
                </Text>
                <Text variant="bodySm" tone="secondary" style={{ marginTop: 2 }}>
                  {tmpl.desc}
                </Text>
              </View>
              <ArrowRight size={16} color={t.colors.inkTertiary} />
            </Pressable>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}
