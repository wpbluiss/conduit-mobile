import React, { useState } from "react";
import { View, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft } from "phosphor-react-native";
import { usePraxisTheme } from "../../../contexts/PraxisThemeContext";
import { Text, Button, EmployeeAvatar } from "../../../components/praxis";
import { getEmployee, type EmployeeId } from "../../../lib/conduit/employees";
import { createConversation } from "../../../lib/conduit/conversations";

export default function EmployeeProfileScreen() {
  const t = usePraxisTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ employee: string }>();
  const employee = getEmployee(params.employee);
  const [creating, setCreating] = useState(false);

  if (!employee) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.bgCanvas, paddingTop: 24 }} edges={["top"]}>
        <Text variant="body" tone="tertiary" align="center">
          Employee not found.
        </Text>
      </SafeAreaView>
    );
  }

  const startChat = async () => {
    setCreating(true);
    const conv = await createConversation(`Chat with ${employee.name}`);
    setCreating(false);
    if (!conv) return;
    router.replace(`/(app)/chat/${conv.id}`);
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
        <EmployeeAvatar employee={employee.id as EmployeeId} size="xl" style={{ marginVertical: 24 }} />

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
      </ScrollView>
    </SafeAreaView>
  );
}
