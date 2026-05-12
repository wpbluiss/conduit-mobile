import React, { useEffect, useState } from "react";
import { View, Pressable, ScrollView, Switch } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, Play, Microphone } from "phosphor-react-native";
import { useAudioPlayer } from "expo-audio";
import * as Haptics from "expo-haptics";
import { usePraxisTheme } from "../../../contexts/PraxisThemeContext";
import { Text, EmployeeAvatar } from "../../../components/praxis";
import { synthesizeSpeech } from "../../../lib/conduit/voice";
import { writeBase64AudioToCache } from "../../../lib/conduit/audioPlayback";
import { supabase } from "../../../lib/supabase";
import { getOrCreateAccount } from "../../../lib/conduit/account";
import {
  EMPLOYEE_SURFACES,
  SURFACE_ORDER,
} from "../../../lib/conduit/surfaces";
import type { EmployeeId } from "../../../lib/conduit/employees";

const SAMPLE_LINE = "Voice mode is live, Luis. Tap any employee to hear them.";

export default function VoicePrefsScreen() {
  const t = usePraxisTheme();
  const router = useRouter();

  const [voiceMap, setVoiceMap] = useState<Record<string, string>>({});
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState<EmployeeId | null>(null);
  const player = useAudioPlayer(previewUri);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data: voices } = await supabase
        .from("conduit_employee_default_voices")
        .select("employee, voice_id");
      const account = await getOrCreateAccount();
      if (!alive) return;
      if (voices) {
        const map: Record<string, string> = {};
        for (const v of voices as { employee: string; voice_id: string }[]) {
          map[v.employee] = v.voice_id;
        }
        setVoiceMap(map);
      }
      if (account && account.voice_enabled !== null) {
        setVoiceEnabled(!!account.voice_enabled);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!previewUri) return;
    player.play();
    const sub = player.addListener("playbackStatusUpdate", (status) => {
      if (status.didJustFinish) setPreviewing(null);
    });
    return () => sub.remove();
  }, [previewUri, player]);

  const playSample = async (emp: EmployeeId) => {
    Haptics.selectionAsync().catch(() => {});
    setPreviewing(emp);
    const sample = `${EMPLOYEE_SURFACES[emp].name} here. ${SAMPLE_LINE}`;
    const result = await synthesizeSpeech({ text: sample, employee: emp });
    if (!result.ok) {
      console.warn("[VoicePrefs] sample failed:", result.error);
      setPreviewing(null);
      return;
    }
    try {
      const uri = writeBase64AudioToCache(result.audioBase64);
      setPreviewUri(uri);
    } catch (e) {
      console.warn("[VoicePrefs] cache write failed:", e);
      setPreviewing(null);
    }
  };

  const toggleVoice = async (next: boolean) => {
    setVoiceEnabled(next);
    Haptics.selectionAsync().catch(() => {});
    const account = await getOrCreateAccount();
    if (!account) return;
    await supabase
      .from("conduit_accounts")
      .update({ voice_enabled: next })
      .eq("id", account.id);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.bgCanvas }} edges={["top"]}>
      <View style={{ paddingHorizontal: 8, paddingVertical: 8 }}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          style={{ width: 36, height: 36, alignItems: "center", justifyContent: "center" }}
        >
          <ArrowLeft size={20} color={t.colors.inkPrimary} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: t.layout.screenPaddingX,
          paddingBottom: 48,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ marginBottom: 18 }}>
          <Text variant="caption" tone="indigo" weight="semibold">
            VOICE PREFERENCES
          </Text>
          <Text variant="displayLg" family="display" weight="semibold">
            One voice per employee.
          </Text>
          <Text variant="body" tone="secondary" style={{ marginTop: 8 }}>
            Each AI employee speaks in their own ElevenLabs voice. Tap the
            play button to hear them. Spoken input rolls out in R20.
          </Text>
        </View>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 14,
            paddingVertical: 12,
            backgroundColor: t.colors.bgSurface,
            borderWidth: 1,
            borderColor: t.colors.borderSubtle,
            borderRadius: t.radii.lg,
            marginBottom: 20,
          }}
        >
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: t.colors.indigoSoft,
              alignItems: "center",
              justifyContent: "center",
              marginRight: 10,
            }}
          >
            <Microphone size={18} color={t.colors.indigo500} weight="bold" />
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="body" weight="semibold">
              Voice mode
            </Text>
            <Text variant="caption" tone="tertiary" style={{ letterSpacing: 0 }}>
              {voiceEnabled
                ? "Assistant replies play aloud in voice mode."
                : "Voice playback is off."}
            </Text>
          </View>
          <Switch
            value={voiceEnabled}
            onValueChange={toggleVoice}
            trackColor={{ false: t.colors.borderDefault, true: t.colors.indigo500 }}
            ios_backgroundColor={t.colors.borderDefault}
          />
        </View>

        <Text
          variant="caption"
          tone="tertiary"
          weight="semibold"
          style={{ marginBottom: 8, letterSpacing: 0.88 }}
        >
          EMPLOYEE VOICES
        </Text>

        <View style={{ gap: 8 }}>
          {SURFACE_ORDER.map((id) => {
            const surface = EMPLOYEE_SURFACES[id];
            const voiceId = voiceMap[id] ?? "—";
            const isPreviewing = previewing === id;
            return (
              <View
                key={id}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  backgroundColor: t.colors.bgSurface,
                  borderWidth: 1,
                  borderColor: t.colors.borderSubtle,
                  borderRadius: t.radii.md,
                }}
              >
                <EmployeeAvatar employee={id} size="sm" />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text variant="body" weight="semibold">
                    {surface.name}
                  </Text>
                  <Text
                    variant="caption"
                    tone="tertiary"
                    style={{ letterSpacing: 0 }}
                  >
                    Voice {voiceId.slice(0, 8)}…
                  </Text>
                </View>
                <Pressable
                  onPress={() => playSample(id)}
                  disabled={isPreviewing}
                  style={({ pressed }) => ({
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: isPreviewing
                      ? surface.accentColor
                      : pressed
                        ? surface.accentSoft
                        : t.colors.bgElevated,
                  })}
                >
                  <Play
                    size={14}
                    color={isPreviewing ? "#FFFFFF" : surface.accentColor}
                    weight="fill"
                  />
                </Pressable>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
