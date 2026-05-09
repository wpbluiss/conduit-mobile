import React from "react";
import { Text as RNText, type TextProps as RNTextProps, type StyleProp, type TextStyle } from "react-native";
import { usePraxisTheme } from "../../contexts/PraxisThemeContext";
import type { PraxisTheme } from "../../constants/praxis-tokens";

type TypographyVariant =
  | "displayXl"
  | "displayLg"
  | "displayMd"
  | "displaySm"
  | "bodyLg"
  | "body"
  | "bodySm"
  | "caption";

type TextWeight = "regular" | "medium" | "semibold" | "bold";
type TextFamily = "display" | "body" | "mono";
type TextTone = "primary" | "secondary" | "tertiary" | "inverse" | "indigo" | "ember" | "danger" | "success";

export interface TextProps extends RNTextProps {
  variant?: TypographyVariant;
  family?: TextFamily;
  weight?: TextWeight;
  tone?: TextTone;
  italic?: boolean;
  uppercase?: boolean;
  align?: TextStyle["textAlign"];
}

function resolveFont(t: PraxisTheme, family: TextFamily, weight: TextWeight, italic: boolean): string {
  if (family === "mono") {
    return weight === "regular" ? t.fonts.mono : t.fonts.monoMedium;
  }
  if (family === "display") {
    if (italic) return t.fonts.displayItalic;
    if (weight === "bold") return t.fonts.displayBold;
    if (weight === "semibold") return t.fonts.displaySemibold;
    return t.fonts.display;
  }
  // body
  if (weight === "bold") return t.fonts.bodyBold;
  if (weight === "semibold") return t.fonts.bodySemibold;
  if (weight === "medium") return t.fonts.bodyMedium;
  return t.fonts.body;
}

function resolveTone(t: PraxisTheme, tone: TextTone): string {
  switch (tone) {
    case "primary":
      return t.colors.inkPrimary;
    case "secondary":
      return t.colors.inkSecondary;
    case "tertiary":
      return t.colors.inkTertiary;
    case "inverse":
      return t.colors.inkInverse;
    case "indigo":
      return t.colors.indigo500;
    case "ember":
      return t.colors.ember;
    case "danger":
      return t.colors.danger;
    case "success":
      return t.colors.success;
  }
}

export function Text({
  variant = "body",
  family,
  weight = "regular",
  tone = "primary",
  italic = false,
  uppercase = false,
  align,
  style,
  children,
  ...rest
}: TextProps) {
  const t = usePraxisTheme();

  const inferredFamily: TextFamily =
    family ?? (variant.startsWith("display") || variant === "caption" ? (variant === "caption" ? "body" : "display") : "body");

  const fontFamily = resolveFont(t, inferredFamily, weight, italic);
  const color = resolveTone(t, tone);
  const scale = t.typeScale[variant];

  const composed: StyleProp<TextStyle> = [
    {
      fontFamily,
      color,
      textAlign: align,
      textTransform: uppercase || variant === "caption" ? "uppercase" : "none",
      ...scale,
    },
    style,
  ];

  return (
    <RNText {...rest} style={composed}>
      {children}
    </RNText>
  );
}
