import { authedFetch } from "./api";
import type { EmployeeId } from "./employees";

/**
 * Stream a chat completion via SSE.
 *
 * The web endpoint at POST /api/conduit/chat returns a text/event-stream
 * with events:
 *  - meta: { conversation_id, employee, intent }
 *  - token: { text }
 *  - tool_call: { name, args }
 *  - artifact: { kind, content }
 *  - memory: { kind, content }
 *  - tts_chunk: { audio_b64, mime }
 *  - error: { message }
 *  - done: { tokens_used }
 *
 * On RN, fetch streams via response.body.getReader() — supported in Hermes/RN 0.74+.
 */

export interface ChatStreamEvent {
  type: string;
  data: any;
}

export interface ChatStreamHandlers {
  onMeta?: (data: { conversation_id: string; employee?: string }) => void;
  onToken?: (text: string) => void;
  onToolCall?: (call: { name: string; args: unknown }) => void;
  onArtifact?: (artifact: { kind: string; content: string }) => void;
  onMemory?: (mem: { kind: string; content: string }) => void;
  onTtsChunk?: (chunk: { audio_b64: string; mime?: string }) => void;
  onDone?: (info: { tokens_used?: number; conversation_id?: string }) => void;
  onError?: (err: { message: string }) => void;
}

export async function streamChat(
  body: {
    conversation_id?: string;
    message: string;
    employee_override?: EmployeeId | "team";
  },
  handlers: ChatStreamHandlers,
): Promise<{ aborted: boolean; conversationId?: string }> {
  let aborted = false;
  let lastConversationId = body.conversation_id;

  try {
    const response = await authedFetch("/api/conduit/chat", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { Accept: "text/event-stream" },
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      handlers.onError?.({
        message: `HTTP ${response.status}: ${text || response.statusText}`,
      });
      return { aborted: true };
    }

    if (!response.body) {
      handlers.onError?.({ message: "Empty response body" });
      return { aborted: true };
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // SSE: events separated by blank line
      let idx: number;
      while ((idx = buffer.indexOf("\n\n")) !== -1) {
        const raw = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 2);
        const event = parseSseBlock(raw);
        if (!event) continue;

        switch (event.type) {
          case "meta":
            if (event.data?.conversation_id) {
              lastConversationId = event.data.conversation_id;
            }
            handlers.onMeta?.(event.data);
            break;
          case "token":
            if (typeof event.data?.text === "string") {
              handlers.onToken?.(event.data.text);
            }
            break;
          case "tool_call":
            handlers.onToolCall?.(event.data);
            break;
          case "artifact":
            handlers.onArtifact?.(event.data);
            break;
          case "memory":
            handlers.onMemory?.(event.data);
            break;
          case "tts_chunk":
            handlers.onTtsChunk?.(event.data);
            break;
          case "error":
            handlers.onError?.(event.data);
            break;
          case "done":
            handlers.onDone?.(event.data ?? {});
            break;
          default:
            break;
        }
      }
    }
  } catch (err: unknown) {
    aborted = true;
    handlers.onError?.({
      message: err instanceof Error ? err.message : String(err),
    });
  }

  return { aborted, conversationId: lastConversationId };
}

function parseSseBlock(block: string): ChatStreamEvent | null {
  let event = "message";
  let dataLines: string[] = [];
  for (const line of block.split("\n")) {
    if (line.startsWith("event:")) {
      event = line.slice(6).trim();
    } else if (line.startsWith("data:")) {
      dataLines.push(line.slice(5).trimStart());
    }
  }
  if (dataLines.length === 0) return null;
  const dataStr = dataLines.join("\n");
  let data: unknown;
  try {
    data = JSON.parse(dataStr);
  } catch {
    data = dataStr;
  }
  return { type: event, data };
}
