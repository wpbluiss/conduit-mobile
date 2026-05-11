import React from "react";
import { View, Pressable, ScrollView } from "react-native";
import * as Haptics from "expo-haptics";
import { usePraxisTheme } from "../../../contexts/PraxisThemeContext";
import { Text } from "../Text";

export interface WelcomeStateProps {
  greeting: string;
  displayName: string;
  suggestions: string[];
  onSelectSuggestion: (text: string) => void;
}

export function WelcomeState({
  greeting,
  displayName,
  suggestions,
  onSelectSuggestion,
}: WelcomeStateProps) {
  const t = usePraxisTheme();

  return (
    <ScrollView
      contentContainerStyle={{
        flexGrow: 1,
        justifyContent: "center",
        paddingHorizontal: t.layout.screenPaddingX,
        paddingVertical: 32,
      }}
      showsVerticalScrollIndicator={false}
    >
      <View
        style={{
          alignItems: "center",
          marginBottom: 32,
        }}
      >
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: t.colors.violet700,
            borderWidth: 1,
            borderColor: t.colors.violet800,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 18,
          }}
        >
          <Text
            variant="displayMd"
            family="display"
            weight="semibold"
            style={{ color: "#FFFFFF" }}
          >
            P
          </Text>
        </View>

        <Text
          variant="caption"
          tone="indigo"
          weight="semibold"
          style={{ marginBottom: 8 }}
        >
          PRAXIS CONSOLE
        </Text>
        <Text
          variant="displayLg"
          family="display"
          weight="semibold"
          align="center"
        >
          {greeting},
        </Text>
        <Text
          variant="displayLg"
          family="display"
          weight="semibold"
          italic
          tone="indigo"
          align="center"
          style={{ marginTop: 0 }}
        >
          {displayName}.
        </Text>
        <Text
          variant="bodyLg"
          tone="secondary"
          align="center"
          style={{ marginTop: 12, maxWidth: 320 }}
        >
          What are we working on?
        </Text>
      </View>

      <View style={{ gap: 10, alignSelf: "stretch", marginBottom: 28 }}>
        {suggestions.map((s) => (
          <Pressable
            key={s}
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              onSelectSuggestion(s);
            }}
            style={({ pressed }) => ({
              paddingHorizontal: 16,
              paddingVertical: 14,
              borderRadius: t.radii.lg,
              backgroundColor: pressed ? t.colors.bgElevated : t.colors.bgSurface,
              borderWidth: 1,
              borderColor: t.colors.borderSubtle,
            })}
          >
            <Text variant="body" tone="primary">
              {s}
            </Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}
