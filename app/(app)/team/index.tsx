import React from "react";
import { View, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { usePraxisTheme } from "../../../contexts/PraxisThemeContext";
import { Text, EmployeeAvatar } from "../../../components/praxis";
import { EMPLOYEE_LIST } from "../../../lib/conduit/employees";

export default function TeamIndexScreen() {
  const t = usePraxisTheme();
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.bgCanvas }} edges={["top"]}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: t.layout.screenPaddingX,
          paddingTop: 8,
          paddingBottom: 32,
        }}
      >
        <View style={{ marginBottom: 20 }}>
          <Text variant="caption" tone="indigo" weight="semibold">
            TEAM
          </Text>
          <Text variant="displayLg" family="display" weight="semibold">
            Nine employees, on call.
          </Text>
          <Text variant="body" tone="secondary" style={{ marginTop: 6 }}>
            Tap any employee to start a thread routed straight to them.
          </Text>
        </View>

        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          {EMPLOYEE_LIST.map((emp) => (
            <Pressable
              key={emp.id}
              onPress={() => router.push(`/(app)/team/${emp.id}` as never)}
              style={({ pressed }) => ({
                flexBasis: "31%",
                flexGrow: 1,
                aspectRatio: 0.85,
                paddingVertical: 16,
                paddingHorizontal: 8,
                borderRadius: t.radii.lg,
                backgroundColor: pressed ? t.colors.bgElevated : t.colors.bgSurface,
                borderWidth: 1,
                borderColor: t.colors.borderSubtle,
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
              })}
            >
              <EmployeeAvatar employee={emp.id} size="lg" />
              <View style={{ alignItems: "center" }}>
                <Text variant="body" weight="semibold" numberOfLines={1}>
                  {emp.name}
                </Text>
                <Text
                  variant="caption"
                  tone="tertiary"
                  numberOfLines={1}
                  style={{ marginTop: 2, letterSpacing: 0.4 }}
                >
                  {emp.title.toUpperCase()}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
