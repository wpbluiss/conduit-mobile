import React from "react";
import { UsersThree } from "phosphor-react-native";
import { PlaceholderScreen } from "../../../components/praxis";
import { usePraxisTheme } from "../../../contexts/PraxisThemeContext";

export default function TeamIndexScreen() {
  const t = usePraxisTheme();
  return (
    <PlaceholderScreen
      eyebrow="TEAM"
      title="Nine employees"
      body="Atlas, Engineering, Sales — every employee with a callable surface."
      icon={<UsersThree size={28} color={t.colors.indigo500} weight="fill" />}
    />
  );
}
