import { Platform } from 'react-native';
const isIOS = Platform.OS === 'ios';

export const Fonts = {
  display: { fontFamily: isIOS ? 'System' : 'sans-serif', fontWeight: '700' as const },
  displayBold: { fontFamily: isIOS ? 'System' : 'sans-serif', fontWeight: '800' as const },
  body: { fontFamily: isIOS ? 'System' : 'sans-serif', fontWeight: '400' as const },
  bodyMedium: { fontFamily: isIOS ? 'System' : 'sans-serif-medium', fontWeight: '500' as const },
  bodySemibold: { fontFamily: isIOS ? 'System' : 'sans-serif-medium', fontWeight: '600' as const },
  mono: { fontFamily: isIOS ? 'Menlo' : 'monospace', fontWeight: '400' as const },
  monoBold: { fontFamily: isIOS ? 'Menlo' : 'monospace', fontWeight: '700' as const },
};

export const TypeScale = {
  hero: 36, h1: 28, h2: 22, h3: 18, h4: 16,
  bodyLg: 16, body: 14, bodySm: 13, caption: 12, tiny: 10,
  statLg: 32, stat: 24, statSm: 18,
} as const;

export const LineHeight = { tight: 1.1, normal: 1.4, relaxed: 1.6 } as const;
export const LetterSpacing = { tight: -0.5, normal: 0, wide: 0.5, wider: 1.5 } as const;

export const TextStyles = {
  hero: { ...Fonts.displayBold, fontSize: TypeScale.hero, letterSpacing: LetterSpacing.tight, lineHeight: TypeScale.hero * LineHeight.tight },
  h1: { ...Fonts.display, fontSize: TypeScale.h1, letterSpacing: LetterSpacing.tight, lineHeight: TypeScale.h1 * LineHeight.tight },
  h2: { ...Fonts.display, fontSize: TypeScale.h2, lineHeight: TypeScale.h2 * LineHeight.tight },
  h3: { ...Fonts.bodySemibold, fontSize: TypeScale.h3, lineHeight: TypeScale.h3 * LineHeight.normal },
  body: { ...Fonts.body, fontSize: TypeScale.body, lineHeight: TypeScale.body * LineHeight.normal },
  bodySm: { ...Fonts.body, fontSize: TypeScale.bodySm, lineHeight: TypeScale.bodySm * LineHeight.normal },
  caption: { ...Fonts.body, fontSize: TypeScale.caption, lineHeight: TypeScale.caption * LineHeight.normal },
  stat: { ...Fonts.monoBold, fontSize: TypeScale.statLg, letterSpacing: LetterSpacing.tight },
  label: { ...Fonts.bodyMedium, fontSize: TypeScale.caption, letterSpacing: LetterSpacing.wide, textTransform: 'uppercase' as const },
} as const;
