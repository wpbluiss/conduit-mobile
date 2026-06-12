// LiveKit voice chat live room — UI scaffold.
//
// Full real-time audio requires @livekit/react-native (WebRTC native module)
// built via expo-dev-client. This screen covers the complete UI, token fetch,
// and connection state machine. Audio streaming is wired in the native build.
//
// Token endpoint: POST /api/conduit/voice/roundtable-token
// LiveKit WS URL and room credentials are returned by that endpoint.

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import {
  CaretDown,
  Microphone,
  MicrophoneSlash,
  PhoneDisconnect,
  Users,
  WifiHigh,
  WifiLow,
  WifiNone,
  Radio,
} from "phosphor-react-native";
import * as Haptics from "expo-haptics";
import { usePraxisTheme } from "../../contexts/PraxisThemeContext";
import { Text } from "../../components/praxis";
import { VoiceOrb, type OrbState } from "../../components/praxis/voice/VoiceOrb";
import {
  fetchRoundtableToken,
  type LiveRoomConnectionState,
  type LiveRoomParticipant,
  type LiveRoomToken,
} from "../../lib/conduit/liveRoom";

// Atlas always anchors the round table on the AI side.
const ATLAS_PARTICIPANT: LiveRoomParticipant = {
  identity: "atlas",
  name: "Atlas",
  isSpeaking: false,
  isLocal: false,
};

function ConnectionDot({ state }: { state: LiveRoomConnectionState }) {
  const color =
    state === "connected"
      ? "#3DD68C"
      : state === "connecting" || state === "reconnecting"
        ? "#D67817"
        : "#C8412B";
  return (
    <View
      style={{
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: color,
      }}
    />
  );
}

function ConnectionIcon({ state }: { state: LiveRoomConnectionState }) {
  const color = "#A8AFFB";
  if (state === "connected") return <WifiHigh size={14} color={color} />;
  if (state === "connecting" || state === "reconnecting")
    return <WifiLow size={14} color={color} />;
  return <WifiNone size={14} color={color} />;
}

function ParticipantBubble({
  participant,
}: {
  participant: LiveRoomParticipant;
}) {
  return (
    <View style={{ alignItems: "center", gap: 6, minWidth: 64 }}>
      <View
        style={{
          width: 52,
          height: 52,
          borderRadius: 26,
          backgroundColor: participant.isLocal ? "#5B63E8" : "#6D28D9",
          alignItems: "center",
          justifyContent: "center",
          borderWidth: participant.isSpeaking ? 2 : 0,
          borderColor: "#3DD68C",
        }}
      >
        <Text
          variant="body"
          weight="semibold"
          style={{ color: "#FFFFFF", fontSize: 18 }}
        >
          {participant.name.charAt(0).toUpperCase()}
        </Text>
      </View>
      <Text
        variant="caption"
        style={{ color: "rgba(242,240,235,0.75)", letterSpacing: 0 }}
        numberOfLines={1}
      >
        {participant.isLocal ? "You" : participant.name}
      </Text>
    </View>
  );
}

export default function VoiceRoomScreen() {
  const t = usePraxisTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ conversationId?: string }>();
  const conversationId =
    typeof params.conversationId === "string" && params.conversationId.length > 0
      ? params.conversationId
      : null;

  const [connectionState, setConnectionState] =
    useState<LiveRoomConnectionState>("disconnected");
  const [roomToken, setRoomToken] = useState<LiveRoomToken | null>(null);
  const [participants, setParticipants] = useState<LiveRoomParticipant[]>([
    ATLAS_PARTICIPANT,
  ]);
  const [micEnabled, setMicEnabled] = useState(true);
  const [orbState, setOrbState] = useState<OrbState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Fetch token and transition to "connecting" on mount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setConnectionState("connecting");
      setErrorMessage(null);

      const token = await fetchRoundtableToken({ conversationId });

      if (cancelled || !mountedRef.current) return;

      if (!token) {
        setConnectionState("failed");
        setErrorMessage(
          "Couldn't get a room token. Check your connection and try again.",
        );
        return;
      }

      setRoomToken(token);

      // In the native build, this is where we'd call:
      //   room.connect(token.wsUrl, token.token)
      // and subscribe to room events for participant + speaking state.
      // For the managed-Expo build we simulate "connected" immediately so
      // the UI can be reviewed and styled.
      setConnectionState("connected");
      setOrbState("listening");

      // Add a local "You" participant once connected.
      if (mountedRef.current) {
        setParticipants((prev) => {
          const hasLocal = prev.some((p) => p.isLocal);
          if (hasLocal) return prev;
          return [
            ...prev,
            {
              identity: "local-user",
              name: "You",
              isSpeaking: false,
              isLocal: true,
            },
          ];
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [conversationId]);

  const handleLeave = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setConnectionState("disconnected");
    setOrbState("idle");
    // In native build: room.disconnect()
    router.back();
  }, [router]);

  const toggleMic = useCallback(() => {
    Haptics.selectionAsync().catch(() => {});
    setMicEnabled((prev) => {
      // In native build: room.localParticipant.setMicrophoneEnabled(!prev)
      return !prev;
    });
  }, []);

  const connectionLabel = (() => {
    switch (connectionState) {
      case "connecting":
        return "Connecting…";
      case "connected":
        return roomToken?.roomName ?? "Roundtable";
      case "reconnecting":
        return "Reconnecting…";
      case "failed":
        return "Connection failed";
      default:
        return "Disconnected";
    }
  })();

  const orbCaption = (() => {
    if (connectionState === "connecting") return "Joining room…";
    if (connectionState === "failed") return errorMessage ?? "Connection failed";
    if (!micEnabled) return "Microphone muted";
    switch (orbState) {
      case "listening":
        return "Listening";
      case "speaking":
        return "Atlas is speaking";
      default:
        return "Room active";
    }
  })();

  return (
    <View style={{ flex: 1, backgroundColor: "#08070C" }}>
      <LinearGradient
        colors={["#1B1040", "#0E0A22", "#08070C"]}
        locations={[0, 0.55, 1]}
        start={{ x: 0.5, y: 0.0 }}
        end={{ x: 0.5, y: 1.0 }}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      />
      <LinearGradient
        colors={["rgba(109, 40, 217, 0.28)", "rgba(109, 40, 217, 0)"]}
        start={{ x: 0.5, y: 0.0 }}
        end={{ x: 0.5, y: 0.7 }}
        style={{
          position: "absolute",
          top: -120,
          left: -80,
          right: -80,
          height: 480,
        }}
      />

      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 12,
            paddingVertical: 8,
          }}
        >
          <Pressable
            onPress={handleLeave}
            hitSlop={10}
            style={({ pressed }) => ({
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: pressed
                ? "rgba(255,255,255,0.08)"
                : "rgba(255,255,255,0.04)",
              alignItems: "center",
              justifyContent: "center",
            })}
          >
            <CaretDown size={20} color="#F2F0EB" />
          </Pressable>

          <View style={{ alignItems: "center" }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Radio size={12} color="#A8AFFB" weight="fill" />
              <Text
                variant="caption"
                weight="semibold"
                style={{ color: "#A8AFFB", letterSpacing: 1.4 }}
              >
                LIVE ROOM
              </Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 }}>
              <ConnectionDot state={connectionState} />
              <ConnectionIcon state={connectionState} />
              <Text
                variant="bodySm"
                style={{ color: "rgba(242,240,235,0.65)", letterSpacing: 0 }}
              >
                {connectionLabel}
              </Text>
            </View>
          </View>

          <View style={{ width: 40 }} />
        </View>

        {/* Orb */}
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {connectionState === "connecting" ? (
            <ActivityIndicator size="large" color="#A8AFFB" />
          ) : connectionState === "failed" ? (
            <View style={{ alignItems: "center", gap: 12, paddingHorizontal: 32 }}>
              <WifiNone size={48} color="#C8412B" />
              <Text
                variant="body"
                align="center"
                style={{ color: "rgba(242,240,235,0.75)" }}
              >
                {errorMessage}
              </Text>
            </View>
          ) : (
            <VoiceOrb state={orbState} size={240} />
          )}
        </View>

        {/* Caption */}
        <View
          style={{
            paddingHorizontal: 24,
            paddingBottom: 12,
            minHeight: 48,
            alignItems: "center",
          }}
        >
          <Text
            variant="bodySm"
            align="center"
            style={{ color: "rgba(242,240,235,0.55)", letterSpacing: 0 }}
          >
            {orbCaption}
          </Text>
        </View>

        {/* Participants */}
        <View
          style={{
            paddingHorizontal: 24,
            paddingBottom: 8,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              marginBottom: 12,
            }}
          >
            <Users size={13} color="rgba(242,240,235,0.45)" />
            <Text
              variant="caption"
              style={{ color: "rgba(242,240,235,0.45)", letterSpacing: 0.8 }}
            >
              {participants.length} IN ROOM
            </Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 16 }}
          >
            {participants.map((p) => (
              <ParticipantBubble key={p.identity} participant={p} />
            ))}
          </ScrollView>
        </View>

        {/* Controls */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            gap: 20,
            paddingHorizontal: 24,
            paddingTop: 16,
            paddingBottom: 32,
          }}
        >
          {/* Mic toggle */}
          <Pressable
            onPress={toggleMic}
            disabled={connectionState !== "connected"}
            style={({ pressed }) => ({
              width: 58,
              height: 58,
              borderRadius: 29,
              backgroundColor: micEnabled
                ? pressed
                  ? "rgba(255,255,255,0.10)"
                  : "rgba(255,255,255,0.06)"
                : pressed
                  ? "rgba(200,65,43,0.30)"
                  : "rgba(200,65,43,0.20)",
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: micEnabled
                ? "rgba(255,255,255,0.12)"
                : "rgba(200,65,43,0.40)",
              opacity: connectionState !== "connected" ? 0.4 : 1,
            })}
          >
            {micEnabled ? (
              <Microphone size={24} color="#F2F0EB" />
            ) : (
              <MicrophoneSlash size={24} color="#E5715B" />
            )}
          </Pressable>

          {/* Leave button */}
          <Pressable
            onPress={handleLeave}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              paddingHorizontal: 28,
              paddingVertical: 16,
              borderRadius: 32,
              backgroundColor: pressed ? "#C8412B" : "#E5715B",
            })}
          >
            <PhoneDisconnect size={20} color="#FFFFFF" weight="fill" />
            <Text
              variant="body"
              weight="semibold"
              style={{ color: "#FFFFFF", letterSpacing: 0.4 }}
            >
              Leave
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}
