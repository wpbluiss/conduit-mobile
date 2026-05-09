import React from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";
import { usePraxisTheme } from "../../contexts/PraxisThemeContext";
import { Text } from "./Text";
import { EMPLOYEES, type EmployeeId } from "../../lib/conduit/employees";

type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface EmployeeAvatarProps {
  employee: EmployeeId | "team" | null | undefined;
  size?: AvatarSize;
  ringed?: boolean;
  style?: StyleProp<ViewStyle>;
}

const SIZE_MAP: Record<AvatarSize, { d: number; type: "displaySm" | "displayMd" | "bodyLg" | "body" | "bodySm" }> = {
  xs: { d: 22, type: "bodySm" },
  sm: { d: 30, type: "body" },
  md: { d: 40, type: "bodyLg" },
  lg: { d: 56, type: "displaySm" },
  xl: { d: 80, type: "displayMd" },
};

export function EmployeeAvatar({ employee, size = "md", ringed = true, style }: EmployeeAvatarProps) {
  const t = usePraxisTheme();
  const { d, type } = SIZE_MAP[size];

  const isTeam = employee === "team";
  const cfg = !isTeam && employee ? EMPLOYEES[employee] : null;

  const ringColor = isTeam ? t.colors.indigo500 : (cfg?.ringColor ?? t.colors.borderDefault);
  const glyph = isTeam ? "•" : (cfg?.glyph ?? "?");

  return (
    <View
      style={[
        {
          width: d,
          height: d,
          borderRadius: d / 2,
          backgroundColor: t.isDark ? t.colors.bgElevated : t.colors.bgSurface,
          borderWidth: ringed ? 1.5 : 0,
          borderColor: ringed ? ringColor : "transparent",
          alignItems: "center",
          justifyContent: "center",
        },
        style,
      ]}
    >
      <Text variant={type} family="display" weight="semibold" style={{ color: ringColor, lineHeight: d }}>
        {glyph}
      </Text>
    </View>
  );
}
