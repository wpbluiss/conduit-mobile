import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useAudioPlayer } from "expo-audio";
import {
  CaretDown,
  X,
  SpeakerHigh,
  SpeakerSlash,
  Play,
  Stop,
} from "phosphor-react-native";
import * as Haptics from "expo-haptics";
import { usePraxisTheme } from "../../contexts/PraxisThemeContext";
import { Text } from "../../components/praxis";
import { VoiceOrb, type OrbState } from "../../components/praxis/voice/VoiceOrb";
import { Captions } from "../../components/praxis/voice/Captions";
import { getConversation, subscribeToMessages } from "../../lib/conduit/conversations";
import { synthesizeSpeech } from "../../lib/conduit/voice";
import { writeBase64AudioToCache } from "../../lib/conduit/audioPlayback";
import { getEmployee, type EmployeeId } from "../../lib/conduit/employees";
import { getOrCreateAccount } from "../../lib/conduit/account";

export default function VoiceModalScreen() {
  const t = usePraxisTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ conversationId?: string }>();
  const conversationId =
    typeof params.conversationId === "string" && params.conversationId.length > 0
      ? params.conversationId
      : null;

  const [orbState, setOrbState] = useState<OrbState>("idle");
  const [employee, setEmployee] = useState<EmployeeId | "team" | null>(null);
  const [assistantText, setAssistantText] = useState<string>("");
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const [synthesizing, setSynthesizing] = useState(false);
  const synthedRef = useRef<string>("");
  const [voiceSpeed, setVoiceSpeed] = useState<number>(1.0);
  const [autoPlay, setAutoPlay] = useState<boolean>(false);

  // Stable player. We swap sources via .replace() instead of letting
  // useAudioPlayer rebuild the player when `audioUri` changes — rebuilding
  // is racy on iOS and was a contributing cause of silent previews in R19.
  const player = useAudioPlayer(null);

  // Load voice preferences (speed, auto_play) from account.
  useEffect(() => {
    getOrCreateAccount().then((account) => {
      if (!account) return;
      if (account.voice_speed !== null && account.voice_speed !== undefined) {
        setVoiceSpeed(Math.min(2.0, Math.max(0.5, account.voice_speed)));
      }
      if (account.voice_auto_play !== null && account.voice_auto_play !== undefined) {
        setAutoPlay(!!account.voice_auto_play);
      }
    });
  }, []);

  // Realtime: when auto-play is on and we have a conversationId, subscribe to
  // incoming assistant messages and trigger TTS automatically.
  useEffect(() => {
    if (!conversationId || !autoPlay) return;
    const unsub = subscribeToMessages(conversationId, (msg) => {
      if (msg.role !== "assistant") return;
      if (msg.employee) setEmployee(msg.employee);
      setAssistantText(msg.content);
    });
    return unsub;
  }, [conversationId, autoPlay]);

  // Only auto-load a transcript when an explicit conversationId is passed
  // in. Without one (e.g. entering voice mode from the team grid or any
  // generic surface), the screen must stay in its empty state — Principle
  // Zero forbids surfacing a stale assistant message as if it were a
  // canonical reply for the user's current session.
  useFocusEffect(
    useCallback(() => {
      setAssistantText("");
      setEmployee(null);
      if (!conversationId) return;
      let alive = true;
      (async () => {
        const detail = await getConversation(conversationId);
        if (!alive || !detail) return;
        const lastAssistant = [...detail.messages]
          .reverse()
          .find((m) => m.role === "assistant");
        if (lastAssistant) {
          setAssistantText(lastAssistant.content);
          if (lastAssistant.employee) setEmployee(lastAssistant.employee);
        }
      })();
      return () => {
        alive = false;
      };
    }, [conversationId]),
  );

  // Generate TTS for any new assistant text, unless muted.
  useEffect(() => {
    if (muted) return;
    if (!assistantText) return;
    if (synthedRef.current === assistantText) return;
    synthedRef.current = assistantText;
    setSynthesizing(true);
    setOrbState("thinking");
    (async () => {
      const result = await synthesizeSpeech({
        text: assistantText,
        employee,
        speed: voiceSpeed,
      });
      if (!result.ok) {
        console.warn("[Voice] tts failed:", result.error);
        setSynthesizing(false);
        setOrbState("idle");
        return;
      }
      try {
        const uri = writeBase64AudioToCache(result.audioBase64);
        setAudioUri(uri);
      } catch (e) {
        console.warn("[Voice] failed to write audio:", e);
      }
      setSynthesizing(false);
    })();
  }, [assistantText, employee, muted]);

  // When the player loads a new source, auto-play.
  useEffect(() => {
    if (!audioUri) return;
    setOrbState("speaking");
    try {
      player.replace({ uri: audioUri });
      player.seekTo(0);
      player.play();
    } catch (e) {
      console.warn("[Voice] play failed:", e);
      setOrbState("idle");
    }
  }, [audioUri, player]);

  // Watch the player to flip orb back to idle when audio finishes.
  useEffect(() => {
    const sub = player.addListener("playbackStatusUpdate", (status) => {
      if (status.didJustFinish) {
        setOrbState("idle");
      }
    });
    return () => sub.remove();
  }, [player]);

  const handleEnd = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    try {
      player.pause();
    } catch {}
    router.back();
  };

  const togglePlay = () => {
    if (!audioUri) return;
    if (player.playing) {
      player.pause();
      setOrbState("idle");
    } else {
      player.seekTo(0);
      player.play();
      setOrbState("speaking");
    }
  };

  const toggleMute = () => {
    setMuted((m) => {
      const next = !m;
      try {
        if (next) player.pause();
      } catch {}
      return next;
    });
  };

  const employeeCfg = employee ? getEmployee(employee) : null;
  const speakerLabel = employeeCfg ? employeeCfg.name : "Atlas";

  const orbCaption = (() => {
    if (synthesizing) return "Generating voice…";
    switch (orbState) {
      case "thinking":
        return "Thinking";
      case "speaking":
        return "Speaking";
      case "listening":
        return "Listening";
      default:
        return assistantText ? "Tap play to hear it again" : "Nothing to play yet";
    }
  })();

  return (
    <View style={{ flex: 1, backgroundColor: "#08070C" }}>
      <LinearGradient
        colors={["#1B1B40", "#0E0E22", "#08070C"]}
        locations={[0, 0.55, 1]}
        start={{ x: 0.5, y: 0.0 }}
        end={{ x: 0.5, y: 1.0 }}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      />
      <LinearGradient
        colors={["rgba(91, 99, 232, 0.32)", "rgba(91, 99, 232, 0)"]}
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
            onPress={handleEnd}
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
            <Text
              variant="caption"
              weight="semibold"
              style={{ color: "#A8AFFB", letterSpacing: 1.4 }}
            >
              VOICE MODE
            </Text>
            <Text
              variant="bodySm"
              style={{
                color: "rgba(242,240,235,0.65)",
                marginTop: 2,
                letterSpacing: 0,
              }}
            >
              {orbCaption}
            </Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <VoiceOrb state={orbState} size={260} />
        </View>

        <View
          style={{
            paddingHorizontal: 24,
            paddingVertical: 12,
            minHeight: 160,
            maxHeight: 240,
          }}
        >
          {assistantText ? (
            <Captions speakerLabel={speakerLabel} text={assistantText} />
          ) : (
            <Captions
              speakerLabel="Voice mode"
              text="Open a chat, send a message, then return here — I'll play back the response in your selected voice. Spoken input arrives in R20."
              tone="secondary"
            />
          )}
        </View>

        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            gap: 14,
            paddingHorizontal: 24,
            paddingTop: 12,
            paddingBottom: 24,
          }}
        >
          <Pressable
            onPress={toggleMute}
            style={({ pressed }) => ({
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: pressed
                ? "rgba(255,255,255,0.10)"
                : "rgba(255,255,255,0.06)",
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.12)",
            })}
          >
            {muted ? (
              <SpeakerSlash size={22} color="#F2F0EB" />
            ) : (
              <SpeakerHigh size={22} color="#F2F0EB" />
            )}
          </Pressable>

          {audioUri ? (
            <Pressable
              onPress={togglePlay}
              style={({ pressed }) => ({
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: pressed
                  ? "rgba(91, 99, 232, 0.85)"
                  : "#5B63E8",
                alignItems: "center",
                justifyContent: "center",
              })}
            >
              {player.playing ? (
                <Stop size={26} color="#FFFFFF" weight="fill" />
              ) : (
                <Play size={26} color="#FFFFFF" weight="fill" />
              )}
            </Pressable>
          ) : null}

          <Pressable
            onPress={handleEnd}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              paddingHorizontal: 22,
              paddingVertical: 14,
              borderRadius: 32,
              backgroundColor: pressed ? "#C8412B" : "#E5715B",
            })}
          >
            <X size={18} color="#FFFFFF" weight="bold" />
            <Text
              variant="body"
              weight="semibold"
              style={{ color: "#FFFFFF", letterSpacing: 0.4 }}
            >
              End
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}
