import React, { useEffect } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { useAppTheme } from '../../contexts/ThemeContext';
import { BorderRadius } from '../../constants/layout';

interface ShimmerSkeletonProps {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function ShimmerSkeleton({
  width,
  height,
  borderRadius = BorderRadius.md,
  style,
}: ShimmerSkeletonProps) {
  const { colors, isDark } = useAppTheme();
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(withTiming(1, { duration: 1200 }), -1, true);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 1], [0.3, 0.7]),
  }));

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: isDark ? colors.bgElevated : colors.bgCard,
        },
        animatedStyle,
        style,
      ]}
    />
  );
}
