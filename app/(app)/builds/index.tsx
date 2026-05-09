import React from "react";
import { Stack as StackIcon } from "phosphor-react-native";
import { PlaceholderScreen } from "../../../components/praxis";
import { usePraxisTheme } from "../../../contexts/PraxisThemeContext";

export default function BuildsIndexScreen() {
  const t = usePraxisTheme();
  return (
    <PlaceholderScreen
      eyebrow="BUILDS"
      title="Build sessions"
      body="Engineering's live progress streams here."
      icon={<StackIcon size={28} color={t.colors.indigo500} weight="fill" />}
    />
  );
}
