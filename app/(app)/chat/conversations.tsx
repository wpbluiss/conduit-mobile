import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, PencilSimple } from "phosphor-react-native";
import { format, isToday, isYesterday } from "date-fns";
import { usePraxisTheme } from "../../../contexts/PraxisThemeContext";
import { Text } from "../../../components/praxis";
import {
  listConversationsPaged,
} from "../../../lib/conduit/conversations";
import { getEmployee } from "../../../lib/conduit/employees";
import type { Conversation } from "../../../lib/conduit/types";

function formatTs(iso: string): string {
  const d = new Date(iso);
  if (isToday(d)) return format(d, "h:mm a");
  if (isYesterday(d)) return "Yesterday";
  return format(d, "MMM d");
}

function ConversationSkeleton() {
  const t = usePraxisTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 0.5,
        borderBottomColor: t.colors.borderSubtle,
        gap: 12,
      }}
    >
      <View
        style={{
          width: 4,
          height: 44,
          borderRadius: 2,
          backgroundColor: t.colors.bgElevated,
        }}
      />
      <View style={{ flex: 1, gap: 8 }}>
        <View
          style={{
            height: 14,
            borderRadius: 7,
            backgroundColor: t.colors.bgElevated,
            width: "60%",
          }}
        />
        <View
          style={{
            height: 11,
            borderRadius: 5,
            backgroundColor: t.colors.bgElevated,
            width: "85%",
          }}
        />
      </View>
    </View>
  );
}

function ConversationRow({
  item,
  onPress,
}: {
  item: Conversation;
  onPress: () => void;
}) {
  const t = usePraxisTheme();
  const emp = getEmployee(item.dominant_employee ?? null);
  const accentColor = emp?.ringColor ?? t.colors.borderDefault;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 0.5,
        borderBottomColor: t.colors.borderSubtle,
        backgroundColor: pressed ? t.colors.bgElevated : "transparent",
        gap: 12,
      })}
    >
      <View
        style={{
          width: 4,
          alignSelf: "stretch",
          borderRadius: 2,
          backgroundColor: accentColor,
          opacity: 0.7,
          minHeight: 36,
        }}
      />
      <View style={{ flex: 1, minWidth: 0 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            marginBottom: 3,
          }}
        >
          <Text
            variant="body"
            weight="semibold"
            numberOfLines={1}
            style={{ flex: 1 }}
          >
            {item.title ?? "Untitled"}
          </Text>
          <Text
            style={{
              fontFamily: t.fonts.body,
              fontSize: 12,
              lineHeight: 16,
              color: t.colors.inkTertiary,
              letterSpacing: 0,
            }}
          >
            {formatTs(item.updated_at)}
          </Text>
        </View>
        {item.last_message_preview ? (
          <Text
            variant="bodySm"
            tone="tertiary"
            numberOfLines={2}
          >
            {item.last_message_preview}
          </Text>
        ) : (
          <Text variant="bodySm" tone="tertiary">
            No messages yet
          </Text>
        )}
      </View>
    </Pressable>
  );
}

export default function ConversationsScreen() {
  const t = usePraxisTheme();
  const router = useRouter();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const offsetRef = useRef(0);
  const hasMoreRef = useRef(true);

  const fetchPage = useCallback(async (offset: number, replace: boolean) => {
    if (replace) setLoading(true);
    setError(null);

    const result = await listConversationsPaged(offset);

    if (replace) {
      setConversations(result.conversations);
      setLoading(false);
    } else {
      setConversations((prev) => {
        const ids = new Set(prev.map((c) => c.id));
        const fresh = result.conversations.filter((c) => !ids.has(c.id));
        return [...prev, ...fresh];
      });
      setLoadingMore(false);
    }
    setHasMore(result.hasMore);
    hasMoreRef.current = result.hasMore;
    offsetRef.current = offset + result.conversations.length;
  }, []);

  useEffect(() => {
    fetchPage(0, true);
  }, [fetchPage]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    offsetRef.current = 0;
    hasMoreRef.current = true;
    await fetchPage(0, false);
    setRefreshing(false);
  }, [fetchPage]);

  const handleLoadMore = useCallback(() => {
    if (!hasMoreRef.current || loadingMore || refreshing) return;
    setLoadingMore(true);
    fetchPage(offsetRef.current, false);
  }, [fetchPage, loadingMore, refreshing]);

  const handleSelectConversation = useCallback(
    (id: string) => {
      router.push(`/(app)/chat/${id}` as never);
    },
    [router],
  );

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: t.colors.bgCanvas }}
      edges={["top"]}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 8,
          paddingVertical: 8,
          borderBottomWidth: 0.5,
          borderBottomColor: t.colors.borderSubtle,
        }}
      >
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
        <Text
          variant="caption"
          tone="indigo"
          weight="semibold"
          style={{ flex: 1, textAlign: "center" }}
        >
          ALL CONVERSATIONS
        </Text>
        <Pressable
          onPress={() => router.push("/(app)/chat/new" as never)}
          hitSlop={10}
          style={{
            width: 36,
            height: 36,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <PencilSimple size={18} color={t.colors.inkPrimary} weight="fill" />
        </Pressable>
      </View>

      {/* Content */}
      {loading ? (
        <View>
          {Array.from({ length: 8 }).map((_, i) => (
            <ConversationSkeleton key={i} />
          ))}
        </View>
      ) : error ? (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 32,
            gap: 12,
          }}
        >
          <Text variant="body" tone="secondary" align="center">
            {error}
          </Text>
          <Pressable onPress={() => fetchPage(0, true)}>
            <Text variant="body" tone="indigo" weight="semibold">
              Try again
            </Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(c) => c.id}
          renderItem={({ item }) => (
            <ConversationRow
              item={item}
              onPress={() => handleSelectConversation(item.id)}
            />
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={t.colors.indigo500}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.2}
          ListEmptyComponent={
            <View
              style={{
                paddingTop: 48,
                paddingHorizontal: 32,
                alignItems: "center",
                gap: 8,
              }}
            >
              <Text variant="body" weight="semibold">
                No conversations yet
              </Text>
              <Text variant="bodySm" tone="tertiary" align="center">
                Start a new chat and it will appear here.
              </Text>
            </View>
          }
          ListFooterComponent={
            loadingMore ? (
              <View style={{ paddingVertical: 20, alignItems: "center" }}>
                <ActivityIndicator size="small" color={t.colors.indigo500} />
              </View>
            ) : null
          }
          contentContainerStyle={{ flexGrow: 1 }}
        />
      )}
    </SafeAreaView>
  );
}
