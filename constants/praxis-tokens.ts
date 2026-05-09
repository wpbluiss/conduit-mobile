// ──────────────────────────────────────────────────────────────────────────
// Praxis Console Mobile — Design Tokens
// Single source of truth. Mirrors conduitai.io web design system, mobile-tuned.
// ──────────────────────────────────────────────────────────────────────────

export type ColorScheme = "light" | "dark";

export interface PraxisColors {
  // Backgrounds
  bgCanvas: string;
  bgSurface: string;
  bgElevated: string;

  // Ink (text)
  inkPrimary: string;
  inkSecondary: string;
  inkTertiary: string;
  inkInverse: string;

  // Borders
  borderSubtle: string;
  borderDefault: string;
  borderStrong: string;

  // Indigo (accent / CTA)
  indigo50: string;
  indigo100: string;
  indigo200: string;
  indigo300: string;
  indigo500: string;
  indigo700: string;
  indigoSoft: string; // 14% — accent fill

  // Ember (celebration only)
  ember: string;

  // Semantic
  success: string;
  warning: string;
  danger: string;

  // Effects
  shadowColor: string;
  overlay: string;
  scrim: string;
}

const lightColors: PraxisColors = {
  bgCanvas: "#FAFAF7",
  bgSurface: "#FFFFFF",
  bgElevated: "#F4F2EC",

  inkPrimary: "#0F1115",
  inkSecondary: "#4A5160",
  inkTertiary: "#7B8194",
  inkInverse: "#FAFAF7",

  borderSubtle: "#EDE9E2",
  borderDefault: "#E0DACF",
  borderStrong: "#C7C0B3",

  indigo50: "#EEF0FF",
  indigo100: "#E0E3FE",
  indigo200: "#C5CBFC",
  indigo300: "#A8AFFB",
  indigo500: "#5B63E8",
  indigo700: "#3D44C2",
  indigoSoft: "rgba(91, 99, 232, 0.10)",

  ember: "#D67817",

  success: "#0E8A55",
  warning: "#B7791F",
  danger: "#C8412B",

  shadowColor: "rgba(15, 17, 21, 0.10)",
  overlay: "rgba(15, 17, 21, 0.5)",
  scrim: "rgba(250, 250, 247, 0.85)",
};

const darkColors: PraxisColors = {
  bgCanvas: "#0E0E10",
  bgSurface: "#16161A",
  bgElevated: "#1F1F25",

  inkPrimary: "#F2F0EB",
  inkSecondary: "#B6B3AA",
  inkTertiary: "#7E7B72",
  inkInverse: "#0E0E10",

  borderSubtle: "#232328",
  borderDefault: "#2D2D33",
  borderStrong: "#3D3D44",

  indigo50: "#1A1A30",
  indigo100: "#252548",
  indigo200: "#3D4078",
  indigo300: "#A8AFFB",
  indigo500: "#6E76EE",
  indigo700: "#5B63E8",
  indigoSoft: "rgba(168, 175, 251, 0.14)",

  ember: "#E08F31",

  success: "#3DD68C",
  warning: "#E0A95B",
  danger: "#E5715B",

  shadowColor: "rgba(0, 0, 0, 0.5)",
  overlay: "rgba(0, 0, 0, 0.6)",
  scrim: "rgba(14, 14, 16, 0.85)",
};

export const palettes = { light: lightColors, dark: darkColors } as const;

// ── Typography ────────────────────────────────────────────────────────────
// Loaded via expo-font in app/_layout.tsx
export const fonts = {
  display: "Fraunces_500Medium",
  displaySemibold: "Fraunces_600SemiBold",
  displayBold: "Fraunces_700Bold",
  displayItalic: "Fraunces_500Medium_Italic",
  body: "Inter_400Regular",
  bodyMedium: "Inter_500Medium",
  bodySemibold: "Inter_600SemiBold",
  bodyBold: "Inter_700Bold",
  mono: "JetBrainsMono_400Regular",
  monoMedium: "JetBrainsMono_500Medium",
} as const;

// Mobile-tuned scale
export const typeScale = {
  displayXl: { fontSize: 32, lineHeight: 40 },
  displayLg: { fontSize: 26, lineHeight: 32 },
  displayMd: { fontSize: 22, lineHeight: 28 },
  displaySm: { fontSize: 18, lineHeight: 24 },
  bodyLg: { fontSize: 17, lineHeight: 26 },
  body: { fontSize: 15, lineHeight: 22 },
  bodySm: { fontSize: 13, lineHeight: 18 },
  caption: { fontSize: 11, lineHeight: 16, letterSpacing: 0.88 }, // 0.08em ≈ 0.88
} as const;

// ── Spacing (4-base scale) ────────────────────────────────────────────────
export const spacing = {
  px: 1,
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  "2xl": 32,
  "3xl": 48,
  "4xl": 64,
} as const;

// ── Radii ────────────────────────────────────────────────────────────────
export const radii = {
  none: 0,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 28,
  full: 9999,
} as const;

// ── Elevation / shadows ──────────────────────────────────────────────────
export const elevation = {
  none: {
    shadowOpacity: 0,
    elevation: 0,
  },
  subtle: {
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  default: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 4,
  },
  floating: {
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 28,
    elevation: 12,
  },
} as const;

// ── Motion ───────────────────────────────────────────────────────────────
export const motion = {
  snappy: 150,
  default: 220,
  cinematic: 400,
  spring: {
    snappy: { damping: 18, stiffness: 220, mass: 0.6 },
    default: { damping: 22, stiffness: 160, mass: 0.9 },
    cinematic: { damping: 26, stiffness: 110, mass: 1.2 },
  },
} as const;

// ── Layout ───────────────────────────────────────────────────────────────
export const layout = {
  screenPaddingX: 20,
  screenPaddingY: 16,
  tabBarHeight: 64,
  composerHeight: 56,
  headerHeight: 56,
  iconSize: { sm: 16, md: 20, lg: 24, xl: 28, "2xl": 32 },
} as const;

// ── Theme bundle ─────────────────────────────────────────────────────────
export interface PraxisTheme {
  scheme: ColorScheme;
  colors: PraxisColors;
  fonts: typeof fonts;
  typeScale: typeof typeScale;
  spacing: typeof spacing;
  radii: typeof radii;
  elevation: typeof elevation;
  motion: typeof motion;
  layout: typeof layout;
  isDark: boolean;
}

export function makeTheme(scheme: ColorScheme): PraxisTheme {
  return {
    scheme,
    colors: palettes[scheme],
    fonts,
    typeScale,
    spacing,
    radii,
    elevation,
    motion,
    layout,
    isDark: scheme === "dark",
  };
}

// Default exports for non-themed callers
export const lightTheme = makeTheme("light");
export const darkTheme = makeTheme("dark");
