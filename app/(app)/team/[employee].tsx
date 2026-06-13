import React, { useEffect, useState } from "react";
import { View, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, LockSimple } from "phosphor-react-native";
import { usePraxisTheme } from "../../../contexts/PraxisThemeContext";
import { Text, Button, EmployeeAvatar } from "../../../components/praxis";
import { getEmployee, type EmployeeId } from "../../../lib/conduit/employees";
import { createConversation } from "../../../lib/conduit/conversations";
import { getOrCreateAccount } from "../../../lib/conduit/account";
import { isEmployeeAllowed, requiredTierFor } from "../../../lib/conduit/tiers";

export default function EmployeeProfileScreen() {
  const t = usePraxisTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ employee: string }>();
  const employee = getEmployee(params.employee);
  const [creating, setCreating] = useState(false);
  const [tierId, setTierId] = useState<string | null>(null);

  useEffect(() => {
    getOrCreateAccount().then((acc) => setTierId(acc?.tier_id ?? null));
  }, []);

  if (!employee) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.bgCanvas, paddingTop: 24 }} edges={["top"]}>
        <Text variant="body" tone="tertiary" align="center">
          Employee not found.
        </Text>
      </SafeAreaView>
    );
  }

  const allowed = isEmployeeAllowed(employee.id as EmployeeId, tierId);
  const required = !allowed ? requiredTierFor(employee.id as EmployeeId) : null;

  const startChat = async () => {
    setCreating(true);
    const conv = await createConversation(`Chat with ${employee.name}`);
    setCreating(false);
    if (!conv) return;
    router.replace(`/(app)/chat/${conv.id}`);
  };

  const goToBilling = () => {
    router.push("/(app)/settings/billing" as never);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.bgCanvas }} edges={["top"]}>
      <View style={{ paddingHorizontal: 8, paddingVertical: 8 }}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          style={{ width: 36, height: 36, alignItems: "center", justifyContent: "center" }}
        >
          <ArrowLeft size={20} color={t.colors.inkPrimary} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: t.layout.screenPaddingX,
          paddingBottom: 32,
          alignItems: "center",
        }}
      >
        <View style={{ opacity: allowed ? 1 : 0.55, marginVertical: 24 }}>
          <EmployeeAvatar employee={employee.id as EmployeeId} size="xl" />
        </View>

        <Text variant="caption" tone="indigo" weight="semibold" style={{ marginBottom: 6 }}>
          {employee.title.toUpperCase()}
        </Text>
        <Text variant="displayLg" family="display" weight="semibold">
          {employee.name}
        </Text>

        <Text
          variant="bodyLg"
          tone="secondary"
          align="center"
          style={{ marginTop: 12, maxWidth: 320 }}
        >
          {employee.blurb}
        </Text>

        {allowed ? (
          <View style={{ marginTop: 32, alignSelf: "stretch" }}>
            <Button
              label={creating ? "Opening…" : `Start a thread with ${employee.name}`}
              variant="primary"
              size="lg"
              fullWidth
              loading={creating}
              onPress={startChat}
            />
          </View>
        ) : (
          <View style={{ marginTop: 32, alignSelf: "stretch", gap: 12 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderRadius: t.radii.md,
                backgroundColor: t.colors.bgSurface,
                borderWidth: 1,
                borderColor: t.colors.borderSubtle,
              }}
            >
              <LockSimple size={16} color={t.colors.inkTertiary} weight="fill" />
              <Text variant="bodySm" tone="tertiary" align="center">
                {required
                  ? `Available on the ${required.label} plan and above`
                  : "Not available on your current plan"}
              </Text>
            </View>
            <Button
              label={`Upgrade to unlock ${employee.name}`}
              variant="primary"
              size="lg"
              fullWidth
              onPress={goToBilling}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
