import React from 'react';
import { Text, StyleSheet, Pressable, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Colors } from '../../constants/colors';
import { useTheme } from '../../contexts/ThemeContext';
import { Fonts, TypeScale } from '../../constants/typography';
import { BorderRadius, Spacing } from '../../constants/layout';
import { Springs } from '../../constants/animations';

const AP = Animated.createAnimatedComponent(Pressable);
type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps { title: string; onPress: () => void; variant?: Variant; size?: 'sm' | 'md' | 'lg'; loading?: boolean; disabled?: boolean; icon?: React.ReactNode; style?: ViewStyle; textStyle?: TextStyle; fullWidth?: boolean; }

export function Button({ title, onPress, variant = 'primary', size = 'md', loading = false, disabled = false, icon, style, textStyle, fullWidth = false }: ButtonProps) {
  const { colors, isDark } = useTheme();
  const scale = useSharedValue(1);
  const aStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const pressIn = () => { scale.value = withSpring(0.96, Springs.snappy); };
  const pressOut = () => { scale.value = withSpring(1, Springs.snappy); };
  const press = () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress(); };

  const sizes = { sm: { h: 36, px: 12, fs: TypeScale.bodySm }, md: { h: 46, px: 20, fs: TypeScale.body }, lg: { h: 54, px: 24, fs: TypeScale.bodyLg } };
  const { h, px, fs } = sizes[size];
  const off = disabled || loading;

  const content = loading
    ? <ActivityIndicator size="small" color={variant === 'primary' ? '#fff' : Colors.electric} />
    : <>{icon}<Text style={[s.txt, { fontSize: fs }, variant === 'primary' && { color: '#fff' }, variant === 'secondary' && { color: Colors.electric }, variant === 'ghost' && { color: Colors.textSecondary }, variant === 'danger' && { color: Colors.danger }, off && { color: Colors.textDisabled }, textStyle]}>{title}</Text></>;

  return (
    <AP onPressIn={pressIn} onPressOut={pressOut} onPress={press} disabled={off} style={[aStyle, fullWidth && { width: '100%' }]}>
      {variant === 'primary' ? (
        <LinearGradient colors={off ? ['#1e3a5f', '#1a2e4a'] : ['#0EA5E9', '#0284C7']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={[s.base, { height: h, paddingHorizontal: px }, !off && s.shadow, style]}>{content}</LinearGradient>
      ) : (
        <Animated.View style={[s.base, { height: h, paddingHorizontal: px }, variant === 'secondary' && [s.sec, { borderColor: colors.electricBorder }], variant === 'ghost' && s.ghost, off && { opacity: 0.4 }, style]}>{content}</Animated.View>
      )}
    </AP>
  );
}

const s = StyleSheet.create({
  base: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: BorderRadius.lg, gap: Spacing.sm },
  shadow: { shadowColor: Colors.electric, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
  sec: { borderWidth: 1, borderColor: Colors.borderElectric, backgroundColor: 'transparent' },
  ghost: { backgroundColor: 'transparent' },
  txt: { ...Fonts.bodySemibold, letterSpacing: 0.2 },
});
