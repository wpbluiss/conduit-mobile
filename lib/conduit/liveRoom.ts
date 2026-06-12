// LiveKit voice room token + state management.
//
// Audio streaming requires @livekit/react-native (native WebRTC) built via
// expo-dev-client. This module handles the server-side token flow and
// participant state that works in managed Expo today.

import { authedFetch } from "./api";

export interface LiveRoomToken {
  token: string;
  wsUrl: string;
  roomName: string;
  participantIdentity: string;
}

export interface LiveRoomParticipant {
  identity: string;
  name: string;
  /** True when the participant's mic is publishing audio. */
  isSpeaking: boolean;
  isLocal: boolean;
}

export type LiveRoomConnectionState =
  | "disconnected"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "failed";

export interface RoundtableTokenRequest {
  /** Optional conversation to anchor the room to. */
  conversationId?: string | null;
}

/**
 * Fetch a LiveKit room token from the server-side roundtable endpoint.
 * The server validates the session and returns a short-lived participant token.
 */
export async function fetchRoundtableToken(
  req: RoundtableTokenRequest = {},
): Promise<LiveRoomToken | null> {
  try {
    const body: Record<string, unknown> = {};
    if (req.conversationId) body.conversation_id = req.conversationId;

    const res = await authedFetch("/api/conduit/voice/roundtable-token", {
      method: "POST",
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      console.warn("[LiveRoom] token fetch failed:", res.status);
      return null;
    }

    const data = (await res.json()) as {
      token?: string;
      ws_url?: string;
      room_name?: string;
      participant_identity?: string;
    };

    if (!data.token || !data.ws_url) {
      console.warn("[LiveRoom] malformed token response");
      return null;
    }

    return {
      token: data.token,
      wsUrl: data.ws_url,
      roomName: data.room_name ?? "roundtable",
      participantIdentity: data.participant_identity ?? "user",
    };
  } catch (e) {
    console.warn("[LiveRoom] token error:", e);
    return null;
  }
}
