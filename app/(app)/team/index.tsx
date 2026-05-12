import React, { useCallback, useEffect, useState } from "react";
import { View, ScrollView, Pressable, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { ArrowRight, Microphone } from "phosphor-react-native";
import * as Haptics from "expo-haptics";
import { usePraxisTheme } from "../../../contexts/PraxisThemeContext";
import { Text, EmployeeAvatar } from "../../../components/praxis";
import { EMPLOYEE_LIST, type EmployeeId } from "../../../lib/conduit/employees";
import { EMPLOYEE_SURFACES } from "../../../lib/conduit/surfaces";
import {
  getTeamActivity,
  formatRelative,
  type EmployeeActivity,
} from "../../../lib/conduit/teamActivity";

// 15 minutes window for the "active" pulse — past this, employees are
// shown as merely "available". AI workers never sleep, but recency is
// the signal that matters at a glance.
const ACTIVE_WINDOW_MS = 15 * 60 * 1000;

export default function TeamIndexScreen() {
  const t = usePraxisTheme();
  const router = useRouter();
  const [activity, setActivity] = useState<EmployeeActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const rows = await getTeamActivity();
    setActivity(rows);
  }, []);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      (async () => {
        if (alive) {
          await load();
          if (alive) setLoading(false);
        }
      })();
      return () => {
        alive = false;
      };
    }, [load]),
  );

  // Tick once a minute so the "2m ago" labels stay accurate without a
  // full refetch.
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const openChat = (employee: EmployeeId, existingConvoId: string | null) => {
    Haptics.selectionAsync().catch(() => {});
    if (existingConvoId) {
      router.push(`/(app)/chat/${existingConvoId}` as never);
    } else {
      router.push(`/(app)/chat/new?employee=${employee}` as never);
    }
  };

  const openVoice = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    router.push("/(app)/voice" as never);
  };

  // Order: most recent activity first, then alphabetical for never-active.
  const ordered = [...activity].sort((a, b) => {
    if (a.lastAt && b.lastAt) {
      return new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime();
    }
    if (a.lastAt) return -1;
    if (b.lastAt) return 1;
    return 0;
  });

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: t.colors.bgCanvas }}
      edges={["top"]}
    >
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: t.layout.screenPaddingX,
          paddingTop: 8,
          paddingBottom: 32,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={t.colors.inkTertiary}
          />
        }
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: 20,
          }}
        >
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text variant="caption" tone="indigo" weight="semibold">
              TEAM ROOM
            </Text>
            <Text variant="displayLg" family="display" weight="semibold">
              Who's on call.
            </Text>
            <Text variant="body" tone="secondary" style={{ marginTop: 6 }}>
              Last reply from each employee. Tap to jump back into their
              thread or start a new one.
            </Text>
          </View>
          <Pressable
            onPress={openVoice}
            hitSlop={6}
            style={({ pressed }) => ({
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: pressed
                ? t.colors.indigo500
                : t.colors.indigoSoft,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: t.colors.indigo300,
            })}
          >
            <Microphone size={20} color={t.colors.indigo500} weight="bold" />
          </Pressable>
        </View>

        <View style={{ gap: 10 }}>
          {ordered.map((row) => {
            const cfg = EMPLOYEE_LIST.find((e) => e.id === row.employee);
            if (!cfg) return null;
            const surface = EMPLOYEE_SURFACES[row.employee];
            const isActive =
              row.lastAt &&
              now.getTime() - new Date(row.lastAt).getTime() < ACTIVE_WINDOW_MS;
            return (
              <Pressable
                key={row.employee}
                onPress={() => openChat(row.employee, row.lastConversationId)}
                style={({ pressed }) => ({
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  borderRadius: t.radii.lg,
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
                    gap: 12,
                  }}
                >
                  <View>
                    <EmployeeAvatar employee={row.employee} size="md" />
                    <View
                      style={{
                        position: "absolute",
                        right: -2,
                        bottom: -2,
                        width: 12,
                        height: 12,
                        borderRadius: 6,
                        backgroundColor: isActive
                          ? "#3DD68C"
                          : surface.accentColor,
                        borderWidth: 2,
                        borderColor: t.colors.bgSurface,
                      }}
                    />
                  </View>

                  <View style={{ flex: 1, minWidth: 0 }}>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "baseline",
                        justifyContent: "space-between",
                        gap: 8,
                      }}
                    >
                      <Text
                        variant="body"
                        weight="semibold"
                        numberOfLines={1}
                        style={{ flexShrink: 1 }}
                      >
                        {cfg.name}
                      </Text>
                      <Text
                        variant="caption"
                        tone="tertiary"
                        style={{ letterSpacing: 0 }}
                      >
                        {formatRelative(row.lastAt, now)}
                      </Text>
                    </View>
                    <Text
                      variant="caption"
                      tone="tertiary"
                      numberOfLines={1}
                      style={{ marginTop: 1, letterSpacing: 0.3 }}
                    >
                      {cfg.title.toUpperCase()}
                    </Text>
                    <Text
                      variant="bodySm"
                      tone="secondary"
                      numberOfLines={2}
                      style={{ marginTop: 6 }}
                    >
                      {row.lastPreview ?? "Hasn't replied yet — tap to start."}
                    </Text>
                  </View>

                  <ArrowRight size={16} color={t.colors.inkTertiary} />
                </View>
              </Pressable>
            );
          })}
        </View>

        {loading && activity.length === 0 ? (
          <View style={{ paddingTop: 18 }}>
            <Text variant="caption" tone="tertiary" align="center">
              Loading team activity…
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
