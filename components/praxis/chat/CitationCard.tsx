import React from "react";
import { View, Pressable, Linking } from "react-native";
import { ArrowSquareOut } from "phosphor-react-native";
import { usePraxisTheme } from "../../../contexts/PraxisThemeContext";
import { Text } from "../Text";

export interface CitationCardProps {
  title: string;
  source?: string;
  url?: string;
}

export function CitationCard({ title, source, url }: CitationCardProps) {
  const t = usePraxisTheme();
  const open = () => {
    if (url) Linking.openURL(url).catch(() => {});
  };

  return (
    <Pressable
      onPress={open}
      style={{
        marginVertical: 6,
        padding: 12,
        borderRadius: t.radii.md,
        borderWidth: 1,
        borderColor: t.colors.borderSubtle,
        backgroundColor: t.colors.bgElevated,
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
      }}
    >
      <View style={{ flex: 1 }}>
        <Text variant="bodySm" weight="medium" numberOfLines={1}>
          {title}
        </Text>
        {source ? (
          <Text variant="caption" tone="tertiary" style={{ marginTop: 2 }}>
            {source}
          </Text>
        ) : null}
      </View>
      {url ? <ArrowSquareOut size={14} color={t.colors.inkTertiary} /> : null}
    </Pressable>
  );
}
