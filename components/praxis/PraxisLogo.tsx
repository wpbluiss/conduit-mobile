import React from "react";
import Svg, { Polygon, Polyline, Defs, LinearGradient, Stop } from "react-native-svg";

export interface PraxisLogoProps {
  /** Outer pixel size of the rendered square box. */
  size?: number;
  /** Hex fill for the prism face. Defaults to jewel violet #6D28D9. */
  fill?: string;
  /** Hex for the inner edge highlight. Defaults to electric violet. */
  edge?: string;
  /** Hex for the back-face shadow. Defaults to deeper violet. */
  shadow?: string;
}

/**
 * Praxis Console mark — a single continuous prism in jewel violet.
 *
 * Designed as a placeholder while a final logo is in commission. Reads as
 * one symbolic mark, not a "P" letterform: an upright triangular prism in
 * isometric perspective, with a single inner edge highlighted for depth.
 *
 * The geometry is constructed in a 32×32 viewBox so all the strokes and
 * vertices snap to integer pixels at 32, 48, 56, and 64 px.
 */
export function PraxisLogo({
  size = 56,
  fill = "#6D28D9",
  edge = "#A78BFA",
  shadow = "#4C1D95",
}: PraxisLogoProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      <Defs>
        <LinearGradient id="praxisFace" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={fill} stopOpacity="1" />
          <Stop offset="1" stopColor={shadow} stopOpacity="1" />
        </LinearGradient>
      </Defs>

      {/* Back face (slightly darker, behind the right edge to suggest depth) */}
      <Polygon points="16,4 28,11 28,25 16,32" fill={shadow} />

      {/* Front face — the dominant prism plane */}
      <Polygon points="4,11 16,4 16,32 4,25" fill="url(#praxisFace)" />

      {/* Top plane — the visible cap of the prism */}
      <Polygon points="4,11 16,4 28,11 16,18" fill={edge} opacity="0.55" />

      {/* Inner edge highlight — single stroke from apex to base, the
          identifying line of the mark. */}
      <Polyline
        points="16,4 16,18 16,32"
        stroke={edge}
        strokeWidth={1.25}
        fill="none"
        opacity="0.85"
      />
    </Svg>
  );
}
