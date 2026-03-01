import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TextInputProps, Pressable } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, interpolateColor } from 'react-native-reanimated';
import { Colors } from '../../constants/colors';
import { Fonts, TypeScale } from '../../constants/typography';
import { BorderRadius, Spacing } from '../../constants/layout';

interface InputProps extends TextInputProps { label?: string; error?: string; icon?: React.ReactNode; rightIcon?: React.ReactNode; onRightIconPress?: () => void; }

export function Input({ label, error, icon, rightIcon, onRightIconPress, style, ...props }: InputProps) {
  const fp = useSharedValue(0);
  const focus = () => { fp.value = withTiming(1, { duration: 150 }); };
  const blur = () => { fp.value = withTiming(0, { duration: 150 }); };
  const bc = error ? Colors.danger : Colors.electric;
  const cs = useAnimatedStyle(() => ({ borderColor: interpolateColor(fp.value, [0, 1], [Colors.border as string, bc]) }));

  return (
    <View style={st.wrap}>
      {label && <Text style={st.label}>{label}</Text>}
      <Animated.View style={[st.container, cs]}>
        {icon && <View style={st.iconL}>{icon}</View>}
        <TextInput {...props} style={[st.input, icon ? { paddingLeft: 0 } : undefined, style]} placeholderTextColor={Colors.textMuted} onFocus={focus} onBlur={blur} selectionColor={Colors.electric} />
        {rightIcon && <Pressable onPress={onRightIconPress} style={st.iconR}>{rightIcon}</Pressable>}
      </Animated.View>
      {error && <Text style={st.error}>{error}</Text>}
    </View>
  );
}

const st = StyleSheet.create({
  wrap: { gap: Spacing.sm },
  label: { ...Fonts.bodyMedium, fontSize: TypeScale.bodySm, color: Colors.textSecondary, marginLeft: 2 },
  container: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bgInput, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Spacing.base, height: 50 },
  input: { flex: 1, ...Fonts.body, fontSize: TypeScale.body, color: Colors.textPrimary, paddingVertical: 0, height: '100%' },
  iconL: { marginRight: Spacing.md, width: 20, alignItems: 'center' },
  iconR: { marginLeft: Spacing.md, width: 24, alignItems: 'center', justifyContent: 'center', padding: Spacing.xs },
  error: { ...Fonts.body, fontSize: TypeScale.caption, color: Colors.danger, marginLeft: 2 },
});
