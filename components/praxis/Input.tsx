import React, { forwardRef, useState } from "react";
import { TextInput, View, type TextInputProps, type StyleProp, type ViewStyle } from "react-native";
import { usePraxisTheme } from "../../contexts/PraxisThemeContext";
import { Text } from "./Text";

export interface InputProps extends Omit<TextInputProps, "style"> {
  label?: string;
  hint?: string;
  error?: string | null;
  leftAdornment?: React.ReactNode;
  rightAdornment?: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
}

export const Input = forwardRef<TextInput, InputProps>(function Input(
  { label, hint, error, leftAdornment, rightAdornment, containerStyle, onFocus, onBlur, ...rest },
  ref,
) {
  const t = usePraxisTheme();
  const [focused, setFocused] = useState(false);

  const borderColor = error
    ? t.colors.danger
    : focused
      ? t.colors.indigo500
      : t.colors.borderDefault;

  return (
    <View style={containerStyle}>
      {label ? (
        <Text variant="bodySm" weight="medium" tone="secondary" style={{ marginBottom: 6 }}>
          {label}
        </Text>
      ) : null}

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: t.colors.bgSurface,
          borderRadius: t.radii.md,
          borderWidth: 1,
          borderColor,
          paddingHorizontal: 12,
          minHeight: 48,
        }}
      >
        {leftAdornment ? <View style={{ marginRight: 8 }}>{leftAdornment}</View> : null}
        <TextInput
          ref={ref}
          {...rest}
          placeholderTextColor={t.colors.inkTertiary}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={{
            flex: 1,
            color: t.colors.inkPrimary,
            fontFamily: t.fonts.body,
            fontSize: t.typeScale.body.fontSize,
            paddingVertical: 12,
          }}
        />
        {rightAdornment ? <View style={{ marginLeft: 8 }}>{rightAdornment}</View> : null}
      </View>

      {error ? (
        <Text variant="bodySm" tone="danger" style={{ marginTop: 6 }}>
          {error}
        </Text>
      ) : hint ? (
        <Text variant="bodySm" tone="tertiary" style={{ marginTop: 6 }}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
});
