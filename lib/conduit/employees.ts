// 9-employee Praxis Console configuration. Mirrors the web app exactly.
// Avatar colors map onto the indigo-accent design system; rings render with
// these colors. Display copy and short blurbs are used across Team grid,
// chat headers, and the @-mention picker.

export type EmployeeId =
  | "atlas"
  | "marketing"
  | "sales"
  | "engineering"
  | "finance"
  | "compliance"
  | "hr"
  | "ops"
  | "legal";

export interface Employee {
  id: EmployeeId;
  name: string;
  title: string;
  blurb: string;
  ringColor: string;
  glyph: string;
}

export const EMPLOYEES: Record<EmployeeId, Employee> = {
  atlas: {
    id: "atlas",
    name: "Atlas",
    title: "Chief of Staff",
    blurb: "Routes work, holds context, and runs the workspace.",
    ringColor: "#5B63E8",
    glyph: "A",
  },
  marketing: {
    id: "marketing",
    name: "Marketing",
    title: "Brand & Demand",
    blurb: "Campaigns, copy, and positioning for every surface.",
    ringColor: "#9B7AE6",
    glyph: "M",
  },
  sales: {
    id: "sales",
    name: "Sales",
    title: "Pipeline & Close",
    blurb: "Outbound, qualification, and revenue execution.",
    ringColor: "#3DD68C",
    glyph: "S",
  },
  engineering: {
    id: "engineering",
    name: "Engineering",
    title: "Build & Ship",
    blurb: "Generates apps, reviews code, and ships to production.",
    ringColor: "#37BFD9",
    glyph: "E",
  },
  finance: {
    id: "finance",
    name: "Finance",
    title: "Books & Forecast",
    blurb: "Treasury, runway, and financial modeling.",
    ringColor: "#D67817",
    glyph: "F",
  },
  compliance: {
    id: "compliance",
    name: "Compliance",
    title: "Risk & Controls",
    blurb: "Policies, audits, and regulatory posture.",
    ringColor: "#C8412B",
    glyph: "C",
  },
  hr: {
    id: "hr",
    name: "HR",
    title: "People & Culture",
    blurb: "Hiring, onboarding, and employee experience.",
    ringColor: "#E07AB8",
    glyph: "H",
  },
  ops: {
    id: "ops",
    name: "Ops",
    title: "Systems & Process",
    blurb: "Workflows, integrations, and operational rigor.",
    ringColor: "#7B8194",
    glyph: "O",
  },
  legal: {
    id: "legal",
    name: "Legal",
    title: "Counsel & Contracts",
    blurb: "Agreements, IP, and regulatory review.",
    ringColor: "#B7791F",
    glyph: "L",
  },
};

export const EMPLOYEE_LIST: Employee[] = [
  EMPLOYEES.atlas,
  EMPLOYEES.engineering,
  EMPLOYEES.sales,
  EMPLOYEES.marketing,
  EMPLOYEES.finance,
  EMPLOYEES.ops,
  EMPLOYEES.compliance,
  EMPLOYEES.hr,
  EMPLOYEES.legal,
];

export function getEmployee(id: string | null | undefined): Employee | null {
  if (!id) return null;
  return (EMPLOYEES as Record<string, Employee>)[id] ?? null;
}
