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
import { format, isToday, isYesterday, subDays } from "date-fns";
import { ArrowLeft, PencilSimple, ChatCircle } from "phosphor-react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { usePraxisTheme } from "../../../contexts/PraxisThemeContext";
import { Text } from "../../../components/praxis/Text";
import { useReduceMotion } from "../../../hooks/useReduceMotion";
import {
  listConversationsPaged,
} from "../../../lib/conduit/conversations";
import type { Conversation } from "../../../lib/conduit/types";

const PAGE_SIZE = 20;
const END_REACHED_THRESHOLD = 3 / PAGE_SIZE;

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  if (isToday(d)) return format(d, "h:mm a");
  if (isYesterday(d)) return "Yesterday";
  if (d > subDays(new Date(), 7)) return format(d, "EEE");
  return format(d, "MMM d");
}

function SkeletonRow({ pulse }: { pulse: ReturnType<typeof useSharedValue<number>> }) {
  const t = usePraxisTheme();
  const style = useAnimatedStyle(() => ({ opacity: pulse.value }));
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 0.5,
        borderBottomColor: t.colors.borderSubtle,
      }}
    >
      <Animated.View
        style={[
          {
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: t.colors.bgElevated,
          },
          style,
        ]}
      />
      <View style={{ flex: 1, gap: 6 }}>
        <Animated.View
          style={[
            { height: 14, borderRadius: 7, backgroundColor: t.colors.bgElevated, width: "60%" },
            style,
          ]}
        />
        <Animated.View
          style={[
            { height: 12, borderRadius: 6, backgroundColor: t.colors.bgElevated, width: "80%" },
            style,
          ]}
        />
      </View>
    </View>
  );
}

function LoadingSkeleton() {
  const reduceMotion = useReduceMotion();
  const pulse = useSharedValue(0.3);

  useEffect(() => {
    if (reduceMotion) {
      pulse.value = withTiming(0.5, { duration: 0 });
      return;
    }
    pulse.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 700 }),
        withTiming(0.3, { duration: 700 }),
      ),
      -1,
      false,
    );
  }, [pulse, reduceMotion]);

  return (
    <View>
      {Array.from({ length: 8 }).map((_, i) => (
        <SkeletonRow key={i} pulse={pulse} />
      ))}
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
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 0.5,
        borderBottomColor: t.colors.borderSubtle,
        backgroundColor: pressed ? t.colors.bgElevated : "transparent",
      })}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: t.colors.indigoSoft,
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <ChatCircle size={18} color={t.colors.indigo500} weight="fill" />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text
            variant="body"
            weight="semibold"
            numberOfLines={1}
            style={{ flex: 1 }}
          >
            {item.title ?? "Untitled"}
          </Text>
          <Text
            tone="tertiary"
            style={{ fontFamily: "Inter", fontSize: 12, lineHeight: 16 }}
          >
            {formatTimestamp(item.updated_at)}
          </Text>
        </View>
        {item.last_message_preview ? (
          <Text
            tone="tertiary"
            numberOfLines={1}
            style={{ fontFamily: "Inter", fontSize: 13, lineHeight: 18, marginTop: 2 }}
          >
            {item.last_message_preview}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

export default function ConversationListScreen() {
  const t = usePraxisTheme();
  const router = useRouter();

  const [items, setItems] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [paginating, setPaginating] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const offsetRef = useRef(0);
  const fetchingRef = useRef(false);

  const fetchPage = useCallback(async (reset: boolean) => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;

    const offset = reset ? 0 : offsetRef.current;

    try {
      const page = await listConversationsPaged(PAGE_SIZE, offset);
      setErrorMsg(null);

      if (reset) {
        setItems(page.items);
        offsetRef.current = page.items.length;
      } else {
        setItems((prev) => {
          const ids = new Set(prev.map((c) => c.id));
          const fresh = page.items.filter((c) => !ids.has(c.id));
          offsetRef.current = prev.length + fresh.length;
          return [...prev, ...fresh];
        });
      }
      setHasMore(page.hasMore);
    } catch {
      setErrorMsg("Couldn't load conversations. Tap to retry.");
    } finally {
      fetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await fetchPage(true);
      setLoading(false);
    })();
  }, [fetchPage]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPage(true);
    setRefreshing(false);
  }, [fetchPage]);

  const handleEndReached = useCallback(async () => {
    if (!hasMore || paginating || loading) return;
    setPaginating(true);
    await fetchPage(false);
    setPaginating(false);
  }, [hasMore, paginating, loading, fetchPage]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.bgCanvas }} edges={["top"]}>
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
          style={({ pressed }) => ({
            width: 36,
            height: 36,
            borderRadius: 18,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: pressed ? t.colors.bgElevated : "transparent",
          })}
        >
          <ArrowLeft size={20} color={t.colors.inkPrimary} />
        </Pressable>
        <Text
          variant="body"
          weight="semibold"
          style={{ flex: 1, textAlign: "center" }}
        >
          Conversations
        </Text>
        <Pressable
          onPress={() => router.push("/(app)/chat/new" as never)}
          hitSlop={10}
          style={({ pressed }) => ({
            width: 36,
            height: 36,
            borderRadius: 18,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: pressed ? t.colors.bgElevated : "transparent",
          })}
        >
          <PencilSimple size={18} color={t.colors.inkPrimary} weight="fill" />
        </Pressable>
      </View>

      {loading ? (
        <LoadingSkeleton />
      ) : errorMsg ? (
        <Pressable
          onPress={() => {
            setLoading(true);
            fetchPage(true).then(() => setLoading(false));
          }}
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            paddingHorizontal: 32,
          }}
        >
          <Text tone="tertiary" align="center">
            {errorMsg}
          </Text>
          <Text tone="indigo" weight="semibold">
            Retry
          </Text>
        </Pressable>
      ) : items.length === 0 ? (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            paddingHorizontal: 40,
          }}
        >
          <ChatCircle size={40} color={t.colors.inkTertiary} weight="duotone" />
          <Text variant="body" weight="semibold" align="center">
            No conversations yet
          </Text>
          <Text variant="bodySm" tone="tertiary" align="center">
            Start chatting with Praxis to see your history here.
          </Text>
          <Pressable
            onPress={() => router.push("/(app)/chat/new" as never)}
            style={({ pressed }) => ({
              marginTop: 8,
              paddingHorizontal: 20,
              paddingVertical: 10,
              borderRadius: t.radii.md,
              backgroundColor: pressed ? t.colors.indigo500 : t.colors.indigo500,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Text variant="body" weight="semibold" style={{ color: "#fff" }}>
              Start a conversation
            </Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(c) => c.id}
          renderItem={({ item }) => (
            <ConversationRow
              item={item}
              onPress={() => router.push(`/(app)/chat/${item.id}` as never)}
            />
          )}
          onEndReached={handleEndReached}
          onEndReachedThreshold={END_REACHED_THRESHOLD}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={t.colors.indigo500}
            />
          }
          ListFooterComponent={
            paginating ? (
              <View style={{ paddingVertical: 16, alignItems: "center" }}>
                <ActivityIndicator size="small" color={t.colors.indigo500} />
              </View>
            ) : null
          }
          contentContainerStyle={{ paddingBottom: 24 }}
        />
      )}
    </SafeAreaView>
  );
}
