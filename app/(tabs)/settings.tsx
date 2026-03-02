import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Switch,
  Linking,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';
import { useLeadsStore } from '../../store/leadsStore';
import { Colors } from '../../constants/colors';
import { TextStyles, Fonts, TypeScale } from '../../constants/typography';
import { ScreenPadding, Spacing, BorderRadius } from '../../constants/layout';

const { width: SCREEN_W } = Dimensions.get('window');

const APP_VERSION = '1.0.0';
const SUPPORT_EMAIL = 'support@conduitai.io';
const SUPPORT_PHONE = '18005551234';
const TERMS_URL = 'https://www.conduitai.io/terms';
const PRIVACY_URL = 'https://www.conduitai.io/privacy';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

// ── Shimmer Overlay ─────────────────────────────────────────

function ShimmerOverlay() {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
        Animated.delay(4000),
      ])
    ).start();
  }, []);
  return (
    <Animated.View
      style={[
        st.shimmer,
        { transform: [{ translateX: anim.interpolate({ inputRange: [0, 1], outputRange: [-SCREEN_W, SCREEN_W] }) }] },
      ]}
    >
      <LinearGradient
        colors={['transparent', 'rgba(255,255,255,0.03)', 'rgba(255,255,255,0.06)', 'rgba(255,255,255,0.03)', 'transparent']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  );
}

// ── Pulsing Footer ──────────────────────────────────────────

function PulsingFooter() {
  const pulse = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <View style={st.footerWrap}>
      <Animated.Text style={[st.footerBrand, { opacity: pulse }]}>Conduit AI</Animated.Text>
      <Text style={st.footerVersion}>v{APP_VERSION}</Text>
    </View>
  );
}

// ── Section Label ───────────────────────────────────────────

function SectionLabel({ children }: { children: string }) {
  return (
    <View style={st.sectionLabelRow}>
      <View style={st.sectionDot} />
      <Text style={st.sectionLabel}>{children}</Text>
    </View>
  );
}

// ── Animated Row ────────────────────────────────────────────

function Row({
  icon,
  iconColor,
  iconGradient,
  label,
  value,
  onPress,
  rightElement,
  isLast,
  danger,
}: {
  icon: IoniconsName;
  iconColor?: string;
  iconGradient?: readonly [string, string];
  label: string;
  value?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  isLast?: boolean;
  danger?: boolean;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (onPress) Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, friction: 8 }).start();
  };
  const handlePressOut = () => {
    if (onPress) Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 8 }).start();
  };

  const content = (
    <Animated.View style={[st.row, !isLast && st.rowBorder, { transform: [{ scale }] }]}>
      {danger ? (
        <View style={[st.rowIconWrap, { backgroundColor: Colors.dangerGlow }]}>
          <Ionicons name={icon} size={18} color={Colors.danger} />
        </View>
      ) : iconGradient ? (
        <LinearGradient colors={iconGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={st.rowIconWrap}>
          <Ionicons name={icon} size={18} color="#fff" />
        </LinearGradient>
      ) : (
        <View style={[st.rowIconWrap, { backgroundColor: `${iconColor || Colors.electric}15` }]}>
          <Ionicons name={icon} size={18} color={iconColor || Colors.electric} />
        </View>
      )}
      <View style={st.rowBody}>
        <Text style={[st.rowLabel, danger && { color: Colors.danger }]}>{label}</Text>
        {value ? <Text style={st.rowValue} numberOfLines={1}>{value}</Text> : null}
      </View>
      {rightElement || (onPress ? <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} /> : null)}
    </Animated.View>
  );

  if (onPress) {
    return (
      <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut} onPress={onPress}>
        {content}
      </Pressable>
    );
  }
  return content;
}

// ── Sign Out Button ─────────────────────────────────────────

function SignOutButton({ onPress }: { onPress: () => void }) {
  const scale = useRef(new Animated.Value(1)).current;
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 1500, useNativeDriver: false }),
        Animated.timing(glow, { toValue: 0, duration: 1500, useNativeDriver: false }),
      ])
    ).start();
  }, []);

  const shadowOpacity = glow.interpolate({ inputRange: [0, 1], outputRange: [0.1, 0.4] });

  return (
    <Pressable
      onPressIn={() => Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, friction: 8 }).start()}
      onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 8 }).start()}
      onPress={onPress}
    >
      <Animated.View
        style={[
          st.signOutCard,
          {
            transform: [{ scale }],
            shadowColor: Colors.danger,
            shadowOpacity,
            shadowRadius: 16,
            shadowOffset: { width: 0, height: 0 },
          },
        ]}
      >
        <ShimmerOverlay />
        <View style={[st.rowIconWrap, { backgroundColor: Colors.dangerGlow }]}>
          <Ionicons name="log-out-outline" size={18} color={Colors.danger} />
        </View>
        <Text style={st.signOutText}>Sign Out</Text>
        <Ionicons name="chevron-forward" size={16} color={Colors.danger} style={{ opacity: 0.6 }} />
      </Animated.View>
    </Pressable>
  );
}

// ── Main Screen ─────────────────────────────────────────────

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { signOut, user } = useAuthStore();
  const { agentStatus, toggleAgent } = useLeadsStore();

  const meta = user?.user_metadata;
  const ownerName = meta?.owner_name || meta?.full_name || meta?.name || meta?.display_name || '';
  const email = user?.email || '';
  const businessName = meta?.business_name || '';
  const greetingMessage = meta?.greeting_message || meta?.agent_greeting || 'Hi, thanks for calling! How can I help you today?';

  const agentActive = agentStatus?.is_active ?? true;
  const [pushEnabled, setPushEnabled] = useState(true);

  const handleAgentToggle = (val: boolean) => {
    if (!val) {
      Alert.alert(
        'Pause AI Agent',
        'Your agent will stop answering calls. Missed calls won\'t be captured.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Pause Agent', style: 'destructive', onPress: () => toggleAgent() },
        ]
      );
    } else {
      toggleAgent();
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  return (
    <View style={st.root}>
      <LinearGradient
        colors={[Colors.bgPrimary, Colors.bgPrimary, 'rgba(14, 165, 233, 0.03)']}
        locations={[0, 0.7, 1]}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView
        style={[st.container, { paddingTop: insets.top }]}
        contentContainerStyle={st.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={st.header}>
          <Text style={st.title}>Settings</Text>
          <Text style={st.subtitle}>{businessName || 'Your Business'}</Text>
        </View>

        {/* Account */}
        <SectionLabel>Account</SectionLabel>
        <View style={st.card}>
          <ShimmerOverlay />
          <Row icon="person-outline" iconGradient={Colors.gradientElectric} label="Name" value={ownerName || 'Not set'} />
          <Row icon="mail-outline" iconGradient={Colors.gradientElectric} label="Email" value={email || 'Not set'} />
          <Row icon="business-outline" iconGradient={Colors.gradientElectric} label="Business" value={businessName || 'Not set'} isLast />
        </View>

        {/* AI Agent */}
        <SectionLabel>AI Agent</SectionLabel>
        <View style={st.card}>
          <ShimmerOverlay />
          <Row
            icon="flash-outline"
            iconColor={agentActive ? Colors.success : Colors.textMuted}
            label="Agent Active"
            rightElement={
              <Switch
                value={agentActive}
                onValueChange={handleAgentToggle}
                trackColor={{ false: Colors.bgElevated, true: Colors.success }}
                thumbColor="#fff"
              />
            }
          />
          <View style={st.greetingRow}>
            <View style={st.greetingLabelRow}>
              <View style={[st.greetingDot, { backgroundColor: agentActive ? Colors.success : Colors.textMuted }]} />
              <Text style={st.greetingLabel}>Greeting Preview</Text>
            </View>
            <View style={st.greetingBubble}>
              <Text style={st.greetingText}>"{greetingMessage}"</Text>
            </View>
          </View>
        </View>

        {/* Notifications */}
        <SectionLabel>Notifications</SectionLabel>
        <View style={st.card}>
          <ShimmerOverlay />
          <Row
            icon="notifications-outline"
            iconColor={Colors.warning}
            label="Push Notifications"
            rightElement={
              <Switch
                value={pushEnabled}
                onValueChange={setPushEnabled}
                trackColor={{ false: Colors.bgElevated, true: Colors.electric }}
                thumbColor="#fff"
              />
            }
            isLast
          />
        </View>

        {/* Subscription */}
        <SectionLabel>Subscription</SectionLabel>
        <View style={st.card}>
          <ShimmerOverlay />
          <Row icon="diamond-outline" iconColor={Colors.cyan} label="Current Plan" value="Pro" />
          <Row
            icon="card-outline"
            iconColor={Colors.cyan}
            label="Manage Billing"
            onPress={() => Linking.openURL('https://www.conduitai.io/billing')}
            isLast
          />
        </View>

        {/* Support */}
        <SectionLabel>Support</SectionLabel>
        <View style={st.card}>
          <ShimmerOverlay />
          <Row
            icon="mail-outline"
            iconColor={Colors.warning}
            label="Email Support"
            value={SUPPORT_EMAIL}
            onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}
          />
          <Row
            icon="call-outline"
            iconColor={Colors.warning}
            label="Call Support"
            onPress={() => Linking.openURL(`tel:${SUPPORT_PHONE}`)}
            isLast
          />
        </View>

        {/* App Info */}
        <SectionLabel>App Info</SectionLabel>
        <View style={st.card}>
          <ShimmerOverlay />
          <Row icon="information-circle-outline" iconColor={Colors.textSecondary} label="Version" value={APP_VERSION} />
          <Row
            icon="document-text-outline"
            iconColor={Colors.textSecondary}
            label="Terms of Service"
            onPress={() => Linking.openURL(TERMS_URL)}
          />
          <Row
            icon="shield-checkmark-outline"
            iconColor={Colors.textSecondary}
            label="Privacy Policy"
            onPress={() => Linking.openURL(PRIVACY_URL)}
            isLast
          />
        </View>

        {/* Sign Out */}
        <View style={{ marginTop: Spacing.xl }}>
          <SignOutButton onPress={handleSignOut} />
        </View>

        <PulsingFooter />
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bgPrimary },
  container: { flex: 1 },
  scroll: { paddingHorizontal: ScreenPadding.horizontal },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingTop: Spacing.base,
    paddingBottom: Spacing.sm,
  },
  title: { ...TextStyles.h1, color: Colors.textPrimary },
  subtitle: { ...Fonts.mono, fontSize: TypeScale.bodySm, color: Colors.textMuted },

  /* Section label with dot */
  sectionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  sectionDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.electric },
  sectionLabel: {
    ...Fonts.bodyMedium,
    fontSize: TypeScale.caption,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  /* Cards */
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },

  /* Shimmer */
  shimmer: { position: 'absolute', top: 0, bottom: 0, width: SCREEN_W * 0.6, zIndex: 1 },

  /* Rows */
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  rowIconWrap: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  rowBody: { flex: 1 },
  rowLabel: {
    ...Fonts.bodySemibold,
    fontSize: TypeScale.body,
    color: Colors.textPrimary,
  },
  rowValue: {
    ...Fonts.body,
    fontSize: TypeScale.bodySm,
    color: Colors.textSecondary,
    marginTop: 1,
  },

  /* Greeting */
  greetingRow: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.base,
  },
  greetingLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  greetingDot: { width: 6, height: 6, borderRadius: 3 },
  greetingLabel: {
    ...Fonts.bodyMedium,
    fontSize: TypeScale.caption,
    color: Colors.textMuted,
  },
  greetingBubble: {
    backgroundColor: Colors.bgInput,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderElectric,
  },
  greetingText: {
    ...Fonts.body,
    fontSize: TypeScale.bodySm,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    lineHeight: TypeScale.bodySm * 1.5,
  },

  /* Sign Out */
  signOutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
    overflow: 'hidden',
  },
  signOutText: {
    ...Fonts.bodySemibold,
    fontSize: TypeScale.body,
    color: Colors.danger,
    flex: 1,
  },

  /* Footer */
  footerWrap: {
    alignItems: 'center',
    marginTop: Spacing.xl,
    gap: 2,
  },
  footerBrand: {
    ...Fonts.bodySemibold,
    fontSize: TypeScale.bodySm,
    color: Colors.electric,
  },
  footerVersion: {
    ...Fonts.mono,
    fontSize: TypeScale.tiny,
    color: Colors.textDisabled,
  },
});
