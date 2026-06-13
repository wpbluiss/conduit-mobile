import React, { useEffect, useState } from "react";
import { View, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { GitBranch, CaretRight, Plus } from "phosphor-react-native";
import { formatDistanceToNow } from "date-fns";
import { usePraxisTheme } from "../../../contexts/PraxisThemeContext";
import { Text } from "../Text";
import { WorkspaceCard } from "./WorkspaceCard";
import { supabase } from "../../../lib/supabase";
import { getOrCreateAccount } from "../../../lib/conduit/account";
import { EMPLOYEE_SURFACES } from "../../../lib/conduit/surfaces";

interface BuildRow {
  id: string;
  build_name: string;
  status: string;
  live_url: string | null;
  created_at: string;
}

const STATUS_COLOR: Record<string, string> = {
  live: "#0E8A55",
  deploying: "#5B63E8",
  building: "#5B63E8",
  scaffolding: "#5B63E8",
  pending: "#7B8194",
  failed: "#C8412B",
  archived: "#7B8194",
};

export function BuildsWorkspace() {
  const t = usePraxisTheme();
  const router = useRouter();
  const surface = EMPLOYEE_SURFACES.engineering;
  const [builds, setBuilds] = useState<BuildRow[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const account = await getOrCreateAccount();
      if (!account || !alive) {
        if (alive) setLoaded(true);
        return;
      }
      const { data, error } = await supabase
        .from("conduit_builds")
        .select("id, build_name, status, live_url, created_at")
        .eq("account_id", account.id)
        .is("archived_at", null)
        .order("created_at", { ascending: false })
        .limit(5);
      if (!alive) return;
      if (!error && data) {
        setBuilds(data as BuildRow[]);
      }
      setLoaded(true);
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (!loaded) return null;

  if (builds.length === 0) {
    return (
      <WorkspaceCard
        kicker="RECENT BUILDS"
        title="No builds yet"
        body="Pick a template and Engineering will scaffold, build, and deploy it for you."
        accent={surface.accentColor}
        accentSoft={surface.accentSoft}
        rightSlot={<GitBranch size={16} color={surface.accentColor} weight="bold" />}
      >
        <Pressable
          onPress={() => router.push("/(app)/builds/new" as never)}
          style={({ pressed }) => ({
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            paddingVertical: 10,
            borderRadius: t.radii.md,
            backgroundColor: pressed ? surface.accentSoft : surface.accentColor,
          })}
        >
          <Plus size={14} color="#FFFFFF" weight="bold" />
          <Text variant="bodySm" weight="semibold" style={{ color: "#FFFFFF" }}>
            Choose a template
          </Text>
        </Pressable>
      </WorkspaceCard>
    );
  }

  return (
    <WorkspaceCard
      kicker="RECENT BUILDS"
      title={`${builds.length} active`}
      body="Engineering's recent work. Tap any row to open the build detail."
      accent={surface.accentColor}
      accentSoft={surface.accentSoft}
      rightSlot={<GitBranch size={16} color={surface.accentColor} weight="bold" />}
    >
      <View style={{ gap: 6 }}>
        {builds.map((b) => (
          <Pressable
            key={b.id}
            onPress={() => router.push(`/(app)/builds/${b.id}` as never)}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              paddingHorizontal: 12,
              paddingVertical: 10,
              borderRadius: t.radii.sm,
              backgroundColor: pressed ? t.colors.bgElevated : t.colors.bgCanvas,
              borderWidth: 0.5,
              borderColor: t.colors.borderSubtle,
            })}
          >
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: STATUS_COLOR[b.status] ?? "#7B8194",
              }}
            />
            <View style={{ flex: 1 }}>
              <Text variant="bodySm" weight="semibold" numberOfLines={1}>
                {b.build_name}
              </Text>
              <Text variant="caption" tone="tertiary" style={{ marginTop: 1, letterSpacing: 0.4 }}>
                {b.status.toUpperCase()} · {formatDistanceToNow(new Date(b.created_at), { addSuffix: true })}
              </Text>
            </View>
            <CaretRight size={12} color={t.colors.inkTertiary} weight="bold" />
          </Pressable>
        ))}
        <Pressable
          onPress={() => router.push("/(app)/builds/new" as never)}
          style={({ pressed }) => ({
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            paddingVertical: 9,
            borderRadius: t.radii.sm,
            backgroundColor: pressed ? surface.accentSoft : "transparent",
            borderWidth: 0.5,
            borderColor: surface.accentColor,
          })}
        >
          <Plus size={13} color={surface.accentColor} weight="bold" />
          <Text variant="bodySm" weight="semibold" style={{ color: surface.accentColor }}>
            New build
          </Text>
        </Pressable>
      </View>
    </WorkspaceCard>
  );
}
