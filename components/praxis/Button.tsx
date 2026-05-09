import React from "react";
import {
  Pressable,
  ActivityIndicator,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import * as Haptics from "expo-haptics";
import { usePraxisTheme } from "../../contexts/PraxisThemeContext";
import { Text } from "./Text";

type ButtonVariant = "primary" | "secondary" | "ghost" | "link" | "danger";
type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends Omit<PressableProps, "style" | "children"> {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  fullWidth?: boolean;
  hapticOnPress?: boolean;
  style?: StyleProp<ViewStyle>;
}

const SIZE_MAP: Record<ButtonSize, { paddingH: number; paddingV: number; height: number }> = {
  sm: { paddingH: 12, paddingV: 8, height: 36 },
  md: { paddingH: 16, paddingV: 10, height: 44 },
  lg: { paddingH: 20, paddingV: 14, height: 52 },
};

export function Button({
  label,
  variant = "primary",
  size = "md",
  loading = false,
  iconLeft,
  iconRight,
  fullWidth,
  hapticOnPress = true,
  disabled,
  style,
  onPress,
  ...rest
}: ButtonProps) {
  const t = usePraxisTheme();
  const dims = SIZE_MAP[size];
  const isDisabled = disabled || loading;

  const palette = ((): { bg: string; bgPressed: string; ink: string; border: string } => {
    switch (variant) {
      case "primary":
        return {
          bg: t.colors.indigo500,
          bgPressed: t.colors.indigo700,
          ink: "#FFFFFF",
          border: "transparent",
        };
      case "secondary":
        return {
          bg: t.colors.bgSurface,
          bgPressed: t.colors.bgElevated,
          ink: t.colors.inkPrimary,
          border: t.colors.borderDefault,
        };
      case "ghost":
        return {
          bg: "transparent",
          bgPressed: t.colors.indigoSoft,
          ink: t.colors.inkPrimary,
          border: "transparent",
        };
      case "link":
        return {
          bg: "transparent",
          bgPressed: "transparent",
          ink: t.colors.indigo500,
          border: "transparent",
        };
      case "danger":
        return {
          bg: t.colors.danger,
          bgPressed: t.colors.danger,
          ink: "#FFFFFF",
          border: "transparent",
        };
    }
  })();

  const handlePress: PressableProps["onPress"] = (e) => {
    if (hapticOnPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    onPress?.(e);
  };

  return (
    <Pressable
      {...rest}
      disabled={isDisabled}
      onPress={handlePress}
      style={({ pressed }) => [
        {
          height: dims.height,
          paddingHorizontal: variant === "link" ? 0 : dims.paddingH,
          paddingVertical: variant === "link" ? 0 : dims.paddingV,
          borderRadius: variant === "link" ? 0 : t.radii.md,
          borderWidth: variant === "secondary" ? 1 : 0,
          borderColor: palette.border,
          backgroundColor: pressed ? palette.bgPressed : palette.bg,
          opacity: isDisabled ? 0.5 : 1,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          alignSelf: fullWidth ? "stretch" : "flex-start",
          gap: 8,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={palette.ink} />
      ) : (
        <>
          {iconLeft ? <View>{iconLeft}</View> : null}
          <Text
            variant={size === "lg" ? "bodyLg" : "body"}
            weight="medium"
            family="body"
            style={{ color: palette.ink, ...(variant === "link" ? { textDecorationLine: "underline" } : null) }}
          >
            {label}
          </Text>
          {iconRight ? <View>{iconRight}</View> : null}
        </>
      )}
    </Pressable>
  );
}
