import React, { useCallback, useState } from "react";
import { ScrollView, View, RefreshControl, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { GearSix } from "phosphor-react-native";
import { usePraxisTheme } from "../../contexts/PraxisThemeContext";
import { Text } from "../../components/praxis";
import { QuickStartGrid } from "../../components/praxis/home/QuickStartGrid";
import { RecentActivityCard } from "../../components/praxis/home/RecentActivityCard";
import { MemorySnippetCard } from "../../components/praxis/home/MemorySnippetCard";
import { UsageStatCard } from "../../components/praxis/home/UsageStatCard";
import { useAuthStore } from "../../store/authStore";
import { listConversations } from "../../lib/conduit/conversations";
import { listMemory } from "../../lib/conduit/memory";
import { getOrCreateAccount } from "../../lib/conduit/account";
import type { Conversation, MemoryRecord, ConduitAccount } from "../../lib/conduit/types";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return "Late night";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Good evening";
}

export default function HomeScreen() {
  const t = usePraxisTheme();
  const router = useRouter();
  const { user } = useAuthStore();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [memories, setMemories] = useState<MemoryRecord[]>([]);
  const [account, setAccount] = useState<ConduitAccount | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAll = useCallback(async () => {
    const [convs, mem, acc] = await Promise.all([
      listConversations(),
      listMemory(),
      getOrCreateAccount(),
    ]);
    setConversations(convs);
    setMemories(mem);
    setAccount(acc);
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

  const displayName =
    account?.display_name ||
    (user?.user_metadata as Record<string, unknown> | undefined)?.full_name as string | undefined ||
    user?.email?.split("@")[0] ||
    "there";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.bgCanvas }} edges={["top"]}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: t.layout.screenPaddingX,
          paddingTop: 8,
          paddingBottom: 32,
          gap: 20,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={t.colors.indigo500}
          />
        }
      >
        <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" }}>
          <View style={{ flex: 1 }}>
            <Text variant="caption" tone="indigo" weight="semibold" style={{ marginBottom: 4 }}>
              PRAXIS CONSOLE
            </Text>
            <Text variant="displayLg" family="display" weight="semibold">
              {greeting()},
            </Text>
            <Text variant="displayLg" family="display" weight="semibold" italic tone="indigo">
              {displayName}.
            </Text>
          </View>

          <Pressable
            onPress={() => router.push("/(app)/settings")}
            hitSlop={10}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: t.colors.bgSurface,
              borderWidth: 1,
              borderColor: t.colors.borderSubtle,
              alignItems: "center",
              justifyContent: "center",
              marginTop: 4,
            }}
          >
            <GearSix size={18} color={t.colors.inkPrimary} />
          </Pressable>
        </View>

        <UsageStatCard account={account} />
        <QuickStartGrid />
        <RecentActivityCard conversations={conversations} />
        <MemorySnippetCard memories={memories} />
      </ScrollView>
    </SafeAreaView>
  );
}
