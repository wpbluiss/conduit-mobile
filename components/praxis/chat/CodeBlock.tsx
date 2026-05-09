import React from "react";
import { View, ScrollView } from "react-native";
import { usePraxisTheme } from "../../../contexts/PraxisThemeContext";
import { Text } from "../Text";

export interface CodeBlockProps {
  code: string;
  language?: string;
}

export function CodeBlock({ code, language }: CodeBlockProps) {
  const t = usePraxisTheme();
  return (
    <View
      style={{
        marginVertical: 6,
        backgroundColor: t.isDark ? "#0A0A0C" : "#1A1B1F",
        borderRadius: t.radii.md,
        overflow: "hidden",
      }}
    >
      {language ? (
        <View
          style={{
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderBottomColor: "rgba(255,255,255,0.06)",
            borderBottomWidth: 1,
          }}
        >
          <Text variant="caption" style={{ color: "#8B8E96" }}>
            {language.toUpperCase()}
          </Text>
        </View>
      ) : null}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ padding: 12, paddingRight: 24 }}>
          <Text
            family="mono"
            variant="bodySm"
            style={{ color: "#F2F0EB", lineHeight: 20 }}
          >
            {code}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
