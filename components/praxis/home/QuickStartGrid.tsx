import React from "react";
import { View, Pressable } from "react-native";
import { useRouter } from "expo-router";
import {
  ChatCircleText,
  Microphone,
  Stack as StackIcon,
  Brain,
} from "phosphor-react-native";
import { usePraxisTheme } from "../../../contexts/PraxisThemeContext";
import { Text } from "../Text";

interface Cell {
  key: string;
  title: string;
  subtitle: string;
  icon: (color: string) => React.ReactNode;
  href: string;
}

export function QuickStartGrid() {
  const t = usePraxisTheme();
  const router = useRouter();

  const cells: Cell[] = [
    {
      key: "chat",
      title: "New chat",
      subtitle: "Talk with the team",
      icon: (c) => <ChatCircleText size={22} color={c} weight="fill" />,
      href: "/(app)/chat/new",
    },
    {
      key: "voice",
      title: "Voice mode",
      subtitle: "Hands-on focus",
      icon: (c) => <Microphone size={22} color={c} weight="fill" />,
      href: "/(app)/voice",
    },
    {
      key: "build",
      title: "New build",
      subtitle: "Engineering ships",
      icon: (c) => <StackIcon size={22} color={c} weight="fill" />,
      href: "/(app)/builds",
    },
    {
      key: "memory",
      title: "Memory",
      subtitle: "What Atlas knows",
      icon: (c) => <Brain size={22} color={c} weight="fill" />,
      href: "/(app)/settings/memory",
    },
  ];

  return (
    <View
      style={{
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 12,
      }}
    >
      {cells.map((cell) => (
        <Pressable
          key={cell.key}
          onPress={() => router.push(cell.href as never)}
          style={({ pressed }) => ({
            flexBasis: "48%",
            flexGrow: 1,
            minHeight: 120,
            padding: 16,
            borderRadius: t.radii.lg,
            backgroundColor: pressed ? t.colors.bgElevated : t.colors.bgSurface,
            borderWidth: 1,
            borderColor: t.colors.borderSubtle,
            justifyContent: "space-between",
          })}
        >
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: t.colors.indigoSoft,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {cell.icon(t.colors.indigo500)}
          </View>
          <View style={{ marginTop: 8 }}>
            <Text variant="body" weight="semibold">
              {cell.title}
            </Text>
            <Text variant="bodySm" tone="tertiary" style={{ marginTop: 2 }}>
              {cell.subtitle}
            </Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
}
