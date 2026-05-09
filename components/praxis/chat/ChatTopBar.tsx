import React from "react";
import { View, Pressable } from "react-native";
import { List, Plus } from "phosphor-react-native";
import * as Haptics from "expo-haptics";
import { usePraxisTheme } from "../../../contexts/PraxisThemeContext";
import { Text } from "../Text";

export interface ChatTopBarProps {
  title: string;
  subtitle?: string;
  onMenuPress: () => void;
  onNewPress: () => void;
}

export function ChatTopBar({
  title,
  subtitle,
  onMenuPress,
  onNewPress,
}: ChatTopBarProps) {
  const t = usePraxisTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 6,
        paddingVertical: 8,
        borderBottomWidth: 0.5,
        borderBottomColor: t.colors.borderSubtle,
      }}
    >
      <Pressable
        onPress={() => {
          Haptics.selectionAsync().catch(() => {});
          onMenuPress();
        }}
        hitSlop={10}
        style={({ pressed }) => ({
          width: 40,
          height: 40,
          borderRadius: 20,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: pressed ? t.colors.bgElevated : "transparent",
        })}
      >
        <List size={20} color={t.colors.inkPrimary} />
      </Pressable>

      <View style={{ flex: 1, alignItems: "center" }}>
        <Text variant="bodyLg" weight="semibold" numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="caption" tone="tertiary" style={{ marginTop: 1, letterSpacing: 0 }}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          onNewPress();
        }}
        hitSlop={10}
        style={({ pressed }) => ({
          width: 40,
          height: 40,
          borderRadius: 20,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: pressed ? t.colors.bgElevated : "transparent",
        })}
      >
        <Plus size={20} color={t.colors.inkPrimary} weight="bold" />
      </Pressable>
    </View>
  );
}
