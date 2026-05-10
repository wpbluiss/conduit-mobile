import React, { useState } from "react";
import {
  View,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { ArrowUp, Microphone, StopCircle, Plus } from "phosphor-react-native";
import * as Haptics from "expo-haptics";
import { usePraxisTheme } from "../../../contexts/PraxisThemeContext";

export interface ComposerProps {
  onSubmit: (text: string) => void;
  onVoicePress?: () => void;
  onPlusPress?: () => void;
  onCancel?: () => void;
  disabled?: boolean;
  streaming?: boolean;
  placeholder?: string;
  initialValue?: string;
  autoFocus?: boolean;
}

export function Composer({
  onSubmit,
  onVoicePress,
  onPlusPress,
  onCancel,
  disabled,
  streaming,
  placeholder = "Message Praxis…",
  initialValue,
  autoFocus,
}: ComposerProps) {
  const t = usePraxisTheme();
  const [value, setValue] = useState(initialValue ?? "");
  const [focused, setFocused] = useState(false);

  React.useEffect(() => {
    if (initialValue !== undefined) setValue(initialValue);
  }, [initialValue]);

  const hasText = value.trim().length > 0;
  const canSend = hasText && !disabled && !streaming;

  // Morph progress: 0 → mic showing, 1 → send showing
  const morph = useSharedValue(0);
  React.useEffect(() => {
    morph.value = withTiming(hasText ? 1 : 0, {
      duration: 180,
      easing: Easing.out(Easing.cubic),
    });
  }, [hasText, morph]);

  const sendStyle = useAnimatedStyle(() => ({
    opacity: morph.value,
    transform: [{ scale: 0.85 + morph.value * 0.15 }],
  }));
  const micStyle = useAnimatedStyle(() => ({
    opacity: 1 - morph.value,
    transform: [{ scale: 1 - morph.value * 0.15 }],
  }));

  const send = () => {
    const text = value.trim();
    if (!text) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setValue("");
    onSubmit(text);
  };

  const handleVoice = () => {
    if (streaming || disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    onVoicePress?.();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
      <View
        style={{
          paddingHorizontal: 12,
          paddingTop: 8,
          paddingBottom: 12,
          backgroundColor: t.colors.bgCanvas,
          flexDirection: "row",
          alignItems: "flex-end",
          gap: 8,
        }}
      >
        {onPlusPress ? (
          <Pressable
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              onPlusPress();
            }}
            disabled={disabled}
            style={({ pressed }) => ({
              width: 40,
              height: 40,
              borderRadius: 20,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: pressed ? t.colors.bgElevated : t.colors.bgSurface,
              borderWidth: 1,
              borderColor: t.colors.borderSubtle,
              alignSelf: "flex-end",
              marginBottom: 2,
            })}
          >
            <Plus size={18} color={t.colors.inkSecondary} weight="bold" />
          </Pressable>
        ) : null}

        <View
          style={{
            flex: 1,
            backgroundColor: t.colors.bgSurface,
            borderRadius: 24,
            borderWidth: 1,
            borderColor: focused ? t.colors.indigo500 : t.colors.borderSubtle,
            paddingLeft: 16,
            paddingRight: 6,
            paddingVertical: 4,
            flexDirection: "row",
            alignItems: "flex-end",
            minHeight: 44,
          }}
        >
          <TextInput
            value={value}
            onChangeText={setValue}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={placeholder}
            placeholderTextColor={t.colors.inkTertiary}
            multiline
            autoFocus={autoFocus}
            // Suppress the iOS predictive / "Done" accessory bar — the
            // composer has its own send + dismiss affordances.
            autoCorrect={false}
            spellCheck={false}
            autoCapitalize="sentences"
            keyboardAppearance={t.isDark ? "dark" : "light"}
            returnKeyType="default"
            blurOnSubmit={false}
            style={{
              flex: 1,
              color: t.colors.inkPrimary,
              fontFamily: t.fonts.body,
              fontSize: 17,
              lineHeight: 22,
              maxHeight: 132,
              paddingTop: Platform.OS === "ios" ? 10 : 8,
              paddingBottom: Platform.OS === "ios" ? 10 : 8,
              paddingHorizontal: 0,
            }}
            editable={!disabled}
          />

          {streaming && onCancel ? (
            <Pressable
              onPress={onCancel}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: t.colors.bgElevated,
                marginBottom: 2,
              }}
            >
              <StopCircle size={20} color={t.colors.inkPrimary} weight="fill" />
            </Pressable>
          ) : (
            <View
              style={{
                width: 36,
                height: 36,
                marginBottom: 2,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Animated.View
                style={[
                  {
                    position: "absolute",
                    width: 36,
                    height: 36,
                    alignItems: "center",
                    justifyContent: "center",
                    pointerEvents: hasText ? "none" : "auto",
                  },
                  micStyle,
                ]}
              >
                <Pressable
                  onPress={handleVoice}
                  disabled={hasText || disabled}
                  hitSlop={4}
                  style={({ pressed }) => ({
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: pressed
                      ? t.colors.indigoSoft
                      : "transparent",
                  })}
                >
                  <Microphone
                    size={20}
                    color={t.colors.inkSecondary}
                    weight="regular"
                  />
                </Pressable>
              </Animated.View>

              <Animated.View
                style={[
                  {
                    position: "absolute",
                    width: 36,
                    height: 36,
                    alignItems: "center",
                    justifyContent: "center",
                    pointerEvents: hasText ? "auto" : "none",
                  },
                  sendStyle,
                ]}
              >
                <Pressable
                  onPress={send}
                  disabled={!canSend}
                  hitSlop={4}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: canSend
                      ? t.colors.indigo500
                      : t.colors.bgElevated,
                  }}
                >
                  <ArrowUp
                    size={18}
                    color={canSend ? "#FFFFFF" : t.colors.inkTertiary}
                    weight="bold"
                  />
                </Pressable>
              </Animated.View>
            </View>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
