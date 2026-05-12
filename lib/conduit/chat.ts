// Chat responder client.
//
// R19: The previous flow streamed SSE tokens from conduitai.io and relied on
// the web responder to persist the assistant message. The web responder has
// been silent since 2026-05-07 (confirmed in conduit_messages — only user
// rows since). React Native's fetch also does not expose `response.body` as
// a ReadableStream, so SSE was already shaky on iOS/Hermes.
//
// New path: mobile POSTs to the Supabase Edge Function `chat-respond`,
// which calls Anthropic and inserts the assistant row directly. The mobile
// client already subscribes to INSERTs on `conduit_messages` via Realtime,
// so the new row surfaces in the UI without any streaming plumbing.
//
// Trade-off: no token-by-token streaming, just a typing indicator → full
// bubble drop. Acceptable for the 1-3s typical Anthropic latency; gives us
// a reliable loop tonight instead of a flaky stream.

import { supabase } from "../supabase";
import type { EmployeeId } from "./employees";

export interface RespondHandlers {
  onEmployeeResolved?: (employee: EmployeeId | "team") => void;
  onError?: (err: { message: string }) => void;
  onDone?: (info: { message_id?: string; employee?: EmployeeId | "team" }) => void;
}

export interface RespondParams {
  conversation_id: string;
  employee_override?: EmployeeId | "team" | null;
}

interface RespondOk {
  ok: true;
  message_id: string;
  employee: EmployeeId | "team";
}
interface RespondErr {
  ok: false;
  error: string;
  detail?: string;
  hint?: string;
}

/**
 * Invoke the chat-respond Edge Function. Returns when the assistant message
 * has been inserted (or an error has occurred). The actual rendering happens
 * via the Realtime subscription on conduit_messages.
 */
export async function respondToMessage(
  params: RespondParams,
  handlers: RespondHandlers = {},
): Promise<{ ok: boolean; messageId?: string; employee?: EmployeeId | "team" }> {
  try {
    const { data, error } = await supabase.functions.invoke<RespondOk | RespondErr>(
      "chat-respond",
      {
        body: {
          conversation_id: params.conversation_id,
          employee_override: params.employee_override ?? null,
        },
      },
    );

    if (error) {
      const message = error.message || "respond_invoke_failed";
      // Functions sometimes return non-2xx with a JSON body; surface that
      // detail instead of the generic SDK message.
      const ctx = (error as { context?: { response?: Response } }).context;
      const responseBody = await readErrorBody(ctx?.response);
      handlers.onError?.({
        message: responseBody?.error
          ? `${responseBody.error}${responseBody.detail ? `: ${responseBody.detail}` : ""}`
          : message,
      });
      console.warn("[chat] respondToMessage error:", message, responseBody);
      return { ok: false };
    }

    if (!data || !("ok" in data)) {
      handlers.onError?.({ message: "empty_response_from_responder" });
      return { ok: false };
    }

    if (!data.ok) {
      const detail = (data as RespondErr).detail || (data as RespondErr).hint;
      handlers.onError?.({
        message: detail ? `${data.error}: ${detail}` : data.error,
      });
      return { ok: false };
    }

    handlers.onEmployeeResolved?.(data.employee);
    handlers.onDone?.({ message_id: data.message_id, employee: data.employee });
    return { ok: true, messageId: data.message_id, employee: data.employee };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    handlers.onError?.({ message });
    console.warn("[chat] respondToMessage threw:", message);
    return { ok: false };
  }
}

async function readErrorBody(
  response: Response | undefined,
): Promise<{ error?: string; detail?: string; hint?: string } | null> {
  if (!response) return null;
  try {
    const text = await response.text();
    if (!text) return null;
    return JSON.parse(text);
  } catch {
    return null;
  }
}
