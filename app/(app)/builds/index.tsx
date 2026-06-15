import React, { useCallback, useState } from "react";
import { View, FlatList, RefreshControl, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { Stack as StackIcon, CheckCircle, XCircle, CircleNotch, Sparkle, Plus } from "phosphor-react-native";
import { formatDistanceToNow } from "date-fns";
import { usePraxisTheme } from "../../../contexts/PraxisThemeContext";
import { Text, IconBadge } from "../../../components/praxis";
import { listBuilds } from "../../../lib/conduit/builds";
import type { BuildSession, BuildStatus } from "../../../lib/conduit/types";

const STATUS_LABEL: Record<BuildStatus, string> = {
  pending: "Queued",
  scaffolding: "Scaffolding",
  building: "Building",
  deploying: "Deploying",
  live: "Live",
  failed: "Failed",
  archived: "Archived",
};

function statusTone(t: ReturnType<typeof usePraxisTheme>, status: BuildStatus): { color: string; icon: React.ReactNode } {
  switch (status) {
    case "live":
      return { color: t.colors.success, icon: <CheckCircle size={14} color={t.colors.success} weight="fill" /> };
    case "failed":
      return { color: t.colors.danger, icon: <XCircle size={14} color={t.colors.danger} weight="fill" /> };
    case "pending":
    case "scaffolding":
    case "building":
    case "deploying":
      return { color: t.colors.indigo500, icon: <CircleNotch size={14} color={t.colors.indigo500} /> };
    case "archived":
    default:
      return { color: t.colors.inkTertiary, icon: <Sparkle size={14} color={t.colors.inkTertiary} /> };
  }
}

export default function BuildsIndexScreen() {
  const t = usePraxisTheme();
  const router = useRouter();
  const [items, setItems] = useState<BuildSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAll = useCallback(async () => {
    const data = await listBuilds();
    setItems(data);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchAll();
    }, [fetchAll]),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAll();
  }, [fetchAll]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.bgCanvas }} edges={["top"]}>
      <View
        style={{
          paddingHorizontal: t.layout.screenPaddingX,
          paddingTop: 8,
          paddingBottom: 16,
          flexDirection: "row",
          alignItems: "flex-end",
        }}
      >
        <View style={{ flex: 1 }}>
          <Text variant="caption" tone="indigo" weight="semibold">
            BUILDS
          </Text>
          <Text variant="displayLg" family="display" weight="semibold">
            Engineering sessions
          </Text>
        </View>
        <Pressable
          onPress={() => router.push("/(app)/builds/new" as never)}
          style={({ pressed }) => ({
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: t.radii.md,
            backgroundColor: pressed ? t.colors.indigoSoft : t.colors.bgSurface,
            borderWidth: 1,
            borderColor: t.colors.borderSubtle,
            marginBottom: 2,
          })}
        >
          <Plus size={14} color={t.colors.indigo500} weight="bold" />
          <Text variant="bodySm" weight="semibold" style={{ color: t.colors.indigo500 }}>
            New Build
          </Text>
        </Pressable>
      </View>

      <FlatList
        data={items}
        keyExtractor={(b) => b.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={t.colors.indigo500} />
        }
        ItemSeparatorComponent={() => (
          <View
            style={{
              height: 0.5,
              backgroundColor: t.colors.borderSubtle,
              marginLeft: t.layout.screenPaddingX,
            }}
          />
        )}
        ListEmptyComponent={
          loading ? null : (
            <View style={{ alignItems: "center", paddingHorizontal: 24, paddingTop: 64 }}>
              <IconBadge
                icon={<StackIcon size={28} color={t.colors.indigo500} weight="fill" />}
                tone="indigo"
                size="lg"
                ringed
                style={{ marginBottom: 16 }}
              />
              <Text variant="displaySm" family="display" weight="semibold" align="center">
                No builds yet
              </Text>
              <Text variant="body" tone="tertiary" align="center" style={{ marginTop: 6, maxWidth: 280 }}>
                Ask Engineering to scaffold something. The session will land here.
              </Text>
            </View>
          )
        }
        renderItem={({ item }) => {
          const { color, icon } = statusTone(t, item.status);
          return (
            <Pressable
              onPress={() => router.push(`/(app)/builds/${item.id}` as never)}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                paddingHorizontal: t.layout.screenPaddingX,
                paddingVertical: 14,
                backgroundColor: pressed ? t.colors.bgElevated : "transparent",
              })}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  backgroundColor: t.colors.indigoSoft,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <StackIcon size={18} color={t.colors.indigo500} />
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="body" weight="medium" numberOfLines={1}>
                  {item.build_name}
                </Text>
                <Text variant="bodySm" tone="tertiary" style={{ marginTop: 2 }}>
                  {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                </Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                {icon}
                <Text variant="bodySm" weight="medium" style={{ color }}>
                  {STATUS_LABEL[item.status]}
                </Text>
              </View>
            </Pressable>
          );
        }}
      />
    </SafeAreaView>
  );
}
