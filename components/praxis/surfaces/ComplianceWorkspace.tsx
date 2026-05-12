import React from "react";
import { ShieldCheck } from "phosphor-react-native";
import { WorkspaceCard } from "./WorkspaceCard";
import { EMPLOYEE_SURFACES } from "../../../lib/conduit/surfaces";

export function ComplianceWorkspace() {
  const surface = EMPLOYEE_SURFACES.compliance;
  return (
    <WorkspaceCard
      kicker="OBLIGATIONS"
      title="No active obligations tracked"
      body="Compliance tracks deadlines, audits, and policy gaps here once you've selected the frameworks that apply (HIPAA, SOC 2, GDPR). For now, ask Compliance to review a document, check a campaign for risk, or summarize a rule."
      accent={surface.accentColor}
      accentSoft={surface.accentSoft}
      rightSlot={<ShieldCheck size={16} color={surface.accentColor} weight="bold" />}
    />
  );
}
