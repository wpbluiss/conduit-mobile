import React from "react";
import { View, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, Microphone } from "phosphor-react-native";
import { usePraxisTheme } from "../../../contexts/PraxisThemeContext";
import { Text } from "../../../components/praxis";

export default function VoicePrefsScreen() {
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

      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 32,
        }}
      >
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: t.colors.indigoSoft,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 16,
          }}
        >
          <Microphone size={26} color={t.colors.indigo500} />
        </View>
        <Text variant="caption" tone="indigo" weight="semibold" style={{ marginBottom: 6 }}>
          VOICE PREFERENCES
        </Text>
        <Text variant="displayLg" family="display" weight="semibold" align="center">
          Voice rolls out next build.
        </Text>
        <Text variant="body" tone="secondary" align="center" style={{ marginTop: 12, maxWidth: 320 }}>
          Output voice, captions style, and push-to-talk transcription land in the
          next TestFlight drop.
        </Text>
      </View>
    </SafeAreaView>
  );
}
