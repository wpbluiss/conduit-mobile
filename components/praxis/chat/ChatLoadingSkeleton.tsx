import React, { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { usePraxisTheme } from "../../../contexts/PraxisThemeContext";
import { useReduceMotion } from "../../../hooks/useReduceMotion";

/**
 * Three rows of subtly pulsing placeholders for chat messages while we
 * fetch the conversation. Matches bubble geometry so the layout doesn't
 * jump when real content lands.
 */
export function ChatLoadingSkeleton() {
  const reduceMotion = useReduceMotion();
  const pulse = useSharedValue(0.3);

  useEffect(() => {
    if (reduceMotion) {
      pulse.value = withTiming(0.5, { duration: 0 });
      return;
    }
    pulse.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 700 }),
        withTiming(0.3, { duration: 700 }),
      ),
      -1,
      false,
    );
  }, [pulse, reduceMotion]);

  return (
    <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 16 }}>
      <SkeletonBubble pulse={pulse} side="left" widthPct={0.7} />
      <SkeletonBubble pulse={pulse} side="right" widthPct={0.55} />
      <SkeletonBubble pulse={pulse} side="left" widthPct={0.8} />
    </View>
  );
}

function SkeletonBubble({
  pulse,
  side,
  widthPct,
}: {
  pulse: ReturnType<typeof useSharedValue<number>>;
  side: "left" | "right";
  widthPct: number;
}) {
  const t = usePraxisTheme();
  const pulseStyle = useAnimatedStyle(() => ({ opacity: pulse.value }));

  return (
    <View
      style={{
        flexDirection: "row",
        marginBottom: 12,
        justifyContent: side === "right" ? "flex-end" : "flex-start",
        alignItems: "flex-start",
        gap: 10,
      }}
    >
      {side === "left" ? (
        <Animated.View
          style={[
            {
              width: 30,
              height: 30,
              borderRadius: 15,
              backgroundColor: t.colors.bgElevated,
            },
            pulseStyle,
          ]}
        />
      ) : null}
      <Animated.View
        style={[
          {
            width: `${widthPct * 100}%`,
            height: 56,
            borderRadius: t.radii.lg,
            backgroundColor: t.colors.bgElevated,
          },
          pulseStyle,
        ]}
      />
    </View>
  );
}
