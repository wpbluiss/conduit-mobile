import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  FlatList,
  RefreshControl,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { Plus, ChatCircleText } from "phosphor-react-native";
import { formatDistanceToNow } from "date-fns";
import { usePraxisTheme } from "../../../contexts/PraxisThemeContext";
import { Text, IconBadge } from "../../../components/praxis";
import { listConversations } from "../../../lib/conduit/conversations";
import type { Conversation } from "../../../lib/conduit/types";

export default function ChatIndexScreen() {
  const t = usePraxisTheme();
  const router = useRouter();
  const [items, setItems] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchList = useCallback(async () => {
    const next = await listConversations();
    setItems(next);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchList();
    }, [fetchList]),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchList();
  }, [fetchList]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.bgCanvas }} edges={["top"]}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: t.layout.screenPaddingX,
          paddingTop: 8,
          paddingBottom: 16,
        }}
      >
        <View>
          <Text variant="caption" tone="indigo" weight="semibold">
            CHAT
          </Text>
          <Text variant="displayMd" family="display" weight="semibold">
            Conversations
          </Text>
        </View>

        <Pressable
          onPress={() => router.push("/(app)/chat/new")}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: t.colors.indigo500,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Plus size={20} color="#FFFFFF" weight="bold" />
        </Pressable>
      </View>

      <FlatList
        data={items}
        keyExtractor={(c) => c.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={t.colors.indigo500}
          />
        }
        ItemSeparatorComponent={() => (
          <View
            style={{
              height: 0.5,
              backgroundColor: t.colors.borderSubtle,
              marginLeft: t.layout.screenPaddingX + 48,
            }}
          />
        )}
        ListEmptyComponent={
          loading ? null : (
            <View style={{ alignItems: "center", paddingHorizontal: 24, paddingTop: 64 }}>
              <IconBadge
                icon={<ChatCircleText size={28} color={t.colors.indigo500} weight="fill" />}
                tone="indigo"
                size="lg"
                ringed
                style={{ marginBottom: 16 }}
              />
              <Text variant="displaySm" family="display" weight="semibold" align="center">
                No conversations yet
              </Text>
              <Text variant="body" tone="tertiary" align="center" style={{ marginTop: 6, maxWidth: 280 }}>
                Tap the + to start your first thread with the team.
              </Text>
            </View>
          )
        }
        renderItem={({ item }) => <ConversationRow conversation={item} />}
      />
    </SafeAreaView>
  );
}

function ConversationRow({ conversation }: { conversation: Conversation }) {
  const t = usePraxisTheme();
  const router = useRouter();
  const updated = new Date(conversation.updated_at);
  const ago = formatDistanceToNow(updated, { addSuffix: true });

  return (
    <Pressable
      onPress={() => router.push(`/(app)/chat/${conversation.id}`)}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingVertical: 14,
        paddingHorizontal: t.layout.screenPaddingX,
        backgroundColor: pressed ? t.colors.bgElevated : "transparent",
      })}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: t.colors.indigoSoft,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ChatCircleText size={18} color={t.colors.indigo500} />
      </View>
      <View style={{ flex: 1 }}>
        <Text variant="body" weight="medium" numberOfLines={1}>
          {conversation.title ?? "Untitled conversation"}
        </Text>
        <Text variant="bodySm" tone="tertiary" style={{ marginTop: 2 }}>
          {ago}
        </Text>
      </View>
    </Pressable>
  );
}
