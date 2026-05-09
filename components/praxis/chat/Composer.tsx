import React, { useState } from "react";
import { View, TextInput, Pressable, KeyboardAvoidingView, Platform } from "react-native";
import { ArrowUp, Microphone, StopCircle } from "phosphor-react-native";
import * as Haptics from "expo-haptics";
import { usePraxisTheme } from "../../../contexts/PraxisThemeContext";

export interface ComposerProps {
  onSubmit: (text: string) => void;
  onVoicePress?: () => void;
  onCancel?: () => void;
  disabled?: boolean;
  streaming?: boolean;
  placeholder?: string;
}

export function Composer({
  onSubmit,
  onVoicePress,
  onCancel,
  disabled,
  streaming,
  placeholder = "Message Praxis…",
}: ComposerProps) {
  const t = usePraxisTheme();
  const [value, setValue] = useState("");

  const canSend = value.trim().length > 0 && !disabled && !streaming;

  const send = () => {
    const text = value.trim();
    if (!text) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setValue("");
    onSubmit(text);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <View
        style={{
          paddingHorizontal: 12,
          paddingTop: 8,
          paddingBottom: 12,
          backgroundColor: t.colors.bgCanvas,
          borderTopWidth: 0.5,
          borderTopColor: t.colors.borderSubtle,
          flexDirection: "row",
          alignItems: "flex-end",
          gap: 8,
        }}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: t.colors.bgSurface,
            borderRadius: t.radii.xl,
            borderWidth: 1,
            borderColor: t.colors.borderSubtle,
            paddingLeft: 16,
            paddingRight: 8,
            paddingVertical: 6,
            flexDirection: "row",
            alignItems: "flex-end",
            minHeight: 44,
          }}
        >
          <TextInput
            value={value}
            onChangeText={setValue}
            placeholder={placeholder}
            placeholderTextColor={t.colors.inkTertiary}
            multiline
            style={{
              flex: 1,
              color: t.colors.inkPrimary,
              fontFamily: t.fonts.body,
              fontSize: t.typeScale.body.fontSize,
              maxHeight: 140,
              paddingTop: 8,
              paddingBottom: 8,
            }}
            editable={!disabled}
          />
          {onVoicePress && !value ? (
            <Pressable
              onPress={onVoicePress}
              hitSlop={8}
              style={{ padding: 6, alignSelf: "center" }}
            >
              <Microphone size={20} color={t.colors.inkSecondary} />
            </Pressable>
          ) : null}
        </View>

        {streaming && onCancel ? (
          <Pressable
            onPress={onCancel}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: t.colors.bgElevated,
            }}
          >
            <StopCircle size={22} color={t.colors.inkPrimary} weight="fill" />
          </Pressable>
        ) : (
          <Pressable
            onPress={send}
            disabled={!canSend}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: canSend ? t.colors.indigo500 : t.colors.bgElevated,
              opacity: canSend ? 1 : 0.6,
            }}
          >
            <ArrowUp size={22} color={canSend ? "#FFFFFF" : t.colors.inkTertiary} weight="bold" />
          </Pressable>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}
