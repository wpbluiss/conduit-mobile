import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../contexts/ThemeContext';
import { Fonts, TypeScale } from '../../constants/typography';
import { Spacing } from '../../constants/layout';

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  message: string;
  description?: string;
  ctaLabel?: string;
  onCtaPress?: () => void;
}

export function EmptyState({
  icon,
  message,
  description,
  ctaLabel,
  onCtaPress,
}: EmptyStateProps) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.container}>
      <View style={[styles.iconCircle, { backgroundColor: colors.electricMuted }]}>
        <Ionicons name={icon} size={40} color={colors.electric} />
      </View>
      <Text style={[styles.message, { color: colors.textPrimary }]}>{message}</Text>
      {description && (
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          {description}
        </Text>
      )}
      {ctaLabel && onCtaPress && (
        <TouchableOpacity
          style={[styles.cta, { backgroundColor: colors.electric }]}
          onPress={onCtaPress}
          activeOpacity={0.7}
        >
          <Text style={[styles.ctaText, { color: '#FFFFFF' }]}>{ctaLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing['4xl'],
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  message: {
    ...Fonts.display,
    fontSize: TypeScale.h3,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  description: {
    ...Fonts.body,
    fontSize: TypeScale.bodySm,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  cta: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: 12,
  },
  ctaText: {
    ...Fonts.bodySemibold,
    fontSize: TypeScale.body,
  },
});
