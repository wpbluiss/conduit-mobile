import React from "react";
import { Sparkle } from "phosphor-react-native";
import { WorkspaceCard } from "./WorkspaceCard";
import { EMPLOYEE_SURFACES } from "../../../lib/conduit/surfaces";

export function MarketingWorkspace() {
  const surface = EMPLOYEE_SURFACES.marketing;
  return (
    <WorkspaceCard
      kicker="ASSETS"
      title="No assets yet"
      body="Marketing assets you generate — ads, hero images, social cuts, blog drafts — will land in a gallery here. Image/video gen workers roll out in the next build. For now, ask Marketing to draft copy, plan campaigns, or critique creative."
      accent={surface.accentColor}
      accentSoft={surface.accentSoft}
      rightSlot={<Sparkle size={16} color={surface.accentColor} weight="bold" />}
    />
  );
}
