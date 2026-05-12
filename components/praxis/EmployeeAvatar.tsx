import React from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";
import {
  Compass,
  Code2,
  TrendingUp,
  Sparkles,
  Users,
} from "lucide-react-native";
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
  xs: { d: 22, iconSize: 12 },
  sm: { d: 30, iconSize: 16 },
  md: { d: 40, iconSize: 20 },
  lg: { d: 56, iconSize: 28 },
  xl: { d: 80, iconSize: 40 },
};

type LucideIcon = typeof Compass;

interface RoleAvatar {
  Icon: LucideIcon;
  bg: string;
}

// Slate that holds AA contrast against white in both light and dark themes.
const NEUTRAL_BG = "#4A5160";

// Role-based avatar identity, aligned with Lunaro's R18 icon system: same
// Lucide set, same R14 palette depth. Atlas/Engineering/Sales/Marketing
// carry distinctive brand colors; the other five share a neutral slate so
// the named four stay legible at-a-glance in long lists. Every bg passes
// AA against the white icon stroke.
const ROLE_MAP: Record<EmployeeId | "team", RoleAvatar> = {
  atlas: { Icon: Compass, bg: "#6D28D9" }, // violet-700
  engineering: { Icon: Code2, bg: "#5B63E8" }, // indigo-500
  sales: { Icon: TrendingUp, bg: "#0E8A55" }, // success
  marketing: { Icon: Sparkles, bg: "#D67817" }, // ember
  finance: { Icon: Sparkles, bg: NEUTRAL_BG },
  compliance: { Icon: Sparkles, bg: NEUTRAL_BG },
  hr: { Icon: Sparkles, bg: NEUTRAL_BG },
  ops: { Icon: Sparkles, bg: NEUTRAL_BG },
  legal: { Icon: Sparkles, bg: NEUTRAL_BG },
  team: { Icon: Users, bg: "#5B63E8" },
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
      <Icon size={iconSize} color="#FFFFFF" strokeWidth={2.25} />
    </View>
  );
}
