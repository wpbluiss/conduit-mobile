import React, { useEffect, useState } from "react";
import { View, ScrollView, Pressable, Modal, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, SignOut, Trash } from "phosphor-react-native";
import { usePraxisTheme } from "../../../contexts/PraxisThemeContext";
import { Text, Button } from "../../../components/praxis";
import { useAuthStore } from "../../../store/authStore";
import { getOrCreateAccount } from "../../../lib/conduit/account";
import { authedFetch } from "../../../lib/conduit/api";
import type { ConduitAccount } from "../../../lib/conduit/types";

const CONFIRM_WORD = "DELETE";

export default function AccountSettingsScreen() {
  const t = usePraxisTheme();
  const router = useRouter();
  const { user, signOut } = useAuthStore();

  const [account, setAccount] = useState<ConduitAccount | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    getOrCreateAccount().then(setAccount);
  }, []);

  const handleSignOut = () => {
    setDeleteModalOpen(false);
    useAuthStore.getState().signOut().then(() => {
      router.replace("/(auth)/sign-in");
    });
  };

  const openDeleteModal = () => {
    setConfirmText("");
    setDeleteError(null);
    setDeleteModalOpen(true);
  };

  const handleDeleteAccount = async () => {
    if (confirmText !== CONFIRM_WORD) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await authedFetch("/api/conduit/account/delete", { method: "POST" });
      if (res.status === 403) {
        setDeleteError("This account is protected and cannot be self-deleted.");
        setDeleting(false);
        return;
      }
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        setDeleteError(body || `Deletion failed (${res.status}).`);
        setDeleting(false);
        return;
      }
      // Success — sign out and return to auth; do not await to avoid race
      setDeleteModalOpen(false);
      await signOut();
      router.replace("/(auth)/sign-in");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Network error. Please try again.";
      setDeleteError(msg);
      setDeleting(false);
    }
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
            onPress={() => {
              signOut().then(() => router.replace("/(auth)/sign-in"));
            }}
          />
        </View>

        <View
          style={{
            marginTop: 8,
            padding: 16,
            borderRadius: t.radii.lg,
            borderWidth: 1,
            borderColor: t.colors.danger,
            gap: 12,
          }}
        >
          <Text variant="caption" tone="danger" weight="semibold">
            DANGER ZONE
          </Text>
          <Text variant="bodySm" tone="secondary">
            Permanently delete your account and all workspace data. This cannot be undone.
          </Text>
          <Button
            label="Delete account"
            variant="danger"
            size="md"
            iconLeft={<Trash size={16} color="#FFFFFF" />}
            onPress={openDeleteModal}
          />
        </View>
      </ScrollView>

      <Modal
        visible={deleteModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => !deleting && setDeleteModalOpen(false)}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "flex-end",
            backgroundColor: "rgba(0,0,0,0.5)",
          }}
        >
          <SafeAreaView
            edges={["bottom"]}
            style={{
              backgroundColor: t.colors.bgCanvas,
              borderTopLeftRadius: t.radii.xl,
              borderTopRightRadius: t.radii.xl,
              padding: t.layout.screenPaddingX,
              gap: 16,
            }}
          >
            <Text variant="displaySm" family="display" weight="semibold">
              Delete account
            </Text>
            <Text variant="body" tone="secondary">
              All your conversations, memory, and workspace data will be permanently erased. This action cannot be undone.
            </Text>
            <Text variant="bodySm" tone="secondary">
              Type{" "}
              <Text variant="bodySm" weight="semibold">
                DELETE
              </Text>{" "}
              to confirm:
            </Text>

            <View
              style={{
                borderWidth: 1,
                borderColor: confirmText === CONFIRM_WORD ? t.colors.danger : t.colors.borderDefault,
                borderRadius: t.radii.md,
                paddingHorizontal: 14,
                paddingVertical: 12,
                backgroundColor: t.colors.bgSurface,
              }}
            >
              <TextInput
                value={confirmText}
                onChangeText={setConfirmText}
                placeholder="Type DELETE here"
                placeholderTextColor={t.colors.inkTertiary}
                autoCapitalize="characters"
                autoCorrect={false}
                editable={!deleting}
                style={{
                  color: t.colors.inkPrimary,
                  fontFamily: t.fonts.body,
                  fontSize: 17,
                }}
              />
            </View>

            {deleteError ? (
              <Text variant="bodySm" tone="danger">
                {deleteError}
              </Text>
            ) : null}

            <Button
              label={deleting ? "Deleting…" : "Permanently delete my account"}
              variant="danger"
              size="lg"
              fullWidth
              loading={deleting}
              disabled={confirmText !== CONFIRM_WORD || deleting}
              onPress={handleDeleteAccount}
            />

            <Button
              label="Cancel"
              variant="secondary"
              size="lg"
              fullWidth
              disabled={deleting}
              onPress={() => setDeleteModalOpen(false)}
            />
          </SafeAreaView>
        </View>
      </Modal>
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
