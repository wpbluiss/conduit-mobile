import React from "react";
import { UsersThree } from "phosphor-react-native";
import { WorkspaceCard } from "./WorkspaceCard";
import { EMPLOYEE_SURFACES } from "../../../lib/conduit/surfaces";

export function HrWorkspace() {
  const surface = EMPLOYEE_SURFACES.hr;
  return (
    <WorkspaceCard
      kicker="PEOPLE"
      title="Hiring pipeline empty"
      body="HR surfaces open roles, candidate pipelines, onboarding queues, and performance check-ins here. Until you've opened a req, ask HR to draft a job description, design an interview loop, or sketch a comp band."
      accent={surface.accentColor}
      accentSoft={surface.accentSoft}
      rightSlot={<UsersThree size={16} color={surface.accentColor} weight="bold" />}
    />
  );
}
