import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAppTheme } from '../../contexts/ThemeContext';
import { Fonts, TypeScale } from '../../constants/typography';
import { Spacing } from '../../constants/layout';

interface ComingSoonProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
}

export function ComingSoon({
  icon,
  title,
  subtitle = 'This feature is coming soon.',
}: ComingSoonProps) {
  const { colors } = useAppTheme();
  const router = useRouter();

  return (
    <View style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
      <View style={[styles.iconCircle, { backgroundColor: colors.electricMuted }]}>
        <Ionicons name={icon} size={48} color={colors.electric} />
      </View>
      <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
      <TouchableOpacity
        style={[styles.backButton, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
        onPress={() => router.back()}
        activeOpacity={0.7}
      >
        <Ionicons name="arrow-back" size={18} color={colors.electric} />
        <Text style={[styles.backText, { color: colors.electric }]}>Go Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    ...Fonts.display,
    fontSize: TypeScale.h2,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Fonts.body,
    fontSize: TypeScale.body,
    textAlign: 'center',
    marginBottom: Spacing['2xl'],
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: 12,
    borderWidth: 1,
  },
  backText: {
    ...Fonts.bodySemibold,
    fontSize: TypeScale.body,
  },
});
