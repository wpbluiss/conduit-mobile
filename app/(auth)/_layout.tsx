import { Stack } from "expo-router";
import { usePraxisTheme } from "../../contexts/PraxisThemeContext";

export default function AuthLayout() {
  const t = usePraxisTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: t.colors.bgCanvas },
        animation: "fade",
      }}
    />
  );
}
