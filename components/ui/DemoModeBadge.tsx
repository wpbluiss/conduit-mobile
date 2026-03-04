import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAppTheme } from '../../contexts/ThemeContext';
import { Fonts, TypeScale } from '../../constants/typography';
import { Spacing } from '../../constants/layout';

export function DemoModeBadge() {
  const { colors } = useAppTheme();

  return (
    <View style={[styles.badge, { backgroundColor: colors.warningGlow, borderColor: colors.warning }]}>
      <Text style={[styles.text, { color: colors.warning }]}>Guest Mode</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: 56,
    right: Spacing.base,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 20,
    borderWidth: 1,
    zIndex: 100,
  },
  text: {
    ...Fonts.bodySemibold,
    fontSize: TypeScale.tiny,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
