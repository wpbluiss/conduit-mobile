import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, StatusColors, StatusType } from '../../constants/colors';
import { useAppTheme } from '../../contexts/ThemeContext';
import { Fonts, TypeScale } from '../../constants/typography';
import { BorderRadius, Spacing } from '../../constants/layout';

const labels: Record<StatusType, string> = { new: 'New', contacted: 'Contacted', booked: 'Booked', lost: 'Lost', active: 'Active', inactive: 'Inactive' };

export function Badge({ status, label, size = 'sm' }: { status: StatusType; label?: string; size?: 'sm' | 'md' }) {
  const { colors, isDark } = useAppTheme();
  const color = StatusColors[status];
  const sm = size === 'sm';
  return (
    <View style={[st.badge, { backgroundColor: `${color}15`, paddingHorizontal: sm ? Spacing.sm : Spacing.md, paddingVertical: sm ? 2 : 4 }]}>
      <View style={[st.dot, { backgroundColor: color, width: sm ? 6 : 8, height: sm ? 6 : 8 }]} />
      <Text style={[st.label, { color, fontSize: sm ? TypeScale.tiny : TypeScale.caption }]}>{label || labels[status]}</Text>
    </View>
  );
}

const st = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, borderRadius: BorderRadius.full },
  dot: { borderRadius: BorderRadius.full },
  label: { ...Fonts.bodyMedium, letterSpacing: 0.3 },
});
