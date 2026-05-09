import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, ScrollView, Pressable, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, ArrowSquareOut, GithubLogo, Globe, CircleNotch } from "phosphor-react-native";
import { usePraxisTheme } from "../../../contexts/PraxisThemeContext";
import { Text } from "../../../components/praxis";
import {
  getBuild,
  getBuildLogs,
  subscribeToBuildLogs,
  subscribeToBuildStatus,
} from "../../../lib/conduit/builds";
import type { BuildSession, EngineeringLog } from "../../../lib/conduit/types";

export default function BuildDetailScreen() {
  const t = usePraxisTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();

  const [build, setBuild] = useState<BuildSession | null>(null);
  const [logs, setLogs] = useState<EngineeringLog[]>([]);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [b, l] = await Promise.all([getBuild(params.id), getBuildLogs(params.id)]);
      if (!alive) return;
      setBuild(b);
      setLogs(l);
    })();
    return () => {
      alive = false;
    };
  }, [params.id]);

  useEffect(() => {
    const unsubLogs = subscribeToBuildLogs(params.id, (log) => {
      setLogs((prev) => (prev.some((p) => p.id === log.id) ? prev : [...prev, log]));
    });
    const unsubStatus = subscribeToBuildStatus(params.id, (b) => setBuild(b));
    return () => {
      unsubLogs();
      unsubStatus();
    };
  }, [params.id]);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [logs.length]);

  const isInFlight =
    build && ["pending", "scaffolding", "building", "deploying"].includes(build.status);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.bgCanvas }} edges={["top"]}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          paddingHorizontal: 8,
          paddingVertical: 8,
          borderBottomColor: t.colors.borderSubtle,
          borderBottomWidth: 0.5,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          style={{ width: 36, height: 36, alignItems: "center", justifyContent: "center" }}
        >
          <ArrowLeft size={20} color={t.colors.inkPrimary} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text variant="caption" tone="tertiary">
            BUILD
          </Text>
          <Text variant="bodyLg" weight="semibold" numberOfLines={1}>
            {build?.build_name ?? "Loading…"}
          </Text>
        </View>
        {isInFlight ? <CircleNotch size={18} color={t.colors.indigo500} /> : null}
      </View>

      <View style={{ paddingHorizontal: t.layout.screenPaddingX, paddingTop: 16, gap: 8 }}>
        {build?.live_url ? (
          <ResourceRow
            icon={<Globe size={16} color={t.colors.indigo500} />}
            label="Live URL"
            value={build.live_url}
            onPress={() => Linking.openURL(build.live_url!).catch(() => {})}
          />
        ) : null}
        {build?.github_repo_url ? (
          <ResourceRow
            icon={<GithubLogo size={16} color={t.colors.inkPrimary} />}
            label="Repository"
            value={build.github_repo_url}
            onPress={() => Linking.openURL(build.github_repo_url!).catch(() => {})}
          />
        ) : null}
        {build?.error_message ? (
          <View
            style={{
              borderRadius: t.radii.md,
              padding: 12,
              borderWidth: 1,
              borderColor: t.colors.danger,
              backgroundColor: "rgba(200, 65, 43, 0.06)",
            }}
          >
            <Text variant="caption" tone="danger" weight="semibold">
              ERROR
            </Text>
            <Text variant="bodySm" style={{ marginTop: 4 }}>
              {build.error_message}
            </Text>
          </View>
        ) : null}
      </View>

      <View
        style={{
          paddingHorizontal: t.layout.screenPaddingX,
          paddingTop: 16,
          paddingBottom: 4,
        }}
      >
        <Text variant="caption" tone="tertiary" weight="semibold">
          ENGINEERING LOGS
        </Text>
      </View>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{
          paddingHorizontal: t.layout.screenPaddingX,
          paddingBottom: 32,
        }}
      >
        {logs.length === 0 ? (
          <Text variant="body" tone="tertiary" style={{ marginTop: 16 }}>
            Waiting on Engineering…
          </Text>
        ) : (
          logs.map((log) => (
            <View
              key={log.id}
              style={{
                flexDirection: "row",
                alignItems: "flex-start",
                gap: 10,
                paddingVertical: 8,
                borderBottomColor: t.colors.borderSubtle,
                borderBottomWidth: 0.5,
              }}
            >
              <View
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  marginTop: 8,
                  backgroundColor:
                    log.status === "failed"
                      ? t.colors.danger
                      : log.status === "completed"
                        ? t.colors.success
                        : t.colors.indigo500,
                }}
              />
              <View style={{ flex: 1 }}>
                <Text variant="bodySm" weight="medium">
                  {log.step}
                </Text>
                {log.detail ? (
                  <Text family="mono" variant="caption" tone="tertiary" style={{ marginTop: 2 }}>
                    {log.detail}
                  </Text>
                ) : null}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function ResourceRow({
  icon,
  label,
  value,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onPress: () => void;
}) {
  const t = usePraxisTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: t.radii.md,
        backgroundColor: pressed ? t.colors.bgElevated : t.colors.bgSurface,
        borderWidth: 1,
        borderColor: t.colors.borderSubtle,
      })}
    >
      {icon}
      <View style={{ flex: 1 }}>
        <Text variant="caption" tone="tertiary" weight="semibold">
          {label.toUpperCase()}
        </Text>
        <Text variant="bodySm" numberOfLines={1}>
          {value}
        </Text>
      </View>
      <ArrowSquareOut size={14} color={t.colors.inkTertiary} />
    </Pressable>
  );
}
