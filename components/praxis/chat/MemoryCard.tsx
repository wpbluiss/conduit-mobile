import React, { useEffect, useRef, useState } from "react";
import { View, Pressable } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import * as SecureStore from "expo-secure-store";
import { CaretDown, CaretUp, X } from "phosphor-react-native";
import { usePraxisTheme } from "../../../contexts/PraxisThemeContext";
import { Text } from "../Text";
import { listMemory, archiveMemory } from "../../../lib/conduit/memory";
import type { MemoryRecord } from "../../../lib/conduit/types";

const OPEN_HEIGHT = 200;
const ANIM_MS = 50;

function storeKey(id: string): string {
  return `praxis:memory-card:${id}:state`;
}

export interface MemoryCardProps {
  conversationId: string | null;
  /** Increment to trigger a debounced memory refresh (e.g. on message send). */
  messageCount: number;
}

export function MemoryCard({ conversationId, messageCount }: MemoryCardProps) {
  const t = usePraxisTheme();
  const [facts, setFacts] = useState<MemoryRecord[]>([]);
  const [collapsed, setCollapsed] = useState(true);
  const maxH = useSharedValue(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Restore persisted collapse preference per conversation
  useEffect(() => {
    if (!conversationId) return;
    SecureStore.getItemAsync(storeKey(conversationId))
      .then((val) => {
        const open = val === "expanded";
        setCollapsed(!open);
        maxH.value = open ? OPEN_HEIGHT : 0;
      })
      .catch(() => {});
  // Intentionally omits maxH from deps — it's a stable ref
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  // Debounced memory fetch: fires 500 ms after any message arrives
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const records = await listMemory();
      setFacts(records.slice(0, 3));
    }, 500);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [messageCount]);

  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    maxH.value = withTiming(next ? 0 : OPEN_HEIGHT, { duration: ANIM_MS });
    if (conversationId) {
      SecureStore.setItemAsync(
        storeKey(conversationId),
        next ? "collapsed" : "expanded",
      ).catch(() => {});
    }
  };

  const dismiss = (id: string) => {
    archiveMemory(id).catch(() => {});
    setFacts((prev) => prev.filter((f) => f.id !== id));
  };

  const bodyStyle = useAnimatedStyle(() => ({ maxHeight: maxH.value }));

  if (facts.length === 0) return null;

  return (
    <View
      style={{
        marginHorizontal: 12,
        marginBottom: 2,
        borderRadius: t.radii.md,
        borderWidth: 1,
        borderColor: t.colors.borderSubtle,
        backgroundColor: t.colors.bgSurface,
        overflow: "hidden",
      }}
    >
      <Pressable
        onPress={toggle}
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 12,
          paddingVertical: 8,
          gap: 6,
        }}
      >
        <Text variant="caption" tone="tertiary" style={{ flex: 1, letterSpacing: 0.5 }}>
          {`MEMORY · ${facts.length} ${facts.length === 1 ? "FACT" : "FACTS"}`}
        </Text>
        {collapsed ? (
          <CaretDown size={12} color={t.colors.inkTertiary} />
        ) : (
          <CaretUp size={12} color={t.colors.inkTertiary} />
        )}
      </Pressable>

      <Animated.View style={[bodyStyle, { overflow: "hidden" }]}>
        <View
          style={{
            borderTopWidth: 0.5,
            borderTopColor: t.colors.borderSubtle,
          }}
        >
          {facts.map((fact, i) => (
            <View
              key={fact.id}
              style={{
                flexDirection: "row",
                alignItems: "flex-start",
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderTopWidth: i > 0 ? 0.5 : 0,
                borderTopColor: t.colors.borderSubtle,
                gap: 8,
              }}
            >
              <Text variant="caption" tone="tertiary" style={{ lineHeight: 16, marginTop: 1 }}>
                {"•"}
              </Text>
              <Text variant="caption" tone="secondary" style={{ flex: 1, lineHeight: 16 }}>
                {fact.content}
              </Text>
              <Pressable onPress={() => dismiss(fact.id)} hitSlop={8}>
                <X size={12} color={t.colors.inkTertiary} />
              </Pressable>
            </View>
          ))}
        </View>
      </Animated.View>
    </View>
  );
}
