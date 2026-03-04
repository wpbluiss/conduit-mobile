// ── Theme Colors Interface ──
export interface ThemeColors {
  // Backgrounds
  bgVoid: string;
  bgPrimary: string;
  bgCard: string;
  bgElevated: string;
  bgInput: string;

  // Brand / Accent
  electric: string;
  electricGlow: string;
  electricMuted: string;
  electricBorder: string;
  cyan: string;
  cyanGlow: string;

  // Semantic
  success: string;
  successGlow: string;
  warning: string;
  warningGlow: string;
  danger: string;
  dangerGlow: string;

  // Text
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textDisabled: string;

  // Borders
  border: string;
  borderLight: string;
  borderElectric: string;

  // Gradients
  gradientElectric: readonly [string, string];
  gradientElectricDiag: readonly [string, string];
  gradientDark: readonly [string, string];

  // Effects
  shadowElectric: string;
  shadowDark: string;
  overlay: string;
}

// ── Dark Theme ──
export const DarkColors: ThemeColors = {
  bgVoid: '#030712',
  bgPrimary: '#0a0f1e',
  bgCard: '#111827',
  bgElevated: '#1a2235',
  bgInput: '#0f172a',

  electric: '#0EA5E9',
  electricGlow: '#38BDF8',
  electricMuted: 'rgba(14, 165, 233, 0.15)',
  electricBorder: 'rgba(14, 165, 233, 0.12)',
  cyan: '#06B6D4',
  cyanGlow: 'rgba(6, 182, 212, 0.2)',

  success: '#10B981',
  successGlow: 'rgba(16, 185, 129, 0.15)',
  warning: '#F59E0B',
  warningGlow: 'rgba(245, 158, 11, 0.15)',
  danger: '#EF4444',
  dangerGlow: 'rgba(239, 68, 68, 0.15)',

  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#475569',
  textDisabled: '#334155',

  border: 'rgba(148, 163, 184, 0.08)',
  borderLight: 'rgba(148, 163, 184, 0.15)',
  borderElectric: 'rgba(14, 165, 233, 0.25)',

  gradientElectric: ['#0EA5E9', '#06B6D4'] as const,
  gradientElectricDiag: ['#0EA5E9', '#3B82F6'] as const,
  gradientDark: ['#0a0f1e', '#030712'] as const,

  shadowElectric: 'rgba(14, 165, 233, 0.25)',
  shadowDark: 'rgba(0, 0, 0, 0.5)',
  overlay: 'rgba(3, 7, 18, 0.7)',
};

// ── Light Theme ──
export const LightColors: ThemeColors = {
  bgVoid: '#F8FAFC',
  bgPrimary: '#FFFFFF',
  bgCard: '#F1F5F9',
  bgElevated: '#E2E8F0',
  bgInput: '#F1F5F9',

  electric: '#0284C7',
  electricGlow: '#0EA5E9',
  electricMuted: 'rgba(2, 132, 199, 0.10)',
  electricBorder: 'rgba(2, 132, 199, 0.15)',
  cyan: '#0891B2',
  cyanGlow: 'rgba(8, 145, 178, 0.12)',

  success: '#059669',
  successGlow: 'rgba(5, 150, 105, 0.10)',
  warning: '#D97706',
  warningGlow: 'rgba(217, 119, 6, 0.10)',
  danger: '#DC2626',
  dangerGlow: 'rgba(220, 38, 38, 0.10)',

  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  textDisabled: '#CBD5E1',

  border: 'rgba(15, 23, 42, 0.08)',
  borderLight: 'rgba(15, 23, 42, 0.12)',
  borderElectric: 'rgba(2, 132, 199, 0.25)',

  gradientElectric: ['#0284C7', '#0891B2'] as const,
  gradientElectricDiag: ['#0284C7', '#2563EB'] as const,
  gradientDark: ['#FFFFFF', '#F8FAFC'] as const,

  shadowElectric: 'rgba(2, 132, 199, 0.15)',
  shadowDark: 'rgba(0, 0, 0, 0.08)',
  overlay: 'rgba(248, 250, 252, 0.7)',
};

// ── Legacy export (defaults to dark) — screens will migrate to useTheme() ──
export const Colors = DarkColors;

export const StatusColors = {
  new: DarkColors.electric,
  contacted: DarkColors.warning,
  booked: DarkColors.success,
  lost: DarkColors.danger,
  active: DarkColors.success,
  inactive: DarkColors.textMuted,
} as const;

export type StatusType = keyof typeof StatusColors;
