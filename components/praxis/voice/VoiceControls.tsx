import React from "react";
import { View, Pressable } from "react-native";
import { Microphone, X, SpeakerHigh, SpeakerSlash } from "phosphor-react-native";
import * as Haptics from "expo-haptics";
import { usePraxisTheme } from "../../../contexts/PraxisThemeContext";
import { Text } from "../Text";

export interface VoiceControlsProps {
  onPressMic?: () => void;
  onLongPressMic?: () => void;
  onReleaseMic?: () => void;
  onClose: () => void;
  onToggleMute: () => void;
  muted: boolean;
  micLabel?: string;
  micActive?: boolean;
  micDisabled?: boolean;
}

export function VoiceControls({
  onPressMic,
  onLongPressMic,
  onReleaseMic,
  onClose,
  onToggleMute,
  muted,
  micLabel = "Voice input arrives next build",
  micActive,
  micDisabled,
}: VoiceControlsProps) {
  const t = usePraxisTheme();

  return (
    <View
      style={{
        paddingHorizontal: 24,
        paddingBottom: 24,
        gap: 18,
        alignItems: "center",
      }}
    >
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
          onPressMic?.();
        }}
        onLongPress={onLongPressMic}
        onPressOut={onReleaseMic}
        disabled={micDisabled}
        style={({ pressed }) => ({
          width: 88,
          height: 88,
          borderRadius: 44,
          backgroundColor: micActive
            ? t.colors.indigo500
            : pressed
              ? t.colors.indigoSoft
              : t.colors.bgSurface,
          borderWidth: 1.5,
          borderColor: micActive ? t.colors.indigo500 : t.colors.borderDefault,
          alignItems: "center",
          justifyContent: "center",
          opacity: micDisabled ? 0.55 : 1,
          shadowColor: t.colors.indigo500,
          shadowOpacity: micActive ? 0.5 : 0,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 0 },
        })}
      >
        <Microphone
          size={36}
          color={micActive ? "#FFFFFF" : t.colors.inkPrimary}
          weight={micActive ? "fill" : "regular"}
        />
      </Pressable>

      {micLabel ? (
        <Text variant="bodySm" tone="tertiary" align="center">
          {micLabel}
        </Text>
      ) : null}

      <View
        style={{
          flexDirection: "row",
          gap: 12,
          alignItems: "center",
          marginTop: 4,
        }}
      >
        <Pressable
          onPress={onToggleMute}
          style={({ pressed }) => ({
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderRadius: t.radii.full,
            backgroundColor: pressed ? t.colors.bgElevated : t.colors.bgSurface,
            borderWidth: 1,
            borderColor: t.colors.borderSubtle,
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
          })}
        >
          {muted ? (
            <SpeakerSlash size={16} color={t.colors.inkSecondary} />
          ) : (
            <SpeakerHigh size={16} color={t.colors.inkSecondary} />
          )}
          <Text variant="bodySm" weight="medium" tone="secondary">
            {muted ? "Audio muted" : "Audio on"}
          </Text>
        </Pressable>

        <Pressable
          onPress={onClose}
          style={({ pressed }) => ({
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderRadius: t.radii.full,
            backgroundColor: pressed ? t.colors.bgElevated : t.colors.bgSurface,
            borderWidth: 1,
            borderColor: t.colors.borderSubtle,
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
          })}
        >
          <X size={16} color={t.colors.inkSecondary} />
          <Text variant="bodySm" weight="medium" tone="secondary">
            Close
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
