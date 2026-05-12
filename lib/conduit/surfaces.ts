// Per-employee surface registry.
//
// Each AI employee in the Praxis Console gets its own workspace surface
// rather than a generic "@employee mention" chat. The surface defines:
//   - signature color (R14 jewel-tone palette)
//   - signature Lucide icon
//   - hero kicker / title that replaces the generic "Good evening" header
//   - quick-start chips tuned to the employee's actual job
//   - workspace area kind that decides which scaffold renders above chat
//
// The workspace areas themselves are implemented in
// `components/praxis/surfaces/*` and dispatched by `EmployeeWorkspace.tsx`.

import {
  Compass,
  Code2,
  TrendingUp,
  Sparkles,
  Banknote,
  Settings2,
  ShieldCheck,
  Users2,
  Scale,
} from "lucide-react-native";
import type { EmployeeId } from "./employees";

export type WorkspaceKind =
  | "daily-brief"
  | "builds"
  | "pipeline"
  | "marketing"
  | "finance"
  | "ops"
  | "compliance"
  | "hr"
  | "legal";

type LucideIcon = typeof Compass;

export interface EmployeeSurface {
  id: EmployeeId;
  name: string;
  title: string;
  // Header rendered above the workspace, e.g. "ATLAS · CHIEF OF STAFF".
  kicker: string;
  // Tagline shown under the kicker, e.g. "Routes work across your AI workforce."
  tagline: string;
  // Brand color. Used for the hero badge, accent strokes, and chat header
  // tint when this employee is the dominant or routed responder.
  accentColor: string;
  // Lighter background derivative — used as a soft fill behind the hero.
  // Generated as a 10% alpha overlay of accentColor at runtime.
  accentSoft: string;
  // The Lucide icon for the avatar and surface hero.
  Icon: LucideIcon;
  // Quick-start chips. 3-4 chips. Each tap pre-fills the composer.
  quickChips: string[];
  // Which workspace scaffold renders above the composer.
  workspace: WorkspaceKind;
}

export const EMPLOYEE_SURFACES: Record<EmployeeId, EmployeeSurface> = {
  atlas: {
    id: "atlas",
    name: "Atlas",
    title: "Chief of Staff",
    kicker: "ATLAS · CHIEF OF STAFF",
    tagline: "Routes work, holds context, runs the workspace.",
    accentColor: "#6D28D9",
    accentSoft: "rgba(109, 40, 217, 0.12)",
    Icon: Compass,
    quickChips: [
      "Brief me on what's pending.",
      "What did Lunaro ship today?",
      "Show me this week's builds.",
      "What's blocking me right now?",
    ],
    workspace: "daily-brief",
  },
  engineering: {
    id: "engineering",
    name: "Engineering",
    title: "Build & Ship",
    kicker: "ENGINEERING · BUILD & SHIP",
    tagline: "Generates apps, reviews code, ships to production.",
    accentColor: "#5B63E8",
    accentSoft: "rgba(91, 99, 232, 0.12)",
    Icon: Code2,
    quickChips: [
      "Show me recent builds.",
      "What's deploying now?",
      "Open my pull requests.",
      "Run a build for me.",
    ],
    workspace: "builds",
  },
  sales: {
    id: "sales",
    name: "Sales",
    title: "Pipeline & Close",
    kicker: "SALES · PIPELINE & CLOSE",
    tagline: "Outbound, qualification, and revenue execution.",
    accentColor: "#0E8A55",
    accentSoft: "rgba(14, 138, 85, 0.12)",
    Icon: TrendingUp,
    quickChips: [
      "Show pipeline value.",
      "Hottest leads this week.",
      "Draft a follow-up.",
      "Who's stalled?",
    ],
    workspace: "pipeline",
  },
  marketing: {
    id: "marketing",
    name: "Marketing",
    title: "Brand & Demand",
    kicker: "MARKETING · BRAND & DEMAND",
    tagline: "Campaigns, copy, ads, and positioning.",
    accentColor: "#D67817",
    accentSoft: "rgba(214, 120, 23, 0.14)",
    Icon: Sparkles,
    quickChips: [
      "Generate an ad creative.",
      "Draft a blog post.",
      "Show recent campaigns.",
      "Plan the next launch.",
    ],
    workspace: "marketing",
  },
  finance: {
    id: "finance",
    name: "Finance",
    title: "Books & Forecast",
    kicker: "FINANCE · BOOKS & FORECAST",
    tagline: "Treasury, runway, P&L, and financial modeling.",
    accentColor: "#B7791F",
    accentSoft: "rgba(183, 121, 31, 0.14)",
    Icon: Banknote,
    quickChips: [
      "Show MRR.",
      "Cash runway.",
      "Pending invoices.",
      "Draft a P&L.",
    ],
    workspace: "finance",
  },
  ops: {
    id: "ops",
    name: "Operations",
    title: "Systems & Process",
    kicker: "OPERATIONS · SYSTEMS & PROCESS",
    tagline: "Workflows, integrations, vendor rigor.",
    accentColor: "#0E7490",
    accentSoft: "rgba(14, 116, 144, 0.14)",
    Icon: Settings2,
    quickChips: [
      "What needs my attention?",
      "System status.",
      "Vendor renewals.",
      "Run a process audit.",
    ],
    workspace: "ops",
  },
  compliance: {
    id: "compliance",
    name: "Compliance",
    title: "Risk & Controls",
    kicker: "COMPLIANCE · RISK & CONTROLS",
    tagline: "Policies, audits, regulatory posture.",
    accentColor: "#C8412B",
    accentSoft: "rgba(200, 65, 43, 0.13)",
    Icon: ShieldCheck,
    quickChips: [
      "Compliance check this.",
      "Active obligations.",
      "Show the audit log.",
      "What's our risk score?",
    ],
    workspace: "compliance",
  },
  hr: {
    id: "hr",
    name: "HR",
    title: "People & Culture",
    kicker: "HR · PEOPLE & CULTURE",
    tagline: "Hiring, onboarding, team experience.",
    accentColor: "#BE3A87",
    accentSoft: "rgba(190, 58, 135, 0.14)",
    Icon: Users2,
    quickChips: [
      "Hiring pipeline.",
      "Team updates.",
      "Onboarding queue.",
      "Performance check-ins.",
    ],
    workspace: "hr",
  },
  legal: {
    id: "legal",
    name: "Legal",
    title: "Counsel & Contracts",
    kicker: "LEGAL · COUNSEL & CONTRACTS",
    tagline: "Agreements, IP, trademarks, regulatory review.",
    accentColor: "#92400E",
    accentSoft: "rgba(146, 64, 14, 0.14)",
    Icon: Scale,
    quickChips: [
      "Review this contract.",
      "Open agreements.",
      "Trademark watch.",
      "Compliance overlap.",
    ],
    workspace: "legal",
  },
};

export function getEmployeeSurface(id: EmployeeId): EmployeeSurface {
  return EMPLOYEE_SURFACES[id];
}

export const SURFACE_ORDER: EmployeeId[] = [
  "atlas",
  "engineering",
  "sales",
  "marketing",
  "finance",
  "ops",
  "compliance",
  "hr",
  "legal",
];
