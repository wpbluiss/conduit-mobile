import React, { useState } from "react";
import {
  Modal,
  View,
  Pressable,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Lightning, X, Check } from "phosphor-react-native";
import * as Haptics from "expo-haptics";
import { usePraxisTheme } from "../../contexts/PraxisThemeContext";
import { Text } from "./Text";
import { Button } from "./Button";
import { openCheckout } from "../../lib/conduit/billing";

const PRO_FEATURES = [
  "Voice mode — hear your AI team speak",
  "Unlimited messages per day",
  "Access to Opus & Sonnet models",
  "Priority response speed",
  "Advanced employee routing",
];

export interface PaywallModalProps {
  visible: boolean;
  feature?: string;
  onDismiss: () => void;
}

export function PaywallModal({ visible, feature, onDismiss }: PaywallModalProps) {
  const t = usePraxisTheme();
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setLoading(true);
    try {
      await openCheckout();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onDismiss}
    >
      <View
        style={{
          flex: 1,
          justifyContent: "flex-end",
          backgroundColor: t.colors.overlay,
        }}
      >
        <Pressable
          style={{ flex: 1 }}
          onPress={onDismiss}
          accessibilityLabel="Dismiss"
        />

        <View
          style={{
            backgroundColor: t.colors.bgSurface,
            borderTopLeftRadius: t.radii["2xl"],
            borderTopRightRadius: t.radii["2xl"],
            overflow: "hidden",
            maxHeight: "85%",
          }}
        >
          {/* Gradient header */}
          <LinearGradient
            colors={["#3D44C2", "#5B63E8", "#6E76EE"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ paddingTop: 32, paddingBottom: 24, paddingHorizontal: 24 }}
          >
            <Pressable
              onPress={onDismiss}
              hitSlop={10}
              style={{
                position: "absolute",
                top: 16,
                right: 16,
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: "rgba(255,255,255,0.15)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={16} color="#FFFFFF" weight="bold" />
            </Pressable>

            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: "rgba(255,255,255,0.2)",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 14,
              }}
            >
              <Lightning size={24} color="#FFFFFF" weight="fill" />
            </View>

            <Text
              variant="caption"
              weight="semibold"
              style={{ color: "rgba(255,255,255,0.75)", letterSpacing: 1.4 }}
            >
              PRAXIS PRO
            </Text>
            <Text
              variant="displayMd"
              family="display"
              weight="semibold"
              style={{ color: "#FFFFFF", marginTop: 4 }}
            >
              {feature ? `${feature} requires Pro` : "Unlock the full team"}
            </Text>
          </LinearGradient>

          <ScrollView
            contentContainerStyle={{ padding: 24, gap: 20 }}
            showsVerticalScrollIndicator={false}
          >
            <Text variant="body" tone="secondary">
              Upgrade to Pro and put every AI employee to work — no limits, no
              interruptions.
            </Text>

            {/* Feature list */}
            <View style={{ gap: 10 }}>
              {PRO_FEATURES.map((feat) => (
                <View
                  key={feat}
                  style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
                >
                  <View
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 11,
                      backgroundColor: t.colors.indigoSoft,
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Check size={12} color={t.colors.indigo500} weight="bold" />
                  </View>
                  <Text variant="body" style={{ flex: 1 }}>
                    {feat}
                  </Text>
                </View>
              ))}
            </View>

            <Button
              label="Upgrade to Pro"
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
              iconLeft={<Lightning size={16} color="#FFFFFF" weight="fill" />}
              onPress={handleUpgrade}
            />

            <Pressable onPress={onDismiss} style={{ alignItems: "center", paddingVertical: 4 }}>
              <Text variant="bodySm" tone="tertiary">
                Not now
              </Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
