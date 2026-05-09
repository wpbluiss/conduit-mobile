import React from "react";
import { HouseLine } from "phosphor-react-native";
import { PlaceholderScreen } from "../../components/praxis";
import { usePraxisTheme } from "../../contexts/PraxisThemeContext";

export default function HomeScreen() {
  const t = usePraxisTheme();
  return (
    <PlaceholderScreen
      eyebrow="HOME"
      title="Workspace dashboard"
      body="Quick start, recent activity, and memory snippets land here."
      icon={<HouseLine size={28} color={t.colors.indigo500} weight="fill" />}
    />
  );
}
