import React from "react";
import { View } from "react-native";
import { CurrencyDollar } from "phosphor-react-native";
import { usePraxisTheme } from "../../../contexts/PraxisThemeContext";
import { Text } from "../Text";
import { WorkspaceCard } from "./WorkspaceCard";
import { EMPLOYEE_SURFACES } from "../../../lib/conduit/surfaces";

// P&L summary widget. No conduit_finance_snapshots table exists yet, so
// the four KPI cells render with em-dash placeholders. The structure
// demonstrates the surface — when the books-connector worker comes
// online and writes snapshots, the values populate without a layout
// change.

interface KpiCell {
  label: string;
  value: string;
  hint: string;
}

const KPIS: KpiCell[] = [
  { label: "MRR",          value: "—", hint: "Connect Stripe" },
  { label: "CASH",         value: "—", hint: "Connect bank" },
  { label: "RUNWAY",       value: "—", hint: "Months at current burn" },
  { label: "30-DAY BURN",  value: "—", hint: "Connect books" },
];

export function FinanceWorkspace() {
  const t = usePraxisTheme();
  const surface = EMPLOYEE_SURFACES.finance;

  return (
    <WorkspaceCard
      kicker="P&L SUMMARY"
      title="Books not connected"
      body="Connect QuickBooks, Stripe, or upload a CSV in Settings → Integrations. Until then, ask Finance to model a scenario or walk you through unit economics — that part doesn't need a feed."
      accent={surface.accentColor}
      accentSoft={surface.accentSoft}
      rightSlot={<CurrencyDollar size={16} color={surface.accentColor} weight="bold" />}
    >
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        {KPIS.map((k) => (
          <View
            key={k.label}
            style={{
              flexBasis: "47%",
              flexGrow: 1,
              paddingHorizontal: 12,
              paddingVertical: 10,
              borderRadius: t.radii.md,
              borderWidth: 0.5,
              borderColor: t.colors.borderSubtle,
              backgroundColor: t.colors.bgCanvas,
            }}
          >
            <Text
              variant="caption"
              weight="semibold"
              style={{ color: surface.accentColor, letterSpacing: 0.88 }}
            >
              {k.label}
            </Text>
            <Text
              variant="displayMd"
              family="display"
              weight="semibold"
              style={{ marginTop: 4 }}
            >
              {k.value}
            </Text>
            <Text
              variant="caption"
              tone="tertiary"
              style={{ marginTop: 2, letterSpacing: 0 }}
              numberOfLines={1}
            >
              {k.hint}
            </Text>
          </View>
        ))}
      </View>
    </WorkspaceCard>
  );
}
