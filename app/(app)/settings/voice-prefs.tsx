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

const SAMPLE_LINE = "Voice mode is live. Tap any employee to hear them.";

const SPEED_STEPS = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0] as const;
type SpeedStep = (typeof SPEED_STEPS)[number];

function snapToSpeed(raw: number | null | undefined): SpeedStep {
  if (!raw) return 1.0;
  const clamped = Math.min(2.0, Math.max(0.5, raw));
  let closest: SpeedStep = 1.0;
  let minDelta = Infinity;
  for (const s of SPEED_STEPS) {
    const d = Math.abs(s - clamped);
    if (d < minDelta) { minDelta = d; closest = s; }
  }
  return closest;
}

export default function VoicePrefsScreen() {
  const t = usePraxisTheme();
  const router = useRouter();

  const [voiceMap, setVoiceMap] = useState<Record<string, string>>({});
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [autoPlay, setAutoPlay] = useState(false);
  const [speed, setSpeed] = useState<SpeedStep>(1.0);
  const [previewing, setPreviewing] = useState<EmployeeId | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  // Stable player. We pass an empty source on first mount and use .replace()
  // when a new sample is generated; useAudioPlayer otherwise tears down and
  // rebuilds the AudioPlayer on every URI change, which is racy on iOS.
  const player = useAudioPlayer(null);

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
      if (account) {
        if (account.voice_enabled !== null) setVoiceEnabled(!!account.voice_enabled);
        if (account.voice_auto_play !== null) setAutoPlay(!!account.voice_auto_play);
        setSpeed(snapToSpeed(account.voice_speed));
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const sub = player.addListener("playbackStatusUpdate", (status) => {
      if (status.didJustFinish) setPreviewing(null);
    });
    return () => sub.remove();
  }, [player]);

  const playSample = async (emp: EmployeeId) => {
    Haptics.selectionAsync().catch(() => {});
    setPreviewError(null);
    setPreviewing(emp);
    const sample = `${EMPLOYEE_SURFACES[emp].name} here. ${SAMPLE_LINE}`;
    const result = await synthesizeSpeech({ text: sample, employee: emp, speed });
    if (!result.ok) {
      const msg = `TTS failed: ${result.error ?? "unknown"}`;
      console.warn("[VoicePrefs]", msg);
      setPreviewError(msg);
      setPreviewing(null);
      return;
    }
    let uri: string;
    try {
      uri = writeBase64AudioToCache(result.audioBase64);
    } catch (e) {
      const msg = `Audio cache write failed: ${e instanceof Error ? e.message : String(e)}`;
      console.warn("[VoicePrefs]", msg);
      setPreviewError(msg);
      setPreviewing(null);
      return;
    }
    try {
      player.replace({ uri });
      player.seekTo(0);
      player.play();
    } catch (e) {
      const msg = `Player error: ${e instanceof Error ? e.message : String(e)}`;
      console.warn("[VoicePrefs]", msg);
      setPreviewError(msg);
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

  const toggleAutoPlay = async (next: boolean) => {
    setAutoPlay(next);
    Haptics.selectionAsync().catch(() => {});
    const account = await getOrCreateAccount();
    if (!account) return;
    await supabase
      .from("conduit_accounts")
      .update({ voice_auto_play: next })
      .eq("id", account.id);
  };

  const changeSpeed = async (next: SpeedStep) => {
    setSpeed(next);
    Haptics.selectionAsync().catch(() => {});
    const account = await getOrCreateAccount();
    if (!account) return;
    await supabase
      .from("conduit_accounts")
      .update({ voice_speed: next })
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

        {/* Settings card: voice toggle + auto-play + speed */}
        <View
          style={{
            backgroundColor: t.colors.bgSurface,
            borderWidth: 1,
            borderColor: t.colors.borderSubtle,
            borderRadius: t.radii.lg,
            marginBottom: 20,
            overflow: "hidden",
          }}
        >
          {/* Voice enabled */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 14,
              paddingVertical: 12,
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
                {voiceEnabled ? "Assistant replies play aloud." : "Voice playback is off."}
              </Text>
            </View>
            <Switch
              value={voiceEnabled}
              onValueChange={toggleVoice}
              trackColor={{ false: t.colors.borderDefault, true: t.colors.indigo500 }}
              ios_backgroundColor={t.colors.borderDefault}
            />
          </View>

          {/* Auto-play */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 14,
              paddingVertical: 12,
              borderTopWidth: 0.5,
              borderTopColor: t.colors.borderSubtle,
            }}
          >
            <View style={{ flex: 1 }}>
              <Text variant="body" weight="semibold">
                Auto-play
              </Text>
              <Text variant="caption" tone="tertiary" style={{ letterSpacing: 0 }}>
                Play TTS automatically when a new message arrives.
              </Text>
            </View>
            <Switch
              value={autoPlay}
              onValueChange={toggleAutoPlay}
              trackColor={{ false: t.colors.borderDefault, true: t.colors.indigo500 }}
              ios_backgroundColor={t.colors.borderDefault}
            />
          </View>

          {/* Speed control */}
          <View
            style={{
              paddingHorizontal: 14,
              paddingTop: 12,
              paddingBottom: 14,
              borderTopWidth: 0.5,
              borderTopColor: t.colors.borderSubtle,
              gap: 8,
            }}
          >
            <Text variant="body" weight="semibold">
              Playback speed
            </Text>
            <View style={{ flexDirection: "row", gap: 6 }}>
              {SPEED_STEPS.map((s) => {
                const active = speed === s;
                return (
                  <Pressable
                    key={s}
                    onPress={() => changeSpeed(s)}
                    style={({ pressed }) => ({
                      flex: 1,
                      paddingVertical: 7,
                      borderRadius: t.radii.sm,
                      alignItems: "center",
                      backgroundColor: active
                        ? t.colors.indigo500
                        : pressed
                          ? t.colors.bgElevated
                          : t.colors.bgCanvas,
                      borderWidth: 1,
                      borderColor: active ? t.colors.indigo500 : t.colors.borderDefault,
                    })}
                  >
                    <Text
                      variant="caption"
                      weight="semibold"
                      style={{ color: active ? "#FFFFFF" : t.colors.inkSecondary, letterSpacing: 0 }}
                    >
                      {s === 1.0 ? "1×" : `${s}×`}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>

        <Text
          variant="caption"
          tone="tertiary"
          weight="semibold"
          style={{ marginBottom: 8, letterSpacing: 0.88 }}
        >
          EMPLOYEE VOICES
        </Text>

        {previewError ? (
          <View
            style={{
              paddingHorizontal: 14,
              paddingVertical: 10,
              backgroundColor: "rgba(214, 120, 23, 0.10)",
              borderWidth: 1,
              borderColor: "rgba(214, 120, 23, 0.40)",
              borderRadius: t.radii.md,
              marginBottom: 10,
            }}
          >
            <Text variant="caption" weight="semibold" style={{ color: "#D67817", letterSpacing: 0 }}>
              {previewError}
            </Text>
          </View>
        ) : null}

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
