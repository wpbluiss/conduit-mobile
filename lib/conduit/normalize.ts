// Defensive normalizers for Praxis Console data shapes.
//
// The conduit_messages table predates the mobile app and has accumulated
// shape drift across web/worker/legacy migrations. The mobile app must
// gracefully render any of these without crashing on .slice() / .map() /
// .toLowerCase() calls against unexpected types.
//
// Coverage:
//   - content: string | null | { text: string } | Array<{ type, text }>
//   - role:   "user"|"assistant"|"system"|"tool" | "human"|"ai"|"bot" | sender_type
//   - employee: EmployeeId | "team" | null | unknown string
//   - created_at: ISO string | null

import type { EmployeeId } from "./employees";
import { EMPLOYEES } from "./employees";
import type { Conversation, Message, MessageRole } from "./types";

const VALID_ROLES: ReadonlySet<MessageRole> = new Set([
  "user",
  "assistant",
  "system",
  "tool",
]);

const ROLE_ALIASES: Record<string, MessageRole> = {
  human: "user",
  user: "user",
  customer: "user",
  ai: "assistant",
  bot: "assistant",
  assistant: "assistant",
  agent: "assistant",
  employee: "assistant",
  system: "system",
  tool: "tool",
  function: "tool",
};

export function normalizeRole(input: unknown): MessageRole {
  if (typeof input !== "string") return "assistant";
  const lower = input.trim().toLowerCase();
  if (VALID_ROLES.has(lower as MessageRole)) return lower as MessageRole;
  return ROLE_ALIASES[lower] ?? "assistant";
}

export function normalizeContent(input: unknown): string {
  if (input == null) return "";
  if (typeof input === "string") return input;

  // Anthropic-style content blocks: [{ type: "text", text: "..." }, ...]
  if (Array.isArray(input)) {
    return input
      .map((block) => {
        if (typeof block === "string") return block;
        if (block && typeof block === "object") {
          const b = block as Record<string, unknown>;
          if (typeof b.text === "string") return b.text;
          if (typeof b.content === "string") return b.content;
        }
        return "";
      })
      .join("\n")
      .trim();
  }

  if (typeof input === "object") {
    const obj = input as Record<string, unknown>;
    if (typeof obj.text === "string") return obj.text;
    if (typeof obj.content === "string") return obj.content;
    if (typeof obj.message === "string") return obj.message;
    if (typeof obj.body === "string") return obj.body;
    // Last resort: stringify so user at least sees *something*, not a crash.
    try {
      return JSON.stringify(obj);
    } catch {
      return "";
    }
  }

  return String(input);
}

export function normalizeEmployee(
  input: unknown,
): EmployeeId | "team" | null {
  if (input === "team") return "team";
  if (typeof input !== "string") return null;
  const lower = input.toLowerCase();
  if (lower === "team" || lower === "broadcast" || lower === "all") return "team";
  if (lower in EMPLOYEES) return lower as EmployeeId;
  return null;
}

export function normalizeTimestamp(input: unknown): string {
  if (typeof input === "string" && input.length > 0) return input;
  if (input instanceof Date) return input.toISOString();
  if (typeof input === "number") return new Date(input).toISOString();
  return new Date(0).toISOString();
}

export function normalizeMessage(raw: unknown, fallbackConvId = ""): Message {
  const r = (raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {});

  // Some rows historically used `sender_type` instead of `role`.
  const rawRole = r.role ?? r.sender_type ?? r.author ?? r.from;

  // Some rows historically used `text` instead of `content`, or stored
  // structured blocks under `content` / `parts`.
  const rawContent =
    r.content ?? r.text ?? r.parts ?? r.body ?? r.message ?? "";

  // Some rows used `id`, some used a numeric `message_id`, some had no id.
  const rawId = r.id ?? r.message_id ?? r.uuid;
  const id =
    typeof rawId === "string" || typeof rawId === "number"
      ? String(rawId)
      : `synthetic-${Math.random().toString(36).slice(2, 10)}`;

  const conversationId =
    typeof r.conversation_id === "string"
      ? r.conversation_id
      : typeof r.thread_id === "string"
        ? r.thread_id
        : fallbackConvId;

  const metadata =
    r.metadata && typeof r.metadata === "object"
      ? (r.metadata as Record<string, unknown>)
      : null;

  return {
    id,
    conversation_id: conversationId,
    role: normalizeRole(rawRole),
    employee: normalizeEmployee(r.employee ?? r.employee_id ?? r.agent),
    content: normalizeContent(rawContent),
    metadata,
    created_at: normalizeTimestamp(r.created_at ?? r.inserted_at ?? r.timestamp),
  };
}

export function normalizeMessages(raw: unknown, fallbackConvId = ""): Message[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((m) => normalizeMessage(m, fallbackConvId));
}

export function normalizeConversation(raw: unknown): Conversation | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.id !== "string" || typeof r.account_id !== "string") return null;
  return {
    id: r.id,
    account_id: r.account_id,
    title: typeof r.title === "string" ? r.title : null,
    created_at: normalizeTimestamp(r.created_at),
    updated_at: normalizeTimestamp(r.updated_at ?? r.created_at),
    dominant_employee:
      typeof r.dominant_employee === "string"
        ? r.dominant_employee
        : null,
    voice_session_id:
      typeof r.voice_session_id === "string" ? r.voice_session_id : null,
    engineering_session_id:
      typeof r.engineering_session_id === "string"
        ? r.engineering_session_id
        : null,
    marketing_session_id:
      typeof r.marketing_session_id === "string"
        ? r.marketing_session_id
        : null,
  };
}
