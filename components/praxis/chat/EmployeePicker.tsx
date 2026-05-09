import React, { useEffect } from "react";
import { View, Pressable, ScrollView } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
  interpolate,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { usePraxisTheme } from "../../../contexts/PraxisThemeContext";
import { Text } from "../Text";
import { EmployeeAvatar } from "../EmployeeAvatar";
import { EMPLOYEE_LIST, type EmployeeId } from "../../../lib/conduit/employees";

export interface EmployeePickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (id: EmployeeId | "team") => void;
}

export function EmployeePicker({ open, onClose, onSelect }: EmployeePickerProps) {
  const t = usePraxisTheme();
  const insets = useSafeAreaInsets();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = open
      ? withSpring(1, { damping: 20, stiffness: 220, mass: 0.7 })
      : withTiming(0, { duration: 200, easing: Easing.out(Easing.cubic) });
  }, [open, progress]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(progress.value, [0, 1], [400, 0]),
      },
    ],
  }));
  const scrimStyle = useAnimatedStyle(() => ({
    opacity: progress.value * 0.55,
  }));

  const handle = (id: EmployeeId | "team") => {
    Haptics.selectionAsync().catch(() => {});
    onSelect(id);
    onClose();
  };

  return (
    <View
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 60,
        pointerEvents: open ? "auto" : "none",
      }}
    >
      <Animated.View
        style={[
          {
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "#000",
          },
          scrimStyle,
        ]}
      >
        <Pressable
          onPress={onClose}
          style={{ width: "100%", height: "100%" }}
        />
      </Animated.View>

      <Animated.View
        style={[
          {
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: t.colors.bgSurface,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            borderTopWidth: 0.5,
            borderTopColor: t.colors.borderSubtle,
            paddingBottom: Math.max(insets.bottom, 12),
            paddingTop: 8,
            maxHeight: "70%",
          },
          sheetStyle,
        ]}
      >
        <View
          style={{
            alignItems: "center",
            paddingTop: 4,
            paddingBottom: 10,
          }}
        >
          <View
            style={{
              width: 40,
              height: 4,
              borderRadius: 2,
              backgroundColor: t.colors.borderDefault,
            }}
          />
        </View>
        <Text
          variant="caption"
          tone="indigo"
          weight="semibold"
          style={{ paddingHorizontal: 20, paddingBottom: 6 }}
        >
          ROUTE TO
        </Text>
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 8,
            paddingBottom: 12,
          }}
        >
          <Pressable
            onPress={() => handle("team")}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              paddingHorizontal: 12,
              paddingVertical: 10,
              borderRadius: t.radii.md,
              backgroundColor: pressed ? t.colors.bgElevated : "transparent",
            })}
          >
            <EmployeeAvatar employee="team" size="sm" />
            <View style={{ flex: 1 }}>
              <Text variant="body" weight="medium">
                The team
              </Text>
              <Text variant="caption" tone="tertiary" style={{ letterSpacing: 0 }}>
                Atlas routes to whoever fits.
              </Text>
            </View>
          </Pressable>
          {EMPLOYEE_LIST.map((e) => (
            <Pressable
              key={e.id}
              onPress={() => handle(e.id)}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                paddingHorizontal: 12,
                paddingVertical: 10,
                borderRadius: t.radii.md,
                backgroundColor: pressed ? t.colors.bgElevated : "transparent",
              })}
            >
              <EmployeeAvatar employee={e.id} size="sm" />
              <View style={{ flex: 1 }}>
                <Text variant="body" weight="medium">
                  {e.name}
                </Text>
                <Text variant="caption" tone="tertiary" style={{ letterSpacing: 0 }}>
                  {e.title}
                </Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      </Animated.View>
    </View>
  );
}
