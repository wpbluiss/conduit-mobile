import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../contexts/ThemeContext';
import { Fonts, TypeScale } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/layout';

interface ErrorToastProps {
  message: string | null;
  onDismiss?: () => void;
}

export function ErrorToast({ message, onDismiss }: ErrorToastProps) {
  const { colors } = useAppTheme();
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (message) {
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true, friction: 8 }),
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();

      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.spring(translateY, { toValue: -100, useNativeDriver: true, friction: 8 }),
          Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
        ]).start(() => onDismiss?.());
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [message]);

  if (!message) return null;

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY }], opacity }]}>
      <Pressable
        onPress={onDismiss}
        style={[styles.toast, { backgroundColor: colors.bgCard, borderColor: colors.danger }]}
      >
        <View style={[styles.iconWrap, { backgroundColor: colors.dangerGlow }]}>
          <Ionicons name="warning-outline" size={16} color={colors.danger} />
        </View>
        <Text style={[styles.text, { color: colors.textPrimary }]} numberOfLines={2}>{message}</Text>
        <Ionicons name="close" size={16} color={colors.textMuted} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: Spacing.md,
    right: Spacing.md,
    zIndex: 9999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    ...Fonts.body,
    fontSize: TypeScale.bodySm,
    flex: 1,
  },
});
