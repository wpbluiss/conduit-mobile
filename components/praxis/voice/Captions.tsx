import React from "react";
import { View, ScrollView } from "react-native";
import { usePraxisTheme } from "../../../contexts/PraxisThemeContext";
import { Text } from "../Text";

export interface CaptionsProps {
  speakerLabel?: string;
  text: string;
  align?: "left" | "center";
  tone?: "primary" | "secondary";
}

export function Captions({ speakerLabel, text, align = "center", tone = "primary" }: CaptionsProps) {
  const t = usePraxisTheme();
  return (
    <ScrollView
      contentContainerStyle={{
        paddingHorizontal: 28,
        paddingVertical: 12,
        alignItems: align === "center" ? "center" : "stretch",
      }}
      showsVerticalScrollIndicator={false}
    >
      {speakerLabel ? (
        <Text
          variant="caption"
          tone="indigo"
          weight="semibold"
          style={{ marginBottom: 8 }}
          align={align}
        >
          {speakerLabel.toUpperCase()}
        </Text>
      ) : null}
      <Text
        variant="bodyLg"
        family="display"
        weight="medium"
        tone={tone}
        align={align}
        style={{ lineHeight: 30 }}
      >
        {text}
      </Text>
    </ScrollView>
  );
}
