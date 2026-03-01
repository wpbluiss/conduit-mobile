import React, { useEffect } from 'react';
import { Text, TextStyle } from 'react-native';
import Animated, { useSharedValue, withTiming, withDelay, Easing, useAnimatedReaction, runOnJS } from 'react-native-reanimated';
import { Colors } from '../../constants/colors';
import { Fonts, TypeScale } from '../../constants/typography';

interface AnimatedNumberProps { value: number; prefix?: string; suffix?: string; duration?: number; delay?: number; decimals?: number; style?: TextStyle; color?: string; size?: 'lg' | 'md' | 'sm'; }

export function AnimatedNumber({ value, prefix = '', suffix = '', duration = 1200, delay: d = 0, decimals = 0, style, color = Colors.textPrimary, size = 'lg' }: AnimatedNumberProps) {
  const av = useSharedValue(0);
  const [text, setText] = React.useState(`${prefix}0${suffix}`);
  const sizeStyles = { lg: { fontSize: TypeScale.statLg, ...Fonts.monoBold }, md: { fontSize: TypeScale.stat, ...Fonts.monoBold }, sm: { fontSize: TypeScale.statSm, ...Fonts.mono } };

  const fmt = React.useCallback((n: number) => {
    const parts = n.toFixed(decimals).split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return `${prefix}${parts.join('.')}${suffix}`;
  }, [prefix, suffix, decimals]);

  useEffect(() => { av.value = withDelay(d, withTiming(value, { duration, easing: Easing.out(Easing.cubic) })); }, [value, d, duration]);
  useAnimatedReaction(() => av.value, (cur) => { runOnJS(setText)(fmt(cur)); }, [fmt]);

  return <Text style={[sizeStyles[size], { color, letterSpacing: -0.5 }, style]}>{text}</Text>;
}
