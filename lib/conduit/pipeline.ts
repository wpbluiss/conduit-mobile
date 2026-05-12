// Lunaro sales pipeline reader.
//
// The Praxis Console shares its Postgres with Lunaro (insurance ops),
// which means Sales can pull the user's pipeline straight from
// `lunaro_leads`. Names come from the joined `lunaro_contacts` row.
//
// Stage taxonomy is dynamic per account (driven by lunaro_account_stages
// in the web app), so we bucket whatever stages we get into three fixed
// columns. Unknown stages fall into WORKING.

import { supabase } from "../supabase";

export type StageBucket = "cold" | "working" | "closing";

export interface PipelineCard {
  id: string;
  name: string;
  stage: string;
  bucket: StageBucket;
  valueCents: number | null;
  updatedAt: string;
}

export interface PipelineSnapshot {
  cards: PipelineCard[];
  totalValueCents: number;
  totalCount: number;
  byBucket: Record<StageBucket, PipelineCard[]>;
}

const COLD_STAGES = new Set([
  "new",
  "new_lead",
  "cold",
  "prospect",
  "lead",
  "unassigned",
  "untouched",
]);

const CLOSING_STAGES = new Set([
  "proposal",
  "demo",
  "demoed",
  "negotiating",
  "negotiation",
  "closing",
  "won",
  "client",
  "active",
]);

function bucketFor(stage: string): StageBucket {
  const s = stage.toLowerCase();
  if (COLD_STAGES.has(s)) return "cold";
  if (CLOSING_STAGES.has(s)) return "closing";
  return "working";
}

export async function getPipelineSnapshot(): Promise<PipelineSnapshot> {
  const empty: PipelineSnapshot = {
    cards: [],
    totalValueCents: 0,
    totalCount: 0,
    byBucket: { cold: [], working: [], closing: [] },
  };

  // Pull recently-updated leads. RLS scopes to the calling user; if Luis
  // has no Lunaro account membership, this returns zero rows (or errors,
  // which we treat as empty).
  const { data, error } = await supabase
    .from("lunaro_leads")
    .select(
      "id, stage, value_cents, updated_at, contact:lunaro_contacts(full_name)",
    )
    .order("updated_at", { ascending: false })
    .limit(40);

  if (error || !data) {
    if (error) console.warn("[Pipeline] fetch failed:", error.message);
    return empty;
  }

  const cards: PipelineCard[] = [];
  for (const row of data as unknown as Array<{
    id: string;
    stage: string | null;
    value_cents: number | null;
    updated_at: string;
    contact: { full_name?: string | null } | { full_name?: string | null }[] | null;
  }>) {
    const stage = row.stage || "untouched";
    // contact is sometimes returned as an array (when supabase-js infers
    // a 1:N relationship); pick the first member.
    const contact = Array.isArray(row.contact) ? row.contact[0] : row.contact;
    const name = contact?.full_name?.trim() || "Unnamed lead";
    cards.push({
      id: row.id,
      name,
      stage,
      bucket: bucketFor(stage),
      valueCents: row.value_cents ?? null,
      updatedAt: row.updated_at,
    });
  }

  const byBucket: Record<StageBucket, PipelineCard[]> = {
    cold: [],
    working: [],
    closing: [],
  };
  for (const c of cards) byBucket[c.bucket].push(c);

  return {
    cards,
    totalValueCents: cards.reduce((s, c) => s + (c.valueCents ?? 0), 0),
    totalCount: cards.length,
    byBucket,
  };
}

export function formatDollars(cents: number | null | undefined): string {
  if (cents == null) return "—";
  const dollars = cents / 100;
  if (Math.abs(dollars) >= 1_000_000) {
    return `$${(dollars / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(dollars) >= 1_000) {
    return `$${(dollars / 1_000).toFixed(1)}k`;
  }
  return `$${Math.round(dollars)}`;
}
