import React from "react";
import { View, type ViewProps, type StyleProp, type ViewStyle } from "react-native";
import { usePraxisTheme } from "../../contexts/PraxisThemeContext";
import type { PraxisTheme } from "../../constants/praxis-tokens";

type SurfaceVariant = "canvas" | "surface" | "elevated" | "transparent";
type SurfaceElevation = "none" | "subtle" | "default" | "floating";

export interface SurfaceProps extends ViewProps {
  variant?: SurfaceVariant;
  elevation?: SurfaceElevation;
  radius?: keyof PraxisTheme["radii"];
  bordered?: boolean;
  padding?: keyof PraxisTheme["spacing"];
}

export function Surface({
  variant = "surface",
  elevation = "none",
  radius,
  bordered = false,
  padding,
  style,
  children,
  ...rest
}: SurfaceProps) {
  const t = usePraxisTheme();

  const bg =
    variant === "canvas"
      ? t.colors.bgCanvas
      : variant === "elevated"
        ? t.colors.bgElevated
        : variant === "transparent"
          ? "transparent"
          : t.colors.bgSurface;

  const elev = t.elevation[elevation];

  const composed: StyleProp<ViewStyle> = [
    {
      backgroundColor: bg,
      borderRadius: radius ? t.radii[radius] : 0,
      borderWidth: bordered ? 1 : 0,
      borderColor: bordered ? t.colors.borderSubtle : "transparent",
      padding: padding ? t.spacing[padding] : undefined,
      shadowColor: t.colors.shadowColor,
      ...elev,
    },
    style,
  ];

  return (
    <View {...rest} style={composed}>
      {children}
    </View>
  );
}
