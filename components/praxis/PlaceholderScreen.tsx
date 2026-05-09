import React from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { usePraxisTheme } from "../../contexts/PraxisThemeContext";
import { Text } from "./Text";
import { IconBadge } from "./IconBadge";

export interface PlaceholderScreenProps {
  eyebrow: string;
  title: string;
  body: string;
  icon?: React.ReactNode;
}

export function PlaceholderScreen({ eyebrow, title, body, icon }: PlaceholderScreenProps) {
  const t = usePraxisTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.bgCanvas }} edges={["top"]}>
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: t.layout.screenPaddingX,
        }}
      >
        {icon ? (
          <IconBadge icon={icon} tone="indigo" size="lg" ringed style={{ marginBottom: 24 }} />
        ) : null}
        <Text variant="caption" tone="indigo" weight="semibold" style={{ marginBottom: 8 }}>
          {eyebrow}
        </Text>
        <Text variant="displayLg" family="display" weight="semibold" align="center">
          {title}
        </Text>
        <Text variant="body" tone="secondary" align="center" style={{ marginTop: 12, maxWidth: 320 }}>
          {body}
        </Text>
      </View>
    </SafeAreaView>
  );
}
