import React from "react";
import { CurrencyDollar } from "phosphor-react-native";
import { WorkspaceCard } from "./WorkspaceCard";
import { EMPLOYEE_SURFACES } from "../../../lib/conduit/surfaces";

export function FinanceWorkspace() {
  const surface = EMPLOYEE_SURFACES.finance;
  return (
    <WorkspaceCard
      kicker="FINANCIALS"
      title="Books not connected"
      body="Finance surfaces MRR, runway, P&L, and pending invoices here once your books are wired up (Stripe, QuickBooks, or a CSV upload). Until then, ask Finance to model a scenario, walk you through unit economics, or draft a board update."
      accent={surface.accentColor}
      accentSoft={surface.accentSoft}
      rightSlot={<CurrencyDollar size={16} color={surface.accentColor} weight="bold" />}
    />
  );
}
