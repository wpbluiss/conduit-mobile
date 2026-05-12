import React from "react";
import { Image } from "react-native";

const MARK = require("../../assets/images/praxis-mark.png");

// Natural dimensions of the cleaned curved-P asset (632×961 RGBA, alpha
// background). Aspect ≈ 0.658; keep in lockstep with the file on disk.
const SOURCE_W = 632;
const SOURCE_H = 961;
const ASPECT = SOURCE_W / SOURCE_H;

export interface PraxisLogoProps {
  /**
   * Rendered height in pixels. Width is derived from the natural asset
   * aspect so the mark never stretches. Defaults to 64 — readable as a
   * brand mark in any header, hero, or chip.
   */
  size?: number;
  /** Reserved for future tinting; the bundled asset is pre-shaded. */
  fill?: string;
}

/**
 * Praxis Console mark — cleaned curved-P export from the brand
 * commission. Single transparent PNG; we plot it via react-native Image
 * (expo-image not yet wired up in this repo). Same module surface as the
 * prior SVG version so existing call sites — ChatTopBar, WelcomeState,
 * sign-in/up chips — keep working without churn.
 */
export function PraxisLogo({ size = 64 }: PraxisLogoProps) {
  return (
    <Image
      source={MARK}
      style={{ width: Math.round(size * ASPECT), height: size }}
      resizeMode="contain"
      accessibilityIgnoresInvertColors
    />
  );
}
