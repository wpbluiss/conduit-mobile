import React from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";
import {
  Compass,
  Code,
  TrendUp,
  Sparkle,
  UsersThree,
} from "phosphor-react-native";
import { usePraxisTheme } from "../../contexts/PraxisThemeContext";
import { type EmployeeId } from "../../lib/conduit/employees";

type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface EmployeeAvatarProps {
  employee: EmployeeId | "team" | null | undefined;
  size?: AvatarSize;
  ringed?: boolean;
  style?: StyleProp<ViewStyle>;
}

const SIZE_MAP: Record<AvatarSize, { d: number; iconSize: number }> = {
  xs: { d: 22, iconSize: 11 },
  sm: { d: 30, iconSize: 14 },
  md: { d: 40, iconSize: 18 },
  lg: { d: 56, iconSize: 26 },
  xl: { d: 80, iconSize: 36 },
};

type PhosphorIcon = typeof Compass;

interface RoleAvatar {
  Icon: PhosphorIcon;
  bg: string;
}

// Slate that holds AA contrast against white in both light and dark themes.
const NEUTRAL_BG = "#4A5160";

// Role-based avatar identity. The four "named" employees get distinctive
// icons + brand colors; the other five sit in a neutral slate so the named
// ones stay legible at-a-glance in long lists. All bgs pass AA against white.
const ROLE_MAP: Record<EmployeeId | "team", RoleAvatar> = {
  atlas: { Icon: Compass, bg: "#6D28D9" }, // violet-700
  engineering: { Icon: Code, bg: "#5B63E8" }, // indigo-500
  sales: { Icon: TrendUp, bg: "#0E8A55" }, // success
  marketing: { Icon: Sparkle, bg: "#D67817" }, // ember
  finance: { Icon: Sparkle, bg: NEUTRAL_BG },
  compliance: { Icon: Sparkle, bg: NEUTRAL_BG },
  hr: { Icon: Sparkle, bg: NEUTRAL_BG },
  ops: { Icon: Sparkle, bg: NEUTRAL_BG },
  legal: { Icon: Sparkle, bg: NEUTRAL_BG },
  team: { Icon: UsersThree, bg: "#5B63E8" },
};

export function EmployeeAvatar({
  employee,
  size = "md",
  ringed = false,
  style,
}: EmployeeAvatarProps) {
  const t = usePraxisTheme();
  const { d, iconSize } = SIZE_MAP[size];

  const key: EmployeeId | "team" = employee ?? "atlas";
  const { Icon, bg } = ROLE_MAP[key] ?? ROLE_MAP.atlas;

  return (
    <View
      style={[
        {
          width: d,
          height: d,
          borderRadius: d / 2,
          backgroundColor: bg,
          alignItems: "center",
          justifyContent: "center",
          borderWidth: ringed ? 1.5 : 0,
          borderColor: ringed ? t.colors.bgSurface : "transparent",
        },
        style,
      ]}
    >
      <Icon size={iconSize} color="#FFFFFF" weight="bold" />
    </View>
  );
}
