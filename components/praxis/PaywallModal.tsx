import React, { useState } from "react";
import { Modal, View, Pressable, Alert, ActivityIndicator } from "react-native";
import { usePraxisTheme } from "../../contexts/PraxisThemeContext";
import { Text } from "./Text";
import { Button } from "./Button";
import { TierBadge } from "./TierBadge";
import { openBillingPortal, openTopUp, TOP_UP_OPTIONS } from "../../lib/conduit/billing";
import { Lightning, X } from "phosphor-react-native";

interface PaywallModalProps {
  visible: boolean;
  onClose: () => void;
  tierId?: string | null;
  tokensUsed?: number | null;
  tokenCap?: number | null;
}

export function PaywallModal({
  visible,
  onClose,
  tierId,
  tokensUsed,
  tokenCap,
}: PaywallModalProps) {
  const t = usePraxisTheme();
  const [loading, setLoading] = useState<string | null>(null);

  const handleTopUp = async (pkg: string) => {
    setLoading(pkg);
    const result = await openTopUp(pkg as never);
    setLoading(null);
    if (!result.ok) {
      Alert.alert("Could not open checkout", result.message);
    } else {
      onClose();
    }
  };

  const handlePortal = async () => {
    setLoading("portal");
    const result = await openBillingPortal();
    setLoading(null);
    if (!result.ok) {
      Alert.alert("Could not open billing portal", result.message);
    } else {
      onClose();
    }
  };

  const usedFmt =
    tokensUsed != null ? `${(tokensUsed / 1_000).toFixed(0)}k` : null;
  const capFmt =
    tokenCap != null ? `${(tokenCap / 1_000).toFixed(0)}k` : null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: t.colors.overlay,
          justifyContent: "flex-end",
        }}
      >
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <View
          style={{
            backgroundColor: t.colors.bgSurface,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: 24,
            gap: 16,
          }}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-start",
              justifyContent: "space-between",
            }}
          >
            <View style={{ gap: 8, flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Lightning size={18} color={t.colors.warning} weight="fill" />
                <Text variant="displaySm" family="display" weight="semibold">
                  Token limit reached
                </Text>
              </View>
              {usedFmt && capFmt ? (
                <Text variant="bodySm" tone="secondary">
                  You've used {usedFmt} of your {capFmt} monthly tokens.
                </Text>
              ) : (
                <Text variant="bodySm" tone="secondary">
                  You've hit your monthly token ceiling.
                </Text>
              )}
              <TierBadge tierId={tierId} />
            </View>
            <Pressable
              onPress={onClose}
              hitSlop={10}
              style={{
                width: 32,
                height: 32,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={18} color={t.colors.inkTertiary} />
            </Pressable>
          </View>

          {/* Top-up options */}
          <View style={{ gap: 8 }}>
            <Text variant="caption" weight="semibold" tone="tertiary">
              ADD TOKENS
            </Text>
            {TOP_UP_OPTIONS.map((opt) => (
              <Pressable
                key={opt.id}
                onPress={() => handleTopUp(opt.id)}
                disabled={loading !== null}
                style={({ pressed }) => ({
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: 14,
                  borderRadius: t.radii.md,
                  borderWidth: 1,
                  borderColor: t.colors.borderDefault,
                  backgroundColor: pressed ? t.colors.bgElevated : t.colors.bgCanvas,
                  opacity: loading !== null && loading !== opt.id ? 0.5 : 1,
                })}
              >
                <View>
                  <Text variant="body" weight="medium">
                    {opt.label}
                  </Text>
                  <Text variant="bodySm" tone="secondary">
                    {opt.tokens}
                  </Text>
                </View>
                {loading === opt.id ? (
                  <ActivityIndicator size="small" color={t.colors.indigo500} />
                ) : (
                  <Text variant="body" weight="semibold" style={{ color: t.colors.indigo500 }}>
                    {opt.price}
                  </Text>
                )}
              </Pressable>
            ))}
          </View>

          {/* Portal link */}
          <Button
            label={loading === "portal" ? "Opening portal…" : "Manage plan in billing portal"}
            variant="ghost"
            size="md"
            fullWidth
            loading={loading === "portal"}
            onPress={handlePortal}
          />
        </View>
      </View>
    </Modal>
  );
}
