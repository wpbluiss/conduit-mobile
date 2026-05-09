import React, { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
} from "react-native-reanimated";
import { usePraxisTheme } from "../../../contexts/PraxisThemeContext";

export function StreamingIndicator() {
  const t = usePraxisTheme();

  return (
    <View style={{ flexDirection: "row", gap: 4, padding: 10, alignItems: "center" }}>
      <Dot delay={0} color={t.colors.inkTertiary} />
      <Dot delay={150} color={t.colors.inkTertiary} />
      <Dot delay={300} color={t.colors.inkTertiary} />
    </View>
  );
}

function Dot({ delay, color }: { delay: number; color: string }) {
  const o = useSharedValue(0.25);

  useEffect(() => {
    o.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 350 }),
          withTiming(0.25, { duration: 350 }),
        ),
        -1,
        false,
      ),
    );
  }, [o, delay]);

  const style = useAnimatedStyle(() => ({ opacity: o.value }));

  return (
    <Animated.View
      style={[
        { width: 6, height: 6, borderRadius: 3, backgroundColor: color },
        style,
      ]}
    />
  );
}
