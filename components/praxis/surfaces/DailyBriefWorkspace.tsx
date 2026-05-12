import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { format } from "date-fns";
import { usePraxisTheme } from "../../../contexts/PraxisThemeContext";
import { Text } from "../Text";
import { WorkspaceCard } from "./WorkspaceCard";
import { supabase } from "../../../lib/supabase";
import { getOrCreateAccount } from "../../../lib/conduit/account";
import { EMPLOYEE_SURFACES } from "../../../lib/conduit/surfaces";

interface DailyBrief {
  id: string;
  brief_date: string;
  title: string | null;
  summary: string | null;
  highlights: string[] | null;
  blockers: string[] | null;
  created_at: string;
}

export function DailyBriefWorkspace() {
  const t = usePraxisTheme();
  const surface = EMPLOYEE_SURFACES.atlas;
  const [brief, setBrief] = useState<DailyBrief | null>(null);
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
        .from("conduit_daily_briefs")
        .select("id, brief_date, title, summary, highlights, blockers, created_at")
        .eq("account_id", account.id)
        .order("brief_date", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!alive) return;
      if (!error && data) {
        setBrief({
          ...data,
          highlights: Array.isArray(data.highlights)
            ? (data.highlights as string[])
            : null,
          blockers: Array.isArray(data.blockers)
            ? (data.blockers as string[])
            : null,
        });
      }
      setLoaded(true);
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (!loaded) return null;

  if (!brief) {
    return (
      <WorkspaceCard
        kicker="DAILY BRIEF"
        title="No brief yet"
        body="Atlas compiles your cross-org brief at 06:00 each morning — pending builds, what Lunaro shipped, blockers across the workforce. Check back tomorrow, or ask Atlas now for an ad-hoc rundown."
        accent={surface.accentColor}
        accentSoft={surface.accentSoft}
        rightSlot={
          <Text variant="caption" tone="tertiary" style={{ letterSpacing: 0.4 }}>
            {format(new Date(), "MMM d").toUpperCase()}
          </Text>
        }
      />
    );
  }

  return (
    <WorkspaceCard
      kicker="DAILY BRIEF"
      title={brief.title ?? "Today"}
      body={brief.summary ?? "Atlas hasn't summarized today yet."}
      accent={surface.accentColor}
      accentSoft={surface.accentSoft}
      rightSlot={
        <Text variant="caption" tone="tertiary" style={{ letterSpacing: 0.4 }}>
          {format(new Date(brief.brief_date), "MMM d").toUpperCase()}
        </Text>
      }
    >
      {brief.highlights && brief.highlights.length > 0 ? (
        <View>
          <Text variant="caption" tone="tertiary" weight="semibold" style={{ marginBottom: 6 }}>
            HIGHLIGHTS
          </Text>
          {brief.highlights.slice(0, 3).map((h, i) => (
            <Text key={i} variant="bodySm" tone="primary" style={{ marginBottom: 4 }}>
              • {h}
            </Text>
          ))}
        </View>
      ) : null}
      {brief.blockers && brief.blockers.length > 0 ? (
        <View style={{ marginTop: 10 }}>
          <Text variant="caption" tone="tertiary" weight="semibold" style={{ marginBottom: 6 }}>
            BLOCKERS
          </Text>
          {brief.blockers.slice(0, 3).map((b, i) => (
            <Text key={i} variant="bodySm" style={{ color: t.colors.danger, marginBottom: 4 }}>
              • {b}
            </Text>
          ))}
        </View>
      ) : null}
    </WorkspaceCard>
  );
}
