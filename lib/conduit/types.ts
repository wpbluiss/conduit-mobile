// Shared type definitions for the Praxis Console mobile API layer.
// These mirror the conduit_* tables on Supabase. Mobile reads them via direct
// queries (RLS-secured); only chat completion goes through the web API.

import type { EmployeeId } from "./employees";

/** Response from GET /api/v1/me on the conduit-backend. */
export interface CurrentUser {
  id: string;
  email: string;
  plan: string;
}

export interface ConduitAccount {
  id: string;
  owner_user_id: string;
  name: string;
  business_type: string | null;
  business_description: string | null;
  tier_id: string | null;
  monthly_token_cap: number | null;
  monthly_tokens_used: number | null;
  bonus_tokens: number | null;
  billing_cycle_start: string | null;
  voice_enabled: boolean | null;
  voice_speed: number | null;
  voice_auto_play: boolean | null;
  streaming_tts_enabled: boolean | null;
  timezone: string | null;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  account_id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
  dominant_employee?: string | null;
  voice_session_id?: string | null;
  engineering_session_id?: string | null;
  marketing_session_id?: string | null;
  /** Last message content snippet, attached by listConversations for the
   *  drawer row preview. Not persisted on the row itself. */
  last_message_preview?: string | null;
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

export type EngineeringLogLevel = "info" | "success" | "warn" | "error" | "debug";

export interface EngineeringLog {
  id: string;
  session_id: string;
  ts: string;
  level: EngineeringLogLevel | string;
  message: string;
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
