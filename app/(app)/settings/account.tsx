import React, { useEffect, useState } from "react";
import { View, ScrollView, Pressable, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, SignOut, Trash } from "phosphor-react-native";
import { usePraxisTheme } from "../../../contexts/PraxisThemeContext";
import { Text, Button, Input } from "../../../components/praxis";
import { useAuthStore } from "../../../store/authStore";
import { getOrCreateAccount, deleteAccount } from "../../../lib/conduit/account";
import type { ConduitAccount } from "../../../lib/conduit/types";

export default function AccountSettingsScreen() {
  const t = usePraxisTheme();
  const router = useRouter();
  const { user, signOut } = useAuthStore();

  const [account, setAccount] = useState<ConduitAccount | null>(null);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    getOrCreateAccount().then(setAccount);
  }, []);

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
        <Field label="Tier" value={(account?.tier_id ?? "free").toUpperCase()} />

        <View style={{ marginTop: 16 }}>
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
