import { Stack } from "expo-router";
import { usePraxisTheme } from "../../../contexts/PraxisThemeContext";

export default function BuildsLayout() {
  const t = usePraxisTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: t.colors.bgCanvas },
      }}
    />
  );
}
