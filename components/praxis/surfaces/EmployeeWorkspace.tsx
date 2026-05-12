import React from "react";
import type { EmployeeId } from "../../../lib/conduit/employees";
import { DailyBriefWorkspace } from "./DailyBriefWorkspace";
import { BuildsWorkspace } from "./BuildsWorkspace";
import { PipelineWorkspace } from "./PipelineWorkspace";
import { MarketingWorkspace } from "./MarketingWorkspace";
import { FinanceWorkspace } from "./FinanceWorkspace";
import { OpsWorkspace } from "./OpsWorkspace";
import { ComplianceWorkspace } from "./ComplianceWorkspace";
import { HrWorkspace } from "./HrWorkspace";
import { LegalWorkspace } from "./LegalWorkspace";

export function EmployeeWorkspace({ employee }: { employee: EmployeeId }) {
  switch (employee) {
    case "atlas":
      return <DailyBriefWorkspace />;
    case "engineering":
      return <BuildsWorkspace />;
    case "sales":
      return <PipelineWorkspace />;
    case "marketing":
      return <MarketingWorkspace />;
    case "finance":
      return <FinanceWorkspace />;
    case "ops":
      return <OpsWorkspace />;
    case "compliance":
      return <ComplianceWorkspace />;
    case "hr":
      return <HrWorkspace />;
    case "legal":
      return <LegalWorkspace />;
    default:
      return null;
  }
}
