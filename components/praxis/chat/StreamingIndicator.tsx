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
import { Text } from "../Text";
import { EMPLOYEE_SURFACES } from "../../../lib/conduit/surfaces";
import type { EmployeeId } from "../../../lib/conduit/employees";
import { useReduceMotion } from "../../../hooks/useReduceMotion";

export interface StreamingIndicatorProps {
  /** When set, shows status text + accent dot ahead of the animated dots. */
  label?: string | null;
  /** Drives the leading accent dot color; falls back to ink-tertiary. */
  employee?: EmployeeId | "team" | "atlas" | string | null;
}

export function StreamingIndicator({ label, employee }: StreamingIndicatorProps) {
  const t = usePraxisTheme();
  const reduceMotion = useReduceMotion();

  const accent = (() => {
    if (!employee || employee === "team") return t.colors.inkTertiary;
    const cfg = EMPLOYEE_SURFACES[employee as EmployeeId];
    return cfg?.accentColor ?? t.colors.inkTertiary;
  })();

  return (
    <View
      style={{
        flexDirection: "row",
        gap: 8,
        paddingHorizontal: 14,
        paddingVertical: 10,
        alignItems: "center",
      }}
    >
      {label ? (
        <View
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: accent,
          }}
        />
      ) : null}
      {label ? (
        <Text
          variant="bodySm"
          tone="secondary"
          style={{ letterSpacing: 0.1 }}
        >
          {label}
        </Text>
      ) : null}
      <View style={{ flexDirection: "row", gap: 4 }}>
        <Dot delay={0} color={t.colors.inkTertiary} reduceMotion={reduceMotion} />
        <Dot delay={150} color={t.colors.inkTertiary} reduceMotion={reduceMotion} />
        <Dot delay={300} color={t.colors.inkTertiary} reduceMotion={reduceMotion} />
      </View>
    </View>
  );
}

function Dot({ delay, color, reduceMotion }: { delay: number; color: string; reduceMotion: boolean }) {
  const o = useSharedValue(0.25);

  useEffect(() => {
    if (reduceMotion) {
      o.value = withTiming(0.6, { duration: 0 });
      return;
    }
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
  }, [o, delay, reduceMotion]);

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
