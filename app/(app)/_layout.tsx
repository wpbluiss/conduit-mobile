import React from "react";
import { Stack } from "expo-router";
import { usePraxisTheme } from "../../contexts/PraxisThemeContext";

export default function AppLayout() {
  const t = usePraxisTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: t.colors.bgCanvas },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="chat" />
      <Stack.Screen name="builds" />
      <Stack.Screen name="team" />
      <Stack.Screen name="settings" />
      <Stack.Screen
        name="voice"
        options={{
          presentation: "modal",
          animation: "slide_from_bottom",
          contentStyle: { backgroundColor: "#08070C" },
        }}
      />
    </Stack>
  );
}
