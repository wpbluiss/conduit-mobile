import React from "react";
import { View, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft } from "phosphor-react-native";
import { usePraxisTheme } from "../contexts/PraxisThemeContext";
import { Text } from "../components/praxis/Text";
import { PraxisLogo } from "../components/praxis/PraxisLogo";

export default function NotFoundScreen() {
  const t = usePraxisTheme();
  const router = useRouter();

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: t.colors.bgCanvas }}
      edges={["top", "bottom"]}
    >
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 32,
        }}
      >
        <PraxisLogo size={48} />
        <Text
          variant="caption"
          tone="indigo"
          weight="semibold"
          style={{ marginTop: 24, marginBottom: 8 }}
        >
          404 NOT FOUND
        </Text>
        <Text
          variant="displayMd"
          family="display"
          weight="semibold"
          align="center"
          style={{ marginBottom: 8 }}
        >
          Page not found.
        </Text>
        <Text
          variant="body"
          tone="secondary"
          align="center"
          style={{ marginBottom: 28, maxWidth: 320 }}
        >
          This route doesn't exist or the link you followed is invalid.
        </Text>
        <Pressable
          onPress={() => router.replace("/(app)/chat/active" as never)}
          style={({ pressed }) => ({
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            paddingHorizontal: 18,
            paddingVertical: 12,
            borderRadius: t.radii.full,
            backgroundColor: pressed ? t.colors.indigo700 : t.colors.indigo500,
          })}
        >
          <ArrowLeft size={16} color="#FFFFFF" weight="bold" />
          <Text variant="bodySm" weight="semibold" style={{ color: "#FFFFFF" }}>
            Go home
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
