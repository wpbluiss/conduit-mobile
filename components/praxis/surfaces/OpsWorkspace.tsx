import React from "react";
import { CheckSquare } from "phosphor-react-native";
import { WorkspaceCard } from "./WorkspaceCard";
import { EMPLOYEE_SURFACES } from "../../../lib/conduit/surfaces";

export function OpsWorkspace() {
  const surface = EMPLOYEE_SURFACES.ops;
  return (
    <WorkspaceCard
      kicker="ATTENTION QUEUE"
      title="Nothing on fire"
      body="Operations surfaces what needs your attention: stalled processes, vendor renewals, anomalies in connected systems. Once integrations are wired, the queue populates here. Ask Ops to audit a workflow or draft an SOP in the meantime."
      accent={surface.accentColor}
      accentSoft={surface.accentSoft}
      rightSlot={<CheckSquare size={16} color={surface.accentColor} weight="bold" />}
    />
  );
}
