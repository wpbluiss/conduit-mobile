import React, { useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { useTheme } from '../../contexts/ThemeContext';
import { Fonts, TypeScale } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/layout';

const { width: SCREEN_W } = Dimensions.get('window');
const BANNER_HEIGHT = 96;
const AUTO_DISMISS_MS = 5000;

export interface BannerData {
  category: 'new_lead' | 'call_completed';
  lead_id?: string;
  caller_name?: string;
  caller_phone?: string;
  summary?: string;
  duration?: string;
  outcome?: string;
}

interface Props {
  data: BannerData | null;
  onPress?: (leadId: string) => void;
  onDismiss?: () => void;
}

export function NotificationBanner({ data, onPress, onDismiss }: Props) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-(BANNER_HEIGHT + insets.top + 20))).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scale = useRef(new Animated.Value(1)).current;

  const dismiss = useCallback(() => {
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
    Animated.parallel([
      Animated.spring(translateY, { toValue: -(BANNER_HEIGHT + insets.top + 20), useNativeDriver: true, friction: 10 }),
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => onDismiss?.());
  }, [insets.top, onDismiss]);

  useEffect(() => {
    if (data) {
      translateY.setValue(-(BANNER_HEIGHT + insets.top + 20));
      opacity.setValue(0);

      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true, friction: 8, tension: 60 }),
        Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();

      dismissTimer.current = setTimeout(dismiss, AUTO_DISMISS_MS);
    }

    return () => {
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
    };
  }, [data, insets.top]);

  if (!data) return null;

  const isNewLead = data.category === 'new_lead';
  const title = isNewLead ? 'New Lead Captured' : 'Call Handled';
  const icon: React.ComponentProps<typeof Ionicons>['name'] = isNewLead ? 'person-add-outline' : 'call-outline';
  const accentColor = isNewLead ? Colors.electric : Colors.success;

  const body = isNewLead
    ? [data.caller_name, data.summary].filter(Boolean).join(' — ')
    : [data.duration, data.outcome].filter(Boolean).join(' — ');

  const subtitle = isNewLead && data.caller_phone ? data.caller_phone : undefined;

  const handlePress = () => {
    if (data.lead_id) {
      dismiss();
      onPress?.(data.lead_id);
    }
  };

  return (
    <Animated.View
      style={[
        st.container,
        { paddingTop: insets.top + Spacing.sm, transform: [{ translateY }, { scale }], opacity },
      ]}
    >
      <Pressable
        onPressIn={() => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, friction: 8 }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 8 }).start()}
        onPress={handlePress}
        style={st.pressable}
      >
        <View style={st.cardOuter}>
          <BlurView intensity={30} tint={isDark ? 'dark' : 'light'} style={st.blur}>
            <View style={[st.cardInner, { backgroundColor: isDark ? 'rgba(17, 24, 39, 0.8)' : 'rgba(255, 255, 255, 0.85)' }]}>
              <View style={[st.accentBar, { backgroundColor: accentColor }]} />
              <View style={[st.iconWrap, { backgroundColor: `${accentColor}20` }]}>
                <Ionicons name={icon} size={20} color={accentColor} />
              </View>
              <View style={st.textCol}>
                <Text style={st.title} numberOfLines={1}>{title}</Text>
                {body ? <Text style={st.body} numberOfLines={1}>{body}</Text> : null}
                {subtitle ? <Text style={st.subtitle} numberOfLines={1}>{subtitle}</Text> : null}
              </View>
              <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
            </View>
          </BlurView>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const st = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingHorizontal: Spacing.md,
  },
  pressable: {},
  cardOuter: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  blur: {
    overflow: 'hidden',
    borderRadius: BorderRadius.xl,
  },
  cardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    backgroundColor: 'rgba(17, 24, 39, 0.8)',
    gap: Spacing.md,
  },
  accentBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: { flex: 1, gap: 1 },
  title: {
    ...Fonts.bodySemibold,
    fontSize: TypeScale.body,
    color: Colors.textPrimary,
  },
  body: {
    ...Fonts.body,
    fontSize: TypeScale.bodySm,
    color: Colors.textSecondary,
  },
  subtitle: {
    ...Fonts.mono,
    fontSize: TypeScale.caption,
    color: Colors.textMuted,
  },
});
