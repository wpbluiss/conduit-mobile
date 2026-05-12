import React from "react";
import { TrendUp } from "phosphor-react-native";
import { WorkspaceCard } from "./WorkspaceCard";
import { EMPLOYEE_SURFACES } from "../../../lib/conduit/surfaces";

export function PipelineWorkspace() {
  const surface = EMPLOYEE_SURFACES.sales;
  return (
    <WorkspaceCard
      kicker="PIPELINE"
      title="Connect your CRM"
      body="Sales surfaces pipeline value, stage breakdown, and stall flags here. Connect HubSpot, Salesforce, or your CSV in Settings → Integrations and the dashboard lights up. In the meantime, ask Sales to draft outreach or work an existing deal — that part doesn't need a CRM."
      accent={surface.accentColor}
      accentSoft={surface.accentSoft}
      rightSlot={<TrendUp size={16} color={surface.accentColor} weight="bold" />}
    />
  );
}
