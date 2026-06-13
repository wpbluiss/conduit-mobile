import React, { useEffect, useState } from "react";
import { View, ScrollView, Pressable, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, SignOut, Trash, Lightning, ArrowSquareOut } from "phosphor-react-native";
import { format } from "date-fns";
import { usePraxisTheme } from "../../../contexts/PraxisThemeContext";
import { Text, Button, Input } from "../../../components/praxis";
import { useAuthStore } from "../../../store/authStore";
import { getOrCreateAccount, deleteAccount } from "../../../lib/conduit/account";
import type { ConduitAccount } from "../../../lib/conduit/types";
import { isPro, tierLabel, openBillingPortal } from "../../../lib/conduit/billing";
import { PaywallModal } from "../../../components/praxis/PaywallModal";

export default function AccountSettingsScreen() {
  const t = usePraxisTheme();
  const router = useRouter();
  const { user, signOut } = useAuthStore();

  const [account, setAccount] = useState<ConduitAccount | null>(null);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    getOrCreateAccount().then(setAccount);
  }, []);

  const handleManageBilling = async () => {
    setPortalLoading(true);
    try {
      await openBillingPortal();
    } finally {
      setPortalLoading(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert("Sign out?", "You can sign back in any time.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: async () => {
          await signOut();
          router.replace("/(auth)/sign-in");
        },
      },
    ]);
  };

  const handleDeleteAccount = async () => {
    if (confirmText !== "DELETE") return;

    Alert.alert(
      "Delete account?",
      "This will permanently delete your account, all conversations, and all data. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete forever",
          style: "destructive",
          onPress: async () => {
            setDeleting(true);
            try {
              const result = await deleteAccount();
              if (result.ok) {
                await signOut();
                router.replace("/(auth)/sign-in");
                return;
              }
              if (!result.ok && result.protected) {
                Alert.alert(
                  "Protected account",
                  "Internal accounts cannot be self-deleted. Contact support if you need assistance.",
                );
                return;
              }
              if (!result.ok) {
                Alert.alert("Deletion failed", result.message);
              }
            } finally {
              setDeleting(false);
              setConfirmText("");
            }
          },
        },
      ],
    );
  };

  const pro = isPro(account?.tier_id);
  const tokensUsed = account?.monthly_tokens_used ?? 0;
  const tokenCap = account?.monthly_token_cap ?? null;
  const tokenPct = tokenCap && tokenCap > 0 ? Math.min(tokensUsed / tokenCap, 1) : null;

  const renewalLabel = (() => {
    if (!account?.billing_cycle_start) return null;
    try {
      const cycleStart = new Date(account.billing_cycle_start);
      const nextCycle = new Date(cycleStart);
      nextCycle.setMonth(nextCycle.getMonth() + 1);
      return format(nextCycle, "MMM d, yyyy");
    } catch {
      return null;
    }
  })();

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
          gap: 16,
        }}
      >
        <View style={{ marginBottom: 8 }}>
          <Text variant="caption" tone="indigo" weight="semibold">
            ACCOUNT
          </Text>
          <Text variant="displayLg" family="display" weight="semibold">
            Your profile
          </Text>
        </View>

        <Field label="Workspace" value={account?.name ?? "—"} />
        <Field label="Email" value={user?.email ?? "—"} />

        {/* Plan section */}
        <View
          style={{
            padding: 16,
            borderRadius: t.radii.lg,
            backgroundColor: t.colors.bgSurface,
            borderWidth: 1.5,
            borderColor: pro ? t.colors.indigo500 : t.colors.borderSubtle,
            gap: 12,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: t.radii.full,
                backgroundColor: pro ? t.colors.indigoSoft : t.colors.bgElevated,
              }}
            >
              {pro && <Lightning size={11} color={t.colors.indigo500} weight="fill" />}
              <Text
                variant="caption"
                weight="semibold"
                style={{ color: pro ? t.colors.indigo500 : t.colors.inkTertiary, letterSpacing: 0.6 }}
              >
                {tierLabel(account?.tier_id).toUpperCase()}
              </Text>
            </View>
            <Text variant="caption" tone="tertiary" style={{ flex: 1, letterSpacing: 0 }}>
              {pro ? "Full access to all features" : "Limited to free-tier features"}
            </Text>
          </View>

          {tokenCap !== null && (
            <View style={{ gap: 4 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text variant="caption" tone="tertiary" weight="semibold">
                  MONTHLY TOKENS
                </Text>
                <Text variant="caption" tone="tertiary" style={{ letterSpacing: 0 }}>
                  {tokensUsed.toLocaleString()} / {tokenCap.toLocaleString()}
                </Text>
              </View>
              <View
                style={{
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: t.colors.bgElevated,
                  overflow: "hidden",
                }}
              >
                <View
                  style={{
                    height: 4,
                    borderRadius: 2,
                    width: `${Math.round((tokenPct ?? 0) * 100)}%`,
                    backgroundColor:
                      (tokenPct ?? 0) > 0.85 ? t.colors.warning : t.colors.indigo500,
                  }}
                />
              </View>
            </View>
          )}

          {renewalLabel && (
            <Text variant="caption" tone="tertiary" style={{ letterSpacing: 0 }}>
              Renews {renewalLabel}
            </Text>
          )}

          {pro ? (
            <Button
              label={portalLoading ? "Opening portal…" : "Manage billing"}
              variant="secondary"
              size="md"
              fullWidth
              loading={portalLoading}
              iconRight={<ArrowSquareOut size={14} color={t.colors.inkSecondary} />}
              onPress={handleManageBilling}
            />
          ) : (
            <Button
              label="Upgrade to Pro"
              variant="primary"
              size="md"
              fullWidth
              iconLeft={<Lightning size={14} color="#FFFFFF" weight="fill" />}
              onPress={() => setShowPaywall(true)}
            />
          )}
        </View>

        <View style={{ marginTop: 4 }}>
          <Button
            label="Sign out"
            variant="secondary"
            size="lg"
            fullWidth
            iconLeft={<SignOut size={16} color={t.colors.inkPrimary} />}
            onPress={handleSignOut}
          />
        </View>

        {/* Danger Zone */}
        <View
          style={{
            marginTop: 24,
            padding: 16,
            borderRadius: t.radii.md,
            borderWidth: 1,
            borderColor: t.colors.danger,
            gap: 12,
          }}
        >
          <Text variant="caption" weight="semibold" style={{ color: t.colors.danger }}>
            DANGER ZONE
          </Text>
          <Text variant="body" tone="secondary">
            Permanently delete your account and all data. This action is irreversible.
          </Text>
          <Input
            label='Type "DELETE" to confirm'
            placeholder="DELETE"
            value={confirmText}
            onChangeText={setConfirmText}
            autoCapitalize="characters"
            autoCorrect={false}
            autoComplete="off"
          />
          <Button
            label="Delete my account"
            variant="danger"
            size="lg"
            fullWidth
            loading={deleting}
            disabled={confirmText !== "DELETE" || deleting}
            iconLeft={<Trash size={16} color="#FFFFFF" />}
            onPress={handleDeleteAccount}
          />
        </View>
      </ScrollView>

      <PaywallModal
        visible={showPaywall}
        feature="Pro plan"
        onDismiss={() => setShowPaywall(false)}
      />
    </SafeAreaView>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  const t = usePraxisTheme();
  return (
    <View
      style={{
        padding: 14,
        borderRadius: t.radii.md,
        backgroundColor: t.colors.bgSurface,
        borderWidth: 1,
        borderColor: t.colors.borderSubtle,
      }}
    >
      <Text variant="caption" tone="tertiary" weight="semibold">
        {label.toUpperCase()}
      </Text>
      <Text variant="body" style={{ marginTop: 4 }}>
        {value}
      </Text>
    </View>
  );
}
