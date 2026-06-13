import React, { useState } from "react";
import { View, Pressable } from "react-native";
import { Lightning, X } from "phosphor-react-native";
import { useRouter } from "expo-router";
import { usePraxisTheme } from "../../../contexts/PraxisThemeContext";
import { Text } from "../Text";

/** Dismissible upgrade nudge shown to Free-tier users in the chat shell.
 *  Disappears for the session when the user taps X; tapping the body
 *  navigates to the billing settings screen. */
export function UpgradeNudge() {
  const t = usePraxisTheme();
  const router = useRouter();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <View
      style={{
        marginHorizontal: 12,
        marginBottom: 4,
        borderRadius: t.radii.md,
        backgroundColor: t.colors.indigoSoft,
        borderWidth: 1,
        borderColor: t.colors.indigo200,
        flexDirection: "row",
        alignItems: "center",
        paddingLeft: 12,
        paddingRight: 8,
        paddingVertical: 10,
        gap: 8,
      }}
    >
      <Lightning size={14} color={t.colors.indigo500} weight="fill" />
      <Pressable
        style={{ flex: 1 }}
        onPress={() => router.push("/(app)/settings/billing" as never)}
        hitSlop={4}
      >
        <Text variant="bodySm" style={{ color: t.colors.indigo500 }}>
          You're on the Free plan.{" "}
          <Text variant="bodySm" weight="semibold" style={{ color: t.colors.indigo500 }}>
            Upgrade for more tokens →
          </Text>
        </Text>
      </Pressable>
      <Pressable
        onPress={() => setDismissed(true)}
        hitSlop={8}
        style={{ padding: 4 }}
      >
        <X size={14} color={t.colors.indigo500} />
      </Pressable>
    </View>
  );
}
