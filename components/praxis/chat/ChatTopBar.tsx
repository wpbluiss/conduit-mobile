import React from "react";
import { View, Pressable } from "react-native";
import { List, Plus } from "phosphor-react-native";
import * as Haptics from "expo-haptics";
import { usePraxisTheme } from "../../../contexts/PraxisThemeContext";
import { Text } from "../Text";
import { EmployeeAvatar } from "../EmployeeAvatar";
import { PraxisLogo } from "../PraxisLogo";
import type { EmployeeId } from "../../../lib/conduit/employees";
import { EMPLOYEE_SURFACES } from "../../../lib/conduit/surfaces";

export interface ChatTopBarProps {
  title: string;
  subtitle?: string;
  onMenuPress: () => void;
  onNewPress: () => void;
  /** When set, the top bar swaps the generic Praxis mark for this
   *  employee's avatar and tints the title with the employee accent. */
  employee?: EmployeeId | "team" | null;
}

export function ChatTopBar({
  title,
  subtitle,
  onMenuPress,
  onNewPress,
  employee,
}: ChatTopBarProps) {
  const t = usePraxisTheme();

  const accent =
    employee && employee !== "team"
      ? EMPLOYEE_SURFACES[employee]?.accentColor
      : null;

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 6,
        paddingVertical: 8,
        borderBottomWidth: 0.5,
        borderBottomColor: t.colors.borderSubtle,
      }}
    >
      <Pressable
        onPress={() => {
          Haptics.selectionAsync().catch(() => {});
          onMenuPress();
        }}
        hitSlop={10}
        style={({ pressed }) => ({
          width: 40,
          height: 40,
          borderRadius: 20,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: pressed ? t.colors.bgElevated : "transparent",
        })}
      >
        <List size={20} color={t.colors.inkPrimary} />
      </Pressable>

      <View
        style={{
          flex: 1,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        }}
      >
        {employee ? (
          <EmployeeAvatar employee={employee} size="xs" />
        ) : (
          <PraxisLogo size={22} />
        )}
        <View style={{ alignItems: "center" }}>
          <Text
            variant="bodyLg"
            weight="semibold"
            numberOfLines={1}
            style={accent ? { color: accent } : undefined}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text
              variant="caption"
              tone="tertiary"
              style={{ marginTop: 1, letterSpacing: 0 }}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>

      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          onNewPress();
        }}
        hitSlop={10}
        style={({ pressed }) => ({
          width: 40,
          height: 40,
          borderRadius: 20,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: pressed ? t.colors.bgElevated : "transparent",
        })}
      >
        <Plus size={20} color={t.colors.inkPrimary} weight="bold" />
      </Pressable>
    </View>
  );
}
