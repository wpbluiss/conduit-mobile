import React from "react";
import { Scales } from "phosphor-react-native";
import { WorkspaceCard } from "./WorkspaceCard";
import { EMPLOYEE_SURFACES } from "../../../lib/conduit/surfaces";

export function LegalWorkspace() {
  const surface = EMPLOYEE_SURFACES.legal;
  return (
    <WorkspaceCard
      kicker="AGREEMENTS"
      title="No agreements on file"
      body="Legal tracks active contracts, trademark filings, and regulatory overlap here. Upload an NDA or service agreement to start; or ask Legal to review a contract, draft terms, or flag IP risk on a launch."
      accent={surface.accentColor}
      accentSoft={surface.accentSoft}
      rightSlot={<Scales size={16} color={surface.accentColor} weight="bold" />}
    />
  );
}
