import React, { useCallback, useRef, useState } from "react";
import { View, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { CaretDown, X, SpeakerHigh, SpeakerSlash } from "phosphor-react-native";
import * as Haptics from "expo-haptics";
import { usePraxisTheme } from "../../contexts/PraxisThemeContext";
import { Text } from "../../components/praxis";
import { VoiceOrb, type OrbState } from "../../components/praxis/voice/VoiceOrb";
import { Captions } from "../../components/praxis/voice/Captions";
import {
  appendUserMessage,
  createConversation,
  getConversation,
  getMostRecentConversation,
} from "../../lib/conduit/conversations";
import { streamChat } from "../../lib/conduit/chat";
import { getEmployee, type EmployeeId } from "../../lib/conduit/employees";

export default function VoiceModalScreen() {
  const t = usePraxisTheme();
  const router = useRouter();

  const [orbState, setOrbState] = useState<OrbState>("idle");
  const [employee, setEmployee] = useState<EmployeeId | "team" | null>(null);
  const [lastUserText, setLastUserText] = useState<string>("");
  const [assistantBuffer, setAssistantBuffer] = useState<string>("");
  const [muted, setMuted] = useState(false);

  const conversationIdRef = useRef<string | null>(null);
  const streamingTextRef = useRef("");

  // Pre-warm: pick the most recent conversation so messages have continuity.
  useFocusEffect(
    useCallback(() => {
      let alive = true;
      (async () => {
        const recent = await getMostRecentConversation();
        if (!alive || !recent) return;
        conversationIdRef.current = recent.id;
        const detail = await getConversation(recent.id);
        if (!alive || !detail) return;
        const lastAssistant = [...detail.messages]
          .reverse()
          .find((m) => m.role === "assistant");
        if (lastAssistant) {
          setAssistantBuffer(lastAssistant.content);
          if (lastAssistant.employee) setEmployee(lastAssistant.employee);
        }
      })();
      return () => {
        alive = false;
      };
    }, []),
  );

  const handleEnd = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    router.back();
  };

  const handleSend = useCallback(async (text: string) => {
    setLastUserText(text);
    setAssistantBuffer("");
    setOrbState("thinking");

    let cid = conversationIdRef.current;
    if (!cid) {
      const created = await createConversation(text.slice(0, 60));
      if (!created) {
        setOrbState("idle");
        return;
      }
      cid = created.id;
      conversationIdRef.current = cid;
    }

    await appendUserMessage(cid, text);

    streamingTextRef.current = "";
    let resolvedEmployee: EmployeeId | "team" | null = null;

    await streamChat(
      { conversation_id: cid, message: text },
      {
        onMeta: (m) => {
          if (m.employee) {
            resolvedEmployee = m.employee as EmployeeId | "team";
            setEmployee(resolvedEmployee);
          }
        },
        onToken: (chunk) => {
          if (streamingTextRef.current === "") setOrbState("speaking");
          streamingTextRef.current += chunk;
          setAssistantBuffer(streamingTextRef.current);
        },
        onError: (err) => {
          console.warn("[Voice] stream error:", err.message);
          setOrbState("idle");
        },
        onDone: () => {
          setOrbState("idle");
        },
      },
    );

    setOrbState("idle");
  }, []);

  const employeeCfg = employee ? getEmployee(employee) : null;
  const speakerLabel = employeeCfg ? employeeCfg.name : "Atlas";

  const orbCaption = (() => {
    switch (orbState) {
      case "listening":
        return "Listening";
      case "thinking":
        return "Thinking";
      case "speaking":
        return "Speaking";
      default:
        return "Ready";
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
              style={{ color: "rgba(242,240,235,0.65)", marginTop: 2, letterSpacing: 0 }}
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
          {assistantBuffer ? (
            <Captions speakerLabel={speakerLabel} text={assistantBuffer} />
          ) : lastUserText ? (
            <Captions
              speakerLabel="You"
              text={lastUserText}
              tone="secondary"
            />
          ) : (
            <Captions
              speakerLabel="Ready"
              text="Voice input arrives in the next build. Talk on web for now."
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
            onPress={() => setMuted((m) => !m)}
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
