import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { usePraxisTheme } from "../../contexts/PraxisThemeContext";
import { Text } from "../../components/praxis";
import { VoiceOrb, type OrbState } from "../../components/praxis/voice/VoiceOrb";
import { Captions } from "../../components/praxis/voice/Captions";
import { VoiceControls } from "../../components/praxis/voice/VoiceControls";
import { Composer } from "../../components/praxis/chat/Composer";
import {
  appendUserMessage,
  createConversation,
  getConversation,
  listConversations,
} from "../../lib/conduit/conversations";
import { streamChat } from "../../lib/conduit/chat";
import { getEmployee, type EmployeeId } from "../../lib/conduit/employees";

export default function VoiceScreen() {
  const t = usePraxisTheme();

  const [orbState, setOrbState] = useState<OrbState>("idle");
  const [employee, setEmployee] = useState<EmployeeId | "team" | null>(null);
  const [lastUserText, setLastUserText] = useState<string>("");
  const [assistantBuffer, setAssistantBuffer] = useState<string>("");
  const [muted, setMuted] = useState(false);

  const conversationIdRef = useRef<string | null>(null);
  const streamingTextRef = useRef("");

  // Pre-warm: pick the most recent conversation (if any) so messages have continuity.
  useFocusEffect(
    useCallback(() => {
      let alive = true;
      (async () => {
        const list = await listConversations();
        if (!alive) return;
        if (list.length > 0) {
          const recent = list[0];
          conversationIdRef.current = recent.id;
          // Surface the last assistant message as the captions anchor.
          const detail = await getConversation(recent.id);
          if (!alive || !detail) return;
          const lastAssistant = [...detail.messages].reverse().find((m) => m.role === "assistant");
          if (lastAssistant) {
            setAssistantBuffer(lastAssistant.content);
            if (lastAssistant.employee) setEmployee(lastAssistant.employee);
          }
        }
      })();
      return () => {
        alive = false;
      };
    }, []),
  );

  const handleClose = () => {
    // We don't unmount — just reset captions.
    setAssistantBuffer("");
    setLastUserText("");
    setOrbState("idle");
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.bgCanvas }} edges={["top"]}>
      <View style={{ flex: 1 }}>
        <View
          style={{
            paddingHorizontal: t.layout.screenPaddingX,
            paddingTop: 8,
            paddingBottom: 12,
          }}
        >
          <Text variant="caption" tone="indigo" weight="semibold">
            VOICE MODE
          </Text>
          <Text variant="displayMd" family="display" weight="semibold">
            Talk it through.
          </Text>
        </View>

        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "flex-start",
            paddingTop: 12,
          }}
        >
          <VoiceOrb state={orbState} size={220} />
        </View>

        <View style={{ minHeight: 140, maxHeight: 220 }}>
          {assistantBuffer ? (
            <Captions speakerLabel={speakerLabel} text={assistantBuffer} />
          ) : lastUserText ? (
            <Captions speakerLabel="You" text={lastUserText} tone="secondary" />
          ) : (
            <Captions
              speakerLabel="READY"
              text="Type or talk. Atlas will route the right employee."
              tone="secondary"
            />
          )}
        </View>

        <VoiceControls
          onClose={handleClose}
          onToggleMute={() => setMuted((m) => !m)}
          muted={muted}
          micDisabled
          micLabel="Voice input arrives in the next build"
        />

        <Composer
          onSubmit={handleSend}
          streaming={orbState === "thinking" || orbState === "speaking"}
          placeholder="Type to Atlas…"
        />
      </View>
    </SafeAreaView>
  );
}
