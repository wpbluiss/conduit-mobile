import React, { useCallback, useEffect, useState } from "react";
import { View, ScrollView, Pressable, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Lock, Sparkle, Clock } from "phosphor-react-native";
import * as Haptics from "expo-haptics";
import { usePraxisTheme } from "../../../contexts/PraxisThemeContext";
import { Text, Button, EmployeeAvatar } from "../../../components/praxis";
import { getEmployee, type EmployeeId } from "../../../lib/conduit/employees";
import { getEmployeeSurface } from "../../../lib/conduit/surfaces";
import { createConversation } from "../../../lib/conduit/conversations";
import { getOrCreateAccount, isEmployeeLocked } from "../../../lib/conduit/account";
import {
  getEmployeeRecentMessages,
  formatRelative,
  type EmployeeRecentMessage,
} from "../../../lib/conduit/teamActivity";
import type { ConduitAccount } from "../../../lib/conduit/types";

export default function EmployeeWorkspaceScreen() {
  const t = usePraxisTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ employee: string }>();
  const employee = getEmployee(params.employee);
  const [creating, setCreating] = useState(false);
  const [account, setAccount] = useState<ConduitAccount | null>(null);
  const [recentMessages, setRecentMessages] = useState<EmployeeRecentMessage[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (id: EmployeeId) => {
    const [acc, msgs] = await Promise.all([
      getOrCreateAccount(),
      getEmployeeRecentMessages(id, 10),
    ]);
    setAccount(acc);
    setRecentMessages(msgs);
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!employee) return;
      load(employee.id as EmployeeId);
    }, [employee, load]),
  );

  const onRefresh = useCallback(async () => {
    if (!employee) return;
    setRefreshing(true);
    await load(employee.id as EmployeeId);
    setRefreshing(false);
  }, [employee, load]);

  if (!employee) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: t.colors.bgCanvas, paddingTop: 24 }}
        edges={["top"]}
      >
        <Text variant="body" tone="tertiary" align="center">
          Employee not found.
        </Text>
      </SafeAreaView>
    );
  }

  const surface = getEmployeeSurface(employee.id as EmployeeId);
  const locked = isEmployeeLocked(employee.id as EmployeeId, account?.tier_id);

  const startChat = async (draft?: string) => {
    if (locked) {
      router.push("/(app)/settings" as never);
      return;
    }
    Haptics.selectionAsync().catch(() => {});
    setCreating(true);
    const conv = await createConversation(`Chat with ${employee.name}`);
    setCreating(false);
    if (!conv) return;
    const path = draft
      ? `/(app)/chat/${conv.id}?initialDraft=${encodeURIComponent(draft)}`
      : `/(app)/chat/${conv.id}`;
    router.replace(path as never);
  };

  const openSettings = () => router.push("/(app)/settings" as never);

  const tokensUsed = account?.monthly_tokens_used ?? 0;
  const tokenCap = account?.monthly_token_cap ?? 0;
  const tokenPct = tokenCap > 0 ? Math.min(100, Math.round((tokensUsed / tokenCap) * 100)) : 0;

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: t.colors.bgCanvas }}
      edges={["top"]}
    >
      <View style={{ paddingHorizontal: 8, paddingVertical: 8 }}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          style={{
            width: 36,
            height: 36,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ArrowLeft size={20} color={t.colors.inkPrimary} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: t.layout.screenPaddingX,
          paddingBottom: 48,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={t.colors.inkTertiary}
          />
        }
      >
        {/* Hero */}
        <View style={{ alignItems: "center", paddingTop: 8, paddingBottom: 24 }}>
          <View>
            <EmployeeAvatar
              employee={employee.id as EmployeeId}
              size="xl"
              style={{ opacity: locked ? 0.5 : 1 }}
            />
            {locked && (
              <View
                style={{
                  position: "absolute",
                  bottom: -2,
                  right: -2,
                  width: 26,
                  height: 26,
                  borderRadius: 13,
                  backgroundColor: t.colors.bgCanvas,
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 1,
                  borderColor: t.colors.borderSubtle,
                }}
              >
                <Lock size={13} color={t.colors.inkTertiary} weight="fill" />
              </View>
            )}
          </View>

          <Text
            variant="caption"
            tone="indigo"
            weight="semibold"
            style={{ marginTop: 16, marginBottom: 4 }}
          >
            {surface.kicker}
          </Text>
          <Text variant="displayLg" family="display" weight="semibold">
            {employee.name}
          </Text>
          <Text
            variant="body"
            tone="secondary"
            align="center"
            style={{ marginTop: 8, maxWidth: 300 }}
          >
            {surface.tagline}
          </Text>

          {locked && (
            <View
              style={{
                marginTop: 12,
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: t.radii.md,
                backgroundColor: t.colors.bgElevated,
                borderWidth: 1,
                borderColor: t.colors.borderSubtle,
                maxWidth: 300,
              }}
            >
              <Text variant="bodySm" tone="secondary" align="center">
                {employee.name} is available on Pro and Enterprise plans.
              </Text>
            </View>
          )}
        </View>

        {/* Quick-start cards */}
        <View style={{ marginBottom: 28 }}>
          <Text
            variant="caption"
            tone="tertiary"
            weight="semibold"
            style={{ marginBottom: 10, letterSpacing: 0.6 }}
          >
            QUICK START
          </Text>
          <View style={{ gap: 8 }}>
            {surface.quickChips.map((chip, i) => (
              <Pressable
                key={i}
                onPress={() => startChat(chip)}
                style={({ pressed }) => ({
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  borderRadius: t.radii.md,
                  backgroundColor: pressed
                    ? t.colors.bgElevated
                    : t.colors.bgSurface,
                  borderWidth: 1,
                  borderColor: t.colors.borderSubtle,
                  opacity: locked ? 0.5 : 1,
                })}
              >
                <Sparkle
                  size={15}
                  color={surface.accentColor}
                  weight="fill"
                />
                <Text
                  variant="body"
                  style={{ flex: 1 }}
                  numberOfLines={2}
                >
                  {chip}
                </Text>
                {locked && (
                  <Lock size={13} color={t.colors.inkTertiary} />
                )}
              </Pressable>
            ))}
          </View>
        </View>

        {/* Primary CTA */}
        {locked ? (
          <Button
            label="Upgrade to unlock"
            variant="primary"
            size="lg"
            fullWidth
            onPress={openSettings}
            style={{ marginBottom: 28 }}
          />
        ) : (
          <Button
            label={creating ? "Opening…" : `Start a new thread`}
            variant="secondary"
            size="lg"
            fullWidth
            loading={creating}
            onPress={() => startChat()}
            style={{ marginBottom: 28 }}
          />
        )}

        {/* Cycle stats */}
        {account && tokenCap > 0 && (
          <View style={{ marginBottom: 28 }}>
            <Text
              variant="caption"
              tone="tertiary"
              weight="semibold"
              style={{ marginBottom: 10, letterSpacing: 0.6 }}
            >
              THIS CYCLE
            </Text>
            <View
              style={{
                flexDirection: "row",
                gap: 10,
              }}
            >
              <View
                style={{
                  flex: 1,
                  padding: 14,
                  borderRadius: t.radii.md,
                  backgroundColor: t.colors.bgSurface,
                  borderWidth: 1,
                  borderColor: t.colors.borderSubtle,
                }}
              >
                <Text variant="caption" tone="tertiary" style={{ marginBottom: 4 }}>
                  TOKENS USED
                </Text>
                <Text variant="body" weight="semibold">
                  {(tokensUsed / 1000).toFixed(1)}k
                </Text>
                <Text variant="caption" tone="tertiary" style={{ marginTop: 2 }}>
                  of {(tokenCap / 1000).toFixed(0)}k cap
                </Text>
                <View
                  style={{
                    marginTop: 8,
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
                      width: `${tokenPct}%`,
                      backgroundColor:
                        tokenPct > 80 ? t.colors.danger : surface.accentColor,
                    }}
                  />
                </View>
              </View>
              <View
                style={{
                  flex: 1,
                  padding: 14,
                  borderRadius: t.radii.md,
                  backgroundColor: t.colors.bgSurface,
                  borderWidth: 1,
                  borderColor: t.colors.borderSubtle,
                }}
              >
                <Text variant="caption" tone="tertiary" style={{ marginBottom: 4 }}>
                  RECENT REPLIES
                </Text>
                <Text variant="body" weight="semibold">
                  {recentMessages.length}
                </Text>
                <Text variant="caption" tone="tertiary" style={{ marginTop: 2 }}>
                  last {recentMessages.length === 10 ? "10+" : recentMessages.length} loaded
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Recent activity */}
        {recentMessages.length > 0 && (
          <View>
            <Text
              variant="caption"
              tone="tertiary"
              weight="semibold"
              style={{ marginBottom: 10, letterSpacing: 0.6 }}
            >
              RECENT ACTIVITY
            </Text>
            <View style={{ gap: 8 }}>
              {recentMessages.map((msg, i) => (
                <Pressable
                  key={i}
                  onPress={() =>
                    router.push(
                      `/(app)/chat/${msg.conversationId}` as never,
                    )
                  }
                  style={({ pressed }) => ({
                    paddingHorizontal: 14,
                    paddingVertical: 11,
                    borderRadius: t.radii.md,
                    backgroundColor: pressed
                      ? t.colors.bgElevated
                      : t.colors.bgSurface,
                    borderWidth: 1,
                    borderColor: t.colors.borderSubtle,
                  })}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                      marginBottom: 4,
                    }}
                  >
                    <Clock size={11} color={t.colors.inkTertiary} />
                    <Text variant="caption" tone="tertiary" style={{ letterSpacing: 0 }}>
                      {formatRelative(msg.createdAt)}
                    </Text>
                  </View>
                  <Text
                    variant="bodySm"
                    tone="secondary"
                    numberOfLines={3}
                    style={{ lineHeight: 18 }}
                  >
                    {msg.content || "—"}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {recentMessages.length === 0 && !locked && (
          <View
            style={{
              alignItems: "center",
              paddingVertical: 24,
              borderRadius: t.radii.md,
              backgroundColor: t.colors.bgSurface,
              borderWidth: 1,
              borderColor: t.colors.borderSubtle,
            }}
          >
            <Text variant="body" tone="tertiary" align="center">
              No activity yet. Use a quick-start above to begin.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
