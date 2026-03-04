import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming, withDelay, interpolate } from 'react-native-reanimated';
import { Colors } from '../../constants/colors';
import { useAppTheme } from '../../contexts/ThemeContext';
import { BorderRadius, Spacing } from '../../constants/layout';

interface GlowCardProps { children: React.ReactNode; style?: ViewStyle; glowColor?: string; glowIntensity?: 'subtle' | 'medium' | 'strong'; animated?: boolean; delay?: number; }

export function GlowCard({ children, style, glowColor = Colors.electric, glowIntensity = 'subtle', animated = true, delay = 0 }: GlowCardProps) {
  const { colors, isDark } = useAppTheme();
  const glow = useSharedValue(0);
  React.useEffect(() => {
    if (animated) glow.value = withDelay(delay, withRepeat(withTiming(1, { duration: 2000 }), -1, true));
  }, [animated, delay]);

  const intensityMap = { subtle: { min: 0.06, max: 0.15 }, medium: { min: 0.12, max: 0.3 }, strong: { min: 0.2, max: 0.5 } };
  const { min, max } = intensityMap[glowIntensity];

  const borderStyle = useAnimatedStyle(() => ({
    borderColor: `rgba(14, 165, 233, ${interpolate(glow.value, [0, 1], [min, max])})`,
  }));

  return <Animated.View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.electricBorder }, borderStyle, style]}>{children}</Animated.View>;
}

const styles = StyleSheet.create({
  card: { backgroundColor: Colors.bgCard, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.electricBorder, padding: Spacing.base },
});
