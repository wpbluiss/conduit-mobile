import React from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";
import { usePraxisTheme } from "../../contexts/PraxisThemeContext";

type IconBadgeTone = "indigo" | "ember" | "neutral" | "success" | "danger";
type IconBadgeSize = "sm" | "md" | "lg";

export interface IconBadgeProps {
  icon: React.ReactNode;
  tone?: IconBadgeTone;
  size?: IconBadgeSize;
  ringed?: boolean;
  style?: StyleProp<ViewStyle>;
}

const SIZE_MAP: Record<IconBadgeSize, number> = { sm: 28, md: 36, lg: 44 };

export function IconBadge({ icon, tone = "indigo", size = "md", ringed = false, style }: IconBadgeProps) {
  const t = usePraxisTheme();
  const dim = SIZE_MAP[size];

  const palette = (() => {
    switch (tone) {
      case "indigo":
        return { bg: t.colors.indigoSoft, ring: t.colors.indigo300 };
      case "ember":
        return { bg: "rgba(214, 120, 23, 0.12)", ring: t.colors.ember };
      case "success":
        return { bg: "rgba(14, 138, 85, 0.12)", ring: t.colors.success };
      case "danger":
        return { bg: "rgba(200, 65, 43, 0.12)", ring: t.colors.danger };
      case "neutral":
        return { bg: t.colors.bgElevated, ring: t.colors.borderDefault };
    }
  })();

  return (
    <View
      style={[
        {
          width: dim,
          height: dim,
          borderRadius: dim / 2,
          backgroundColor: palette.bg,
          alignItems: "center",
          justifyContent: "center",
          borderWidth: ringed ? 1 : 0,
          borderColor: ringed ? palette.ring : "transparent",
        },
        style,
      ]}
    >
      {icon}
    </View>
  );
}
