import React from "react";
import { View, Pressable, ScrollView } from "react-native";
import * as Haptics from "expo-haptics";
import { usePraxisTheme } from "../../../contexts/PraxisThemeContext";
import { Text } from "../Text";
import { EmployeeWorkspace } from "./EmployeeWorkspace";
import {
  EMPLOYEE_SURFACES,
  type EmployeeSurface,
} from "../../../lib/conduit/surfaces";
import type { EmployeeId } from "../../../lib/conduit/employees";

export interface EmployeeWelcomeStateProps {
  employee: EmployeeId;
  onSelectChip: (text: string) => void;
}

export function EmployeeWelcomeState({
  employee,
  onSelectChip,
}: EmployeeWelcomeStateProps) {
  const t = usePraxisTheme();
  const surface = EMPLOYEE_SURFACES[employee];
  if (!surface) return null;

  return (
    <ScrollView
      contentContainerStyle={{
        paddingHorizontal: t.layout.screenPaddingX,
        paddingTop: 12,
        paddingBottom: 24,
      }}
      showsVerticalScrollIndicator={false}
    >
      <EmployeeHero surface={surface} />
      <QuickChips
        chips={surface.quickChips}
        accent={surface.accentColor}
        accentSoft={surface.accentSoft}
        onSelectChip={onSelectChip}
      />
      <View style={{ marginTop: 16 }}>
        <EmployeeWorkspace employee={employee} />
      </View>
    </ScrollView>
  );
}

function EmployeeHero({ surface }: { surface: EmployeeSurface }) {
  const t = usePraxisTheme();
  const Icon = surface.Icon;
  return (
    <View
      style={{
        backgroundColor: surface.accentSoft,
        borderRadius: t.radii.lg,
        borderWidth: 0.5,
        borderColor: t.colors.borderSubtle,
        padding: 18,
        marginBottom: 16,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
        }}
      >
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: surface.accentColor,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon size={22} color="#FFFFFF" strokeWidth={2.25} />
        </View>
        <View style={{ flex: 1 }}>
          <Text
            variant="caption"
            weight="semibold"
            style={{
              color: surface.accentColor,
              letterSpacing: 0.88,
              marginBottom: 2,
            }}
          >
            {surface.kicker}
          </Text>
          <Text variant="displayMd" family="display" weight="semibold">
            {surface.name}
          </Text>
        </View>
      </View>
      <Text
        variant="body"
        tone="secondary"
        style={{ marginTop: 12, lineHeight: 22 }}
      >
        {surface.tagline}
      </Text>
    </View>
  );
}

function QuickChips({
  chips,
  accent,
  accentSoft,
  onSelectChip,
}: {
  chips: string[];
  accent: string;
  accentSoft: string;
  onSelectChip: (text: string) => void;
}) {
  const t = usePraxisTheme();
  return (
    <View>
      <Text
        variant="caption"
        tone="tertiary"
        weight="semibold"
        style={{ marginBottom: 8, letterSpacing: 0.88 }}
      >
        QUICK START
      </Text>
      <View style={{ gap: 8 }}>
        {chips.map((chip) => (
          <Pressable
            key={chip}
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              onSelectChip(chip);
            }}
            style={({ pressed }) => ({
              paddingHorizontal: 14,
              paddingVertical: 12,
              borderRadius: t.radii.md,
              backgroundColor: pressed ? accentSoft : t.colors.bgSurface,
              borderWidth: 1,
              borderColor: pressed ? accent : t.colors.borderSubtle,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            })}
          >
            <Text variant="body" tone="primary" style={{ flex: 1 }}>
              {chip}
            </Text>
            <Text
              variant="caption"
              style={{ color: accent, marginLeft: 8, letterSpacing: 0.4 }}
            >
              ASK →
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
