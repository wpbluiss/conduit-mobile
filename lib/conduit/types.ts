// Shared type definitions for the Praxis Console mobile API layer.
// These mirror the conduit_* tables on Supabase. Mobile reads them via direct
// queries (RLS-secured); only chat completion goes through the web API.

import type { EmployeeId } from "./employees";

export interface ConduitAccount {
  id: string;
  user_id: string;
  display_name: string | null;
  organization_name: string | null;
  tier_id: string | null;
  tokens_used: number | null;
  tokens_limit: number | null;
  billing_period_start: string | null;
  billing_period_end: string | null;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  account_id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
}

export type MessageRole = "user" | "assistant" | "system" | "tool";

export interface Message {
  id: string;
  conversation_id: string;
  role: MessageRole;
  employee: EmployeeId | "team" | null;
  content: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export type BuildStatus =
  | "pending"
  | "scaffolding"
  | "building"
  | "deploying"
  | "live"
  | "failed"
  | "archived";

export interface BuildSession {
  id: string;
  account_id: string;
  template_id: string | null;
  build_name: string;
  build_slug: string;
  status: BuildStatus;
  github_repo_url: string | null;
  vercel_project_id: string | null;
  vercel_deployment_id: string | null;
  live_url: string | null;
  error_message: string | null;
  conversation_id: string | null;
  created_at: string;
  archived_at: string | null;
}

export interface EngineeringLog {
  id: string;
  build_id: string;
  step: string;
  status: "started" | "completed" | "failed" | "info";
  detail: string | null;
  created_at: string;
}

export type MemoryKind = "fact" | "preference" | "context" | "note";

export interface MemoryRecord {
  id: string;
  account_id: string;
  kind: MemoryKind;
  content: string;
  tags: string[] | null;
  source_conversation_id: string | null;
  source_message_id: string | null;
  written_by: EmployeeId | "user" | null;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
  superseded_by: string | null;
}
