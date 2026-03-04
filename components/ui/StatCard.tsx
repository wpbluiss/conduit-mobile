import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import Animated, { FadeInUp, useAnimatedStyle, useSharedValue, withRepeat, withTiming, interpolate } from 'react-native-reanimated';
import { Colors } from '../../constants/colors';
import { useAppTheme } from '../../contexts/ThemeContext';
import { Fonts, TypeScale } from '../../constants/typography';
import { BorderRadius, Spacing } from '../../constants/layout';
import { Stagger } from '../../constants/animations';
import { AnimatedNumber } from './AnimatedNumber';

interface StatCardProps { label: string; value: number; prefix?: string; suffix?: string; decimals?: number; icon?: React.ReactNode; trend?: { value: number; direction: 'up' | 'down' }; accentColor?: string; index?: number; style?: ViewStyle; }

export function StatCard({ label, value, prefix = '', suffix = '', decimals = 0, icon, trend, accentColor = Colors.electric, index = 0, style }: StatCardProps) {
  const { colors, isDark } = useAppTheme();
  const enterDelay = index * Stagger.fast;
  return (
    <Animated.View entering={FadeInUp.delay(enterDelay).springify().damping(18).stiffness(140)} style={[st.card, { backgroundColor: colors.bgCard, borderColor: colors.electricBorder }, style]}>
      <View style={[st.accent, { backgroundColor: accentColor }]} />
      <View style={st.header}>
        {icon && <View style={st.iconWrap}>{icon}</View>}
        <Text style={st.label}>{label}</Text>
      </View>
      <View style={st.valueRow}>
        <AnimatedNumber value={value} prefix={prefix} suffix={suffix} decimals={decimals} delay={enterDelay + 200} size="md" color={Colors.textPrimary} />
        {trend && (
          <View style={[st.trendBadge, { backgroundColor: trend.direction === 'up' ? Colors.successGlow : Colors.dangerGlow }]}>
            <Text style={[st.trendText, { color: trend.direction === 'up' ? Colors.success : Colors.danger }]}>{trend.direction === 'up' ? '↑' : '↓'} {Math.abs(trend.value)}%</Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

const st = StyleSheet.create({
  card: { flex: 1, backgroundColor: Colors.bgCard, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.electricBorder, padding: Spacing.md, minHeight: 100, justifyContent: 'space-between', overflow: 'hidden' },
  accent: { position: 'absolute', top: 0, left: 0, right: 0, height: 2, borderTopLeftRadius: BorderRadius.lg, borderTopRightRadius: BorderRadius.lg },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginBottom: Spacing.sm },
  iconWrap: { width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
  label: { ...Fonts.bodyMedium, fontSize: TypeScale.caption, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  valueRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  trendBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.sm },
  trendText: { ...Fonts.mono, fontSize: TypeScale.tiny, fontWeight: '600' },
});
