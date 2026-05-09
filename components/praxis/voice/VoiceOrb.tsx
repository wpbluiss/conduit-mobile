import React, { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from "react-native-reanimated";
import { usePraxisTheme } from "../../../contexts/PraxisThemeContext";

export type OrbState = "idle" | "listening" | "thinking" | "speaking";

export interface VoiceOrbProps {
  state: OrbState;
  size?: number;
}

export function VoiceOrb({ state, size = 220 }: VoiceOrbProps) {
  const t = usePraxisTheme();

  const scale = useSharedValue(1);
  const intensity = useSharedValue(0.15);

  useEffect(() => {
    if (state === "idle") {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.04, { duration: 1800, easing: Easing.inOut(Easing.quad) }),
          withTiming(1.0, { duration: 1800, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
        false,
      );
      intensity.value = withTiming(0.15, { duration: 600 });
    } else if (state === "listening") {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.12, { duration: 600 }),
          withTiming(0.97, { duration: 600 }),
        ),
        -1,
        true,
      );
      intensity.value = withTiming(0.55, { duration: 400 });
    } else if (state === "thinking") {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.02, { duration: 1200 }),
          withTiming(0.98, { duration: 1200 }),
        ),
        -1,
        true,
      );
      intensity.value = withTiming(0.35, { duration: 400 });
    } else if (state === "speaking") {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.08, { duration: 320 }),
          withTiming(1.0, { duration: 320 }),
        ),
        -1,
        true,
      );
      intensity.value = withTiming(0.7, { duration: 400 });
    }
  }, [state, scale, intensity]);

  const outerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const innerStyle = useAnimatedStyle(() => ({
    opacity: 0.4 + intensity.value * 0.6,
  }));

  const indigo = t.colors.indigo500;

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Animated.View
        style={[
          {
            position: "absolute",
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: t.colors.indigoSoft,
          },
          outerStyle,
        ]}
      />
      <Animated.View
        style={[
          {
            position: "absolute",
            width: size * 0.7,
            height: size * 0.7,
            borderRadius: (size * 0.7) / 2,
            backgroundColor: indigo,
          },
          innerStyle,
        ]}
      />
      <View
        style={{
          width: size * 0.45,
          height: size * 0.45,
          borderRadius: (size * 0.45) / 2,
          backgroundColor: t.isDark ? t.colors.bgSurface : "#FFFFFF",
          shadowColor: indigo,
          shadowOpacity: 0.4,
          shadowRadius: 24,
          shadowOffset: { width: 0, height: 0 },
          elevation: 12,
        }}
      />
    </View>
  );
}
