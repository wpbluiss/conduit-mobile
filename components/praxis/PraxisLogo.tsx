import React from "react";
import { Image } from "react-native";

const MARK = require("../../assets/images/praxis-mark.png");

// Aspect of the source asset (335×512 after bg-strip + crop). Keep this
// in sync if the asset is ever re-exported.
const ASPECT = 335 / 512;

export interface PraxisLogoProps {
  /**
   * Height in pixels of the rendered mark. Width is derived from the
   * asset's aspect ratio (~0.654) so the curve always reads correctly.
   */
  size?: number;
}

/**
 * Praxis Console mark — sculpted violet "P" loop on transparent bg. The
 * gradient + ambient shadow are baked into the asset; consumers just pick
 * a size.
 */
export function PraxisLogo({ size = 56 }: PraxisLogoProps) {
  return (
    <Image
      source={MARK}
      style={{ width: Math.round(size * ASPECT), height: size }}
      resizeMode="contain"
      accessibilityIgnoresInvertColors
    />
  );
}
