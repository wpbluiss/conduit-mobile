import React from "react";
import Svg, { Path } from "react-native-svg";

// Brand purple = oklch(50% 0.22 290) → sRGB. Computed once, hard-coded so
// we don't take a color-space dep just for one constant.
const BRAND_PURPLE = "#693AD4";

const VIEW_W = 32;
const VIEW_H = 48;
const ASPECT = VIEW_W / VIEW_H;

export interface PraxisLogoProps {
  /** Rendered height in pixels. Width is derived from the 2:3 viewBox. */
  size?: number;
  /** Override the brand purple. */
  fill?: string;
}

/**
 * Praxis Console mark — single-letter curved "P". Rounded geometric stroke
 * tuned to read at 22px (nav header) and 96px (future hero). Placeholder
 * until Luis re-exports the sculpted 3D asset; swap is a one-file change.
 */
export function PraxisLogo({ size = 56, fill = BRAND_PURPLE }: PraxisLogoProps) {
  const w = Math.round(size * ASPECT);
  return (
    <Svg width={w} height={size} viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}>
      {/* Stem from (8,44) up to (8,6), top of bowl out to (18,6), bowl arc
          back to (18,22), close bowl floor to (8,22). Bowl spans ~⅓ of the
          glyph height — proportions readable at 22px through 96px. */}
      <Path
        d="M 8 44 L 8 6 L 18 6 A 8 8 0 0 1 18 22 L 8 22"
        stroke={fill}
        strokeWidth={7}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}
