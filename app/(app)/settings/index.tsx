import React from "react";
import { GearSix } from "phosphor-react-native";
import { PlaceholderScreen } from "../../../components/praxis";
import { usePraxisTheme } from "../../../contexts/PraxisThemeContext";

export default function SettingsIndexScreen() {
  const t = usePraxisTheme();
  return (
    <PlaceholderScreen
      eyebrow="SETTINGS"
      title="Account & preferences"
      body="Account, voice prefs, memory, appearance."
      icon={<GearSix size={28} color={t.colors.indigo500} weight="fill" />}
    />
  );
}
