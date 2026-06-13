import React, { useState } from "react";
import { Modal, View, Pressable, Alert, Linking } from "react-native";
import { usePraxisTheme } from "../../../contexts/PraxisThemeContext";
import { Text, Button } from "../index";
import { Lightning, X } from "phosphor-react-native";
import { fetchBillingPortalUrl } from "../../../lib/conduit/billing";

export interface PaywallModalProps {
  visible: boolean;
  onDismiss: () => void;
  /** "cap" = monthly token cap hit; "balance" = bonus tokens exhausted */
  reason?: "cap" | "balance";
}

export function PaywallModal({ visible, onDismiss, reason = "cap" }: PaywallModalProps) {
  const t = usePraxisTheme();
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    setLoading(true);
    const result = await fetchBillingPortalUrl();
    setLoading(false);
    if (!result.ok) {
      Alert.alert("Couldn't open billing portal", result.error);
      return;
    }
    Linking.openURL(result.url).catch(() => {
      Alert.alert("Couldn't open URL", "Please visit conduitai.io to manage billing.");
    });
    onDismiss();
  };

  const headline =
    reason === "balance" ? "You've used all your tokens" : "You've reached your monthly limit";

  const body =
    reason === "balance"
      ? "Your token balance is exhausted. Top up or upgrade your plan to keep chatting."
      : "You've hit your monthly token cap. Upgrade to Pro for more capacity, or wait for your cycle to reset.";

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <Pressable
        style={{ flex: 1, backgroundColor: t.colors.scrim, justifyContent: "flex-end" }}
        onPress={onDismiss}
      >
        <Pressable
          style={{
            backgroundColor: t.colors.bgSurface,
            borderTopLeftRadius: t.radii["2xl"],
            borderTopRightRadius: t.radii["2xl"],
            padding: 24,
            paddingBottom: 40,
            gap: 16,
          }}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: t.colors.indigoSoft,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Lightning size={20} color={t.colors.indigo500} weight="fill" />
            </View>
            <Pressable
              onPress={onDismiss}
              hitSlop={10}
              style={{ width: 32, height: 32, alignItems: "center", justifyContent: "center" }}
            >
              <X size={18} color={t.colors.inkTertiary} />
            </Pressable>
          </View>

          <View style={{ gap: 6 }}>
            <Text variant="displaySm" weight="semibold" family="display">
              {headline}
            </Text>
            <Text variant="body" tone="secondary">
              {body}
            </Text>
          </View>

          <Button
            label="Upgrade plan"
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
            onPress={handleUpgrade}
          />

          <Button
            label="Maybe later"
            variant="ghost"
            size="md"
            fullWidth
            onPress={onDismiss}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}
