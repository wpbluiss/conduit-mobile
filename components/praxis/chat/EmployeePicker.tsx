import React, { useEffect, useMemo, useState } from "react";
import { View, Pressable, ScrollView, TextInput } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
  interpolate,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MagnifyingGlass, UsersThree } from "phosphor-react-native";
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
  const [search, setSearch] = useState("");

  useEffect(() => {
    progress.value = open
      ? withSpring(1, { damping: 18, stiffness: 280, mass: 0.6 })
      : withTiming(0, { duration: 180, easing: Easing.out(Easing.cubic) });
  }, [open, progress]);

  // Reset search whenever the sheet closes.
  useEffect(() => {
    if (!open) setSearch("");
  }, [open]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(progress.value, [0, 1], [560, 0]),
      },
    ],
  }));
  const scrimStyle = useAnimatedStyle(() => ({
    opacity: progress.value * 0.55,
  }));

  const filtered = useMemo(() => {
    if (!search.trim()) return EMPLOYEE_LIST;
    const q = search.trim().toLowerCase();
    return EMPLOYEE_LIST.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.title.toLowerCase().includes(q) ||
        e.id.toLowerCase().includes(q),
    );
  }, [search]);

  const showTeam = !search.trim() || "the team".includes(search.trim().toLowerCase());

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
            maxHeight: "80%",
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

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 20,
            paddingBottom: 10,
          }}
        >
          <Text variant="caption" tone="indigo" weight="semibold">
            ROUTE TO
          </Text>
          <Text variant="caption" tone="tertiary" style={{ letterSpacing: 0 }}>
            {filtered.length + (showTeam ? 1 : 0)} routes
          </Text>
        </View>

        <View style={{ paddingHorizontal: 16, paddingBottom: 10 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              backgroundColor: t.colors.bgElevated,
              borderRadius: t.radii.md,
              paddingHorizontal: 12,
              paddingVertical: 10,
            }}
          >
            <MagnifyingGlass size={14} color={t.colors.inkTertiary} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Find an employee or team"
              placeholderTextColor={t.colors.inkTertiary}
              autoCorrect={false}
              autoCapitalize="none"
              style={{
                flex: 1,
                fontFamily: t.fonts.body,
                fontSize: 14,
                color: t.colors.inkPrimary,
                padding: 0,
              }}
            />
          </View>
        </View>

        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 8,
            paddingBottom: 12,
          }}
          keyboardShouldPersistTaps="handled"
        >
          {showTeam ? (
            <Pressable
              onPress={() => handle("team")}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                paddingHorizontal: 12,
                paddingVertical: 11,
                borderRadius: t.radii.md,
                backgroundColor: pressed ? t.colors.bgElevated : "transparent",
              })}
            >
              <View
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 15,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: t.colors.indigoSoft,
                  borderWidth: 1.5,
                  borderColor: t.colors.indigo500,
                }}
              >
                <UsersThree
                  size={14}
                  color={t.colors.indigo500}
                  weight="bold"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="body" weight="medium">
                  The team
                </Text>
                <Text variant="caption" tone="tertiary" style={{ letterSpacing: 0 }}>
                  Atlas routes to whoever fits.
                </Text>
              </View>
            </Pressable>
          ) : null}

          {filtered.map((e) => (
            <Pressable
              key={e.id}
              onPress={() => handle(e.id)}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                paddingHorizontal: 12,
                paddingVertical: 11,
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

          {!showTeam && filtered.length === 0 ? (
            <View style={{ paddingHorizontal: 16, paddingVertical: 24 }}>
              <Text variant="bodySm" tone="tertiary" align="center">
                No employees match "{search}"
              </Text>
            </View>
          ) : null}
        </ScrollView>
      </Animated.View>
    </View>
  );
}
