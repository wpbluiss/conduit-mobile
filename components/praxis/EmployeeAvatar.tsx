import React from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";
import { Users } from "lucide-react-native";
import { usePraxisTheme } from "../../contexts/PraxisThemeContext";
import { type EmployeeId } from "../../lib/conduit/employees";
import { EMPLOYEE_SURFACES } from "../../lib/conduit/surfaces";

type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface EmployeeAvatarProps {
  employee: EmployeeId | "team" | null | undefined;
  size?: AvatarSize;
  ringed?: boolean;
  style?: StyleProp<ViewStyle>;
}

const SIZE_MAP: Record<AvatarSize, { d: number; iconSize: number }> = {
  xs: { d: 22, iconSize: 12 },
  sm: { d: 30, iconSize: 16 },
  md: { d: 40, iconSize: 20 },
  lg: { d: 56, iconSize: 28 },
  xl: { d: 80, iconSize: 40 },
};

// Every employee carries its own jewel-tone signature now (R14 → R19) so
// the team grid and pinned drawer read at-a-glance. No more shared slate
// fallback for finance/ops/compliance/hr/legal — each is distinct.
export function EmployeeAvatar({
  employee,
  size = "md",
  ringed = false,
  style,
}: EmployeeAvatarProps) {
  const t = usePraxisTheme();
  const { d, iconSize } = SIZE_MAP[size];

  if (employee === "team") {
    return (
      <View
        style={[
          {
            width: d,
            height: d,
            borderRadius: d / 2,
            backgroundColor: "#5B63E8",
            alignItems: "center",
            justifyContent: "center",
            borderWidth: ringed ? 1.5 : 0,
            borderColor: ringed ? t.colors.bgSurface : "transparent",
          },
          style,
        ]}
      >
        <Users size={iconSize} color="#FFFFFF" strokeWidth={2.25} />
      </View>
    );
  }

  const key: EmployeeId = employee ?? "atlas";
  const surface = EMPLOYEE_SURFACES[key] ?? EMPLOYEE_SURFACES.atlas;
  const Icon = surface.Icon;

  return (
    <View
      style={[
        {
          width: d,
          height: d,
          borderRadius: d / 2,
          backgroundColor: surface.accentColor,
          alignItems: "center",
          justifyContent: "center",
          borderWidth: ringed ? 1.5 : 0,
          borderColor: ringed ? t.colors.bgSurface : "transparent",
        },
        style,
      ]}
    >
      <Icon size={iconSize} color="#FFFFFF" strokeWidth={2.25} />
    </View>
  );
}
