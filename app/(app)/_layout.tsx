import React from "react";
import { Tabs } from "expo-router";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import {
  HouseLine,
  ChatCircleText,
  Microphone,
  Stack as StackIcon,
  UsersThree,
} from "phosphor-react-native";
import * as Haptics from "expo-haptics";
import { usePraxisTheme } from "../../contexts/PraxisThemeContext";
import { Text } from "../../components/praxis/Text";

interface TabConfig {
  name: string;
  label: string;
  icon: (props: { size: number; color: string; weight: "regular" | "fill" }) => React.ReactNode;
}

const TABS: TabConfig[] = [
  { name: "index", label: "Home", icon: (p) => <HouseLine {...p} /> },
  { name: "chat", label: "Chat", icon: (p) => <ChatCircleText {...p} /> },
  { name: "voice", label: "Voice", icon: (p) => <Microphone {...p} /> },
  { name: "builds", label: "Builds", icon: (p) => <StackIcon {...p} /> },
  { name: "team", label: "Team", icon: (p) => <UsersThree {...p} /> },
];

export default function AppLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <PraxisTabBar {...props} />}
    >
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="chat" options={{ title: "Chat" }} />
      <Tabs.Screen name="voice" options={{ title: "Voice" }} />
      <Tabs.Screen name="builds" options={{ title: "Builds" }} />
      <Tabs.Screen name="team" options={{ title: "Team" }} />
      <Tabs.Screen name="settings" options={{ href: null }} />
    </Tabs>
  );
}

function PraxisTabBar({ state, navigation }: BottomTabBarProps) {
  const t = usePraxisTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        flexDirection: "row",
        backgroundColor: t.colors.bgSurface,
        borderTopWidth: 0.5,
        borderTopColor: t.colors.borderSubtle,
        paddingTop: 6,
        paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
      }}
    >
      {state.routes
        .map((route, idx) => {
          const tab = TABS.find((c) => c.name === route.name);
          if (!tab) return null;
          const isFocused = state.index === idx;
          const color = isFocused ? t.colors.indigo500 : t.colors.inkTertiary;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              Haptics.selectionAsync().catch(() => {});
              navigation.navigate(route.name, route.params);
            }
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
                paddingVertical: 6,
                gap: 2,
              }}
            >
              {tab.icon({ size: 22, color, weight: isFocused ? "fill" : "regular" })}
              <Text
                variant="caption"
                weight="medium"
                style={{ color, letterSpacing: 0.4, fontSize: 10 }}
              >
                {tab.label.toUpperCase()}
              </Text>
            </Pressable>
          );
        })}
    </View>
  );
}
