import React, { useEffect, useState } from "react";
import { View, ScrollView } from "react-native";
import { TrendUp } from "phosphor-react-native";
import { usePraxisTheme } from "../../../contexts/PraxisThemeContext";
import { Text } from "../Text";
import { WorkspaceCard } from "./WorkspaceCard";
import { EMPLOYEE_SURFACES } from "../../../lib/conduit/surfaces";
import {
  getPipelineSnapshot,
  formatDollars,
  type PipelineSnapshot,
  type StageBucket,
} from "../../../lib/conduit/pipeline";

const COLUMNS: Array<{ key: StageBucket; label: string }> = [
  { key: "cold", label: "PROSPECTING" },
  { key: "working", label: "WORKING" },
  { key: "closing", label: "CLOSING" },
];

const MAX_PER_COLUMN = 3;

export function PipelineWorkspace() {
  const t = usePraxisTheme();
  const surface = EMPLOYEE_SURFACES.sales;
  const [snap, setSnap] = useState<PipelineSnapshot | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const data = await getPipelineSnapshot();
      if (!alive) return;
      setSnap(data);
      setLoaded(true);
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (!loaded) return null;

  if (!snap || snap.totalCount === 0) {
    return (
      <WorkspaceCard
        kicker="PIPELINE"
        title="Empty pipeline"
        body="Sales surfaces stage-by-stage kanban here. Connect HubSpot, Salesforce, or your Lunaro pipeline and the columns light up. In the meantime, ask Sales to draft outreach — that part doesn't need a CRM."
        accent={surface.accentColor}
        accentSoft={surface.accentSoft}
        rightSlot={<TrendUp size={16} color={surface.accentColor} weight="bold" />}
      />
    );
  }

  return (
    <WorkspaceCard
      kicker="PIPELINE"
      title={`${snap.totalCount} open · ${formatDollars(snap.totalValueCents)}`}
      body=""
      accent={surface.accentColor}
      accentSoft={surface.accentSoft}
      rightSlot={<TrendUp size={16} color={surface.accentColor} weight="bold" />}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 10, paddingRight: 4 }}
      >
        {COLUMNS.map((col) => {
          const cards = snap.byBucket[col.key].slice(0, MAX_PER_COLUMN);
          return (
            <View
              key={col.key}
              style={{
                width: 200,
                padding: 10,
                borderRadius: t.radii.md,
                borderWidth: 0.5,
                borderColor: t.colors.borderSubtle,
                backgroundColor: t.colors.bgCanvas,
                gap: 8,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Text
                  variant="caption"
                  weight="semibold"
                  style={{ color: surface.accentColor, letterSpacing: 0.88 }}
                >
                  {col.label}
                </Text>
                <Text
                  variant="caption"
                  tone="tertiary"
                  style={{ letterSpacing: 0 }}
                >
                  {snap.byBucket[col.key].length}
                </Text>
              </View>

              {cards.length === 0 ? (
                <Text variant="caption" tone="tertiary" style={{ letterSpacing: 0 }}>
                  No leads here yet.
                </Text>
              ) : (
                cards.map((c) => (
                  <View
                    key={c.id}
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 8,
                      borderRadius: t.radii.sm,
                      backgroundColor: t.colors.bgSurface,
                      borderWidth: 0.5,
                      borderColor: t.colors.borderSubtle,
                    }}
                  >
                    <Text
                      variant="bodySm"
                      weight="semibold"
                      numberOfLines={1}
                    >
                      {c.name}
                    </Text>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginTop: 4,
                      }}
                    >
                      <Text
                        variant="caption"
                        tone="tertiary"
                        style={{ letterSpacing: 0 }}
                      >
                        {c.stage.replace(/_/g, " ")}
                      </Text>
                      <Text
                        variant="caption"
                        weight="semibold"
                        style={{ color: surface.accentColor, letterSpacing: 0 }}
                      >
                        {formatDollars(c.valueCents)}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          );
        })}
      </ScrollView>
    </WorkspaceCard>
  );
}
