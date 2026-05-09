import React, { useCallback, useState } from "react";
import { View, FlatList, RefreshControl, Pressable, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { ArrowLeft, Brain, Trash } from "phosphor-react-native";
import { usePraxisTheme } from "../../../contexts/PraxisThemeContext";
import { Text } from "../../../components/praxis";
import { archiveMemory, listMemory } from "../../../lib/conduit/memory";
import type { MemoryRecord } from "../../../lib/conduit/types";

export default function MemorySettingsScreen() {
  const t = usePraxisTheme();
  const router = useRouter();
  const [items, setItems] = useState<MemoryRecord[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    const data = await listMemory();
    setItems(data);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchAll();
    }, [fetchAll]),
  );

  const onArchive = (id: string) => {
    Alert.alert("Forget this?", "Atlas won't remember this fact going forward.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Forget",
        style: "destructive",
        onPress: async () => {
          await archiveMemory(id);
          setItems((prev) => prev.filter((m) => m.id !== id));
        },
      },
    ]);
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

      <View style={{ paddingHorizontal: t.layout.screenPaddingX, marginBottom: 12 }}>
        <Text variant="caption" tone="indigo" weight="semibold">
          MEMORY
        </Text>
        <Text variant="displayLg" family="display" weight="semibold">
          What Atlas remembers
        </Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={(m) => m.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAll(); }} tintColor={t.colors.indigo500} />
        }
        contentContainerStyle={{
          paddingHorizontal: t.layout.screenPaddingX,
          paddingBottom: 32,
          gap: 10,
        }}
        ListEmptyComponent={
          loading ? null : (
            <View style={{ alignItems: "center", paddingTop: 32 }}>
              <Brain size={32} color={t.colors.inkTertiary} />
              <Text variant="body" tone="tertiary" align="center" style={{ marginTop: 8 }}>
                Memory builds up as you talk. Nothing stored yet.
              </Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <View
            style={{
              padding: 14,
              borderRadius: t.radii.md,
              backgroundColor: t.colors.bgSurface,
              borderWidth: 1,
              borderColor: t.colors.borderSubtle,
              flexDirection: "row",
              alignItems: "flex-start",
              gap: 10,
            }}
          >
            <View style={{ flex: 1 }}>
              <Text variant="caption" tone="tertiary" weight="semibold">
                {(item.kind ?? "fact").toUpperCase()}
              </Text>
              <Text variant="body" style={{ marginTop: 4 }}>
                {item.content}
              </Text>
            </View>
            <Pressable onPress={() => onArchive(item.id)} hitSlop={8}>
              <Trash size={16} color={t.colors.inkTertiary} />
            </Pressable>
          </View>
        )}
      />
    </SafeAreaView>
  );
}
