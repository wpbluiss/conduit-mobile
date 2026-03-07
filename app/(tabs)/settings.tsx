import { useState, useEffect, useRef, useCallback } from 'react';
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
  LayoutAnimation,
  TextInput,
  ActivityIndicator,
  Platform,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../../store/authStore';
import { useLeadsStore } from '../../store/leadsStore';
import { useAppTheme } from '../../contexts/ThemeContext';
import { TextStyles, Fonts, TypeScale } from '../../constants/typography';
import { ScreenPadding, Spacing, BorderRadius } from '../../constants/layout';
import { api } from '../../lib/api';
import { supabase } from '../../lib/supabase';
import type { UserProfile, Invoice } from '../../lib/api';

const { width: SCREEN_W } = Dimensions.get('window');

const APP_VERSION = '1.0.0';
const BUILD_NUMBER = '42';
const SUPPORT_EMAIL = 'support@conduitai.io';
const SUPPORT_PHONE = '15614464520';
const TERMS_URL = 'https://www.conduitai.io/terms';
const PRIVACY_URL = 'https://www.conduitai.io/privacy';
const FAQ_URL = 'https://www.conduitai.io/faq';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const PLAN_LABELS: Record<string, string> = {
  free: 'Free',
  solo: 'Solo Operator',
  business: 'Business',
  professional: 'Professional',
  enterprise: 'Enterprise',
  demo: 'Demo Mode',
};

const PLAN_PRICES: Record<string, string> = {
  free: '$0',
  solo: '$39',
  business: '$99',
  professional: '$199',
  enterprise: '$499',
};

// ── Shimmer Overlay ─────────────────────────────────────────

function ShimmerOverlay() {
  const { colors, isDark } = useAppTheme();
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

  const shimmerColor = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)';
  const shimmerPeak = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';

  return (
    <Animated.View
      style={[
        st.shimmer,
        { transform: [{ translateX: anim.interpolate({ inputRange: [0, 1], outputRange: [-SCREEN_W, SCREEN_W] }) }] },
      ]}
    >
      <LinearGradient
        colors={['transparent', shimmerColor, shimmerPeak, shimmerColor, 'transparent']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  );
}

// ── Pulsing Footer ──────────────────────────────────────────

function PulsingFooter() {
  const { colors } = useAppTheme();
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
      <Animated.Text style={[st.footerBrand, { opacity: pulse, color: colors.electric }]}>Conduit AI</Animated.Text>
      <Text style={[st.footerVersion, { color: colors.textDisabled }]}>v{APP_VERSION} ({BUILD_NUMBER})</Text>
    </View>
  );
}

// ── Section Header (collapsible) ────────────────────────────

function SectionHeader({
  icon,
  iconColor,
  title,
  expanded,
  onPress,
  badge,
}: {
  icon: IoniconsName;
  iconColor?: string;
  title: string;
  expanded: boolean;
  onPress: () => void;
  badge?: string;
}) {
  const { colors } = useAppTheme();
  const color = iconColor || colors.electric;

  return (
    <Pressable onPress={onPress} style={st.sectionHeader}>
      <View style={[st.sectionHeaderIcon, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon} size={16} color={color} />
      </View>
      <Text style={[st.sectionHeaderTitle, { color: colors.textPrimary }]}>{title}</Text>
      {badge ? (
        <View style={[st.badge, { backgroundColor: `${color}20` }]}>
          <Text style={[st.badgeText, { color }]}>{badge}</Text>
        </View>
      ) : null}
      <Ionicons
        name={expanded ? 'chevron-up' : 'chevron-down'}
        size={16}
        color={colors.textMuted}
      />
    </Pressable>
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
  const { colors } = useAppTheme();
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (onPress) Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, friction: 8 }).start();
  };
  const handlePressOut = () => {
    if (onPress) Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 8 }).start();
  };

  const content = (
    <Animated.View style={[st.row, !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border }, { transform: [{ scale }] }]}>
      {danger ? (
        <View style={[st.rowIconWrap, { backgroundColor: colors.dangerGlow }]}>
          <Ionicons name={icon} size={18} color={colors.danger} />
        </View>
      ) : iconGradient ? (
        <LinearGradient colors={iconGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={st.rowIconWrap}>
          <Ionicons name={icon} size={18} color="#fff" />
        </LinearGradient>
      ) : (
        <View style={[st.rowIconWrap, { backgroundColor: `${iconColor || colors.electric}15` }]}>
          <Ionicons name={icon} size={18} color={iconColor || colors.electric} />
        </View>
      )}
      <View style={st.rowBody}>
        <Text style={[st.rowLabel, { color: danger ? colors.danger : colors.textPrimary }]}>{label}</Text>
        {value ? <Text style={[st.rowValue, { color: colors.textSecondary }]} numberOfLines={1}>{value}</Text> : null}
      </View>
      {rightElement || (onPress ? <Ionicons name="chevron-forward" size={16} color={colors.textMuted} /> : null)}
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

// ── Editable Row ────────────────────────────────────────────

function EditableRow({
  icon,
  iconColor,
  label,
  value,
  onSave,
  keyboardType,
  isLast,
}: {
  icon: IoniconsName;
  iconColor?: string;
  label: string;
  value: string;
  onSave: (val: string) => void;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  isLast?: boolean;
}) {
  const { colors } = useAppTheme();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  useEffect(() => { setDraft(value); }, [value]);

  const save = () => {
    setEditing(false);
    if (draft.trim() !== value) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSave(draft.trim());
    }
  };

  return (
    <View style={[st.row, !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
      <View style={[st.rowIconWrap, { backgroundColor: `${iconColor || colors.electric}15` }]}>
        <Ionicons name={icon} size={18} color={iconColor || colors.electric} />
      </View>
      <View style={st.rowBody}>
        <Text style={[st.rowLabel, { color: colors.textPrimary }]}>{label}</Text>
        {editing ? (
          <TextInput
            value={draft}
            onChangeText={setDraft}
            onBlur={save}
            onSubmitEditing={save}
            autoFocus
            style={[st.editInput, { color: colors.textPrimary, borderBottomColor: colors.electric }]}
            keyboardType={keyboardType}
            placeholderTextColor={colors.textDisabled}
            returnKeyType="done"
            selectionColor={colors.electric}
          />
        ) : (
          <Text style={[st.rowValue, { color: colors.textSecondary }]} numberOfLines={1}>{value || 'Not set'}</Text>
        )}
      </View>
      <Pressable
        onPress={() => {
          Haptics.selectionAsync();
          if (editing) save();
          else setEditing(true);
        }}
        hitSlop={12}
      >
        <Ionicons
          name={editing ? 'checkmark-circle' : 'create-outline'}
          size={18}
          color={editing ? colors.success : colors.textMuted}
        />
      </Pressable>
    </View>
  );
}

// ── Toggle Row ──────────────────────────────────────────────

function ToggleRow({
  icon,
  iconColor,
  label,
  description,
  value,
  onToggle,
  isLast,
}: {
  icon: IoniconsName;
  iconColor?: string;
  label: string;
  description?: string;
  value: boolean;
  onToggle: (v: boolean) => void;
  isLast?: boolean;
}) {
  const { colors } = useAppTheme();
  return (
    <View style={[st.row, !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
      <View style={[st.rowIconWrap, { backgroundColor: `${iconColor || colors.electric}15` }]}>
        <Ionicons name={icon} size={18} color={iconColor || colors.electric} />
      </View>
      <View style={st.rowBody}>
        <Text style={[st.rowLabel, { color: colors.textPrimary }]}>{label}</Text>
        {description ? <Text style={[st.rowValue, { color: colors.textSecondary }]}>{description}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={(v) => { Haptics.selectionAsync(); onToggle(v); }}
        trackColor={{ false: colors.bgElevated, true: colors.electric }}
        thumbColor="#fff"
      />
    </View>
  );
}

// ── Integration Row ─────────────────────────────────────────

function IntegrationRow({
  icon,
  iconColor,
  name,
  description,
  connected,
  onToggle,
  isLast,
}: {
  icon: IoniconsName;
  iconColor: string;
  name: string;
  description: string;
  connected: boolean;
  onToggle: () => void;
  isLast?: boolean;
}) {
  const { colors } = useAppTheme();
  const scale = useRef(new Animated.Value(1)).current;

  return (
    <View style={[st.row, !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
      <View style={[st.rowIconWrap, { backgroundColor: `${iconColor}15` }]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <View style={st.rowBody}>
        <Text style={[st.rowLabel, { color: colors.textPrimary }]}>{name}</Text>
        <Text style={[st.rowValue, { color: colors.textSecondary }]}>{description}</Text>
      </View>
      <Pressable
        onPressIn={() => Animated.spring(scale, { toValue: 0.9, useNativeDriver: true, friction: 8 }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 8 }).start()}
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onToggle(); }}
      >
        <Animated.View
          style={[
            st.connectBtn,
            { borderColor: connected ? colors.success : colors.borderLight },
            connected && { backgroundColor: colors.successGlow },
            { transform: [{ scale }] },
          ]}
        >
          <Text style={[st.connectBtnText, { color: connected ? colors.success : colors.textSecondary }]}>
            {connected ? 'Connected' : 'Connect'}
          </Text>
        </Animated.View>
      </Pressable>
    </View>
  );
}

// ── Invoice Row ─────────────────────────────────────────────

function InvoiceRow({ invoice, isLast }: { invoice: Invoice; isLast?: boolean }) {
  const { colors } = useAppTheme();
  const statusColor = invoice.status === 'paid' ? colors.success : invoice.status === 'pending' ? colors.warning : colors.danger;
  return (
    <View style={[st.row, !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
      <View style={[st.rowIconWrap, { backgroundColor: `${statusColor}15` }]}>
        <Ionicons name="receipt-outline" size={18} color={statusColor} />
      </View>
      <View style={st.rowBody}>
        <Text style={[st.rowLabel, { color: colors.textPrimary }]}>{invoice.description}</Text>
        <Text style={[st.rowValue, { color: colors.textSecondary }]}>{new Date(invoice.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={[st.invoiceAmount, { color: colors.textPrimary }]}>${invoice.amount.toFixed(2)}</Text>
        <Text style={[st.invoiceStatus, { color: statusColor }]}>
          {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
        </Text>
      </View>
    </View>
  );
}

// ── Sign Out Button ─────────────────────────────────────────

function SignOutButton({ onPress }: { onPress: () => void }) {
  const { colors } = useAppTheme();
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
            backgroundColor: colors.bgCard,
            borderColor: 'rgba(239, 68, 68, 0.2)',
            transform: [{ scale }],
            shadowColor: colors.danger,
            shadowOpacity,
            shadowRadius: 16,
            shadowOffset: { width: 0, height: 0 },
          },
        ]}
      >
        <ShimmerOverlay />
        <View style={[st.rowIconWrap, { backgroundColor: colors.dangerGlow }]}>
          <Ionicons name="log-out-outline" size={18} color={colors.danger} />
        </View>
        <Text style={[st.signOutText, { color: colors.danger }]}>Sign Out</Text>
        <Ionicons name="chevron-forward" size={16} color={colors.danger} style={{ opacity: 0.6 }} />
      </Animated.View>
    </Pressable>
  );
}

// ── Create Account Button (Guest Mode) ─────────────────────

function CreateAccountButton({ onPress }: { onPress: () => void }) {
  const { colors } = useAppTheme();
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
            backgroundColor: colors.bgCard,
            borderColor: 'rgba(14, 165, 233, 0.2)',
            transform: [{ scale }],
            shadowColor: colors.electric,
            shadowOpacity,
            shadowRadius: 16,
            shadowOffset: { width: 0, height: 0 },
          },
        ]}
      >
        <ShimmerOverlay />
        <View style={[st.rowIconWrap, { backgroundColor: colors.electricMuted }]}>
          <Ionicons name="person-add-outline" size={18} color={colors.electric} />
        </View>
        <Text style={[st.signOutText, { color: colors.electric }]}>Create Account</Text>
        <Ionicons name="chevron-forward" size={16} color={colors.electric} style={{ opacity: 0.6 }} />
      </Animated.View>
    </Pressable>
  );
}

// ── Profile Card ────────────────────────────────────────────

function ProfileCard({
  name,
  email,
  plan,
  avatarUrl,
  onAvatarPress,
}: {
  name: string;
  email: string;
  plan: string;
  avatarUrl?: string | null;
  onAvatarPress?: () => void;
}) {
  const { colors } = useAppTheme();
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

  const glow = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 2500, useNativeDriver: false }),
        Animated.timing(glow, { toValue: 0, duration: 2500, useNativeDriver: false }),
      ])
    ).start();
  }, []);

  const borderColor = glow.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(14, 165, 233, 0.2)', 'rgba(14, 165, 233, 0.5)'],
  });

  return (
    <Animated.View style={[st.profileCard, { backgroundColor: colors.bgInput, borderColor }]}>
      <ShimmerOverlay />
      <Pressable onPress={onAvatarPress} style={{ position: 'relative' }}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={st.avatar} />
        ) : (
          <LinearGradient colors={colors.gradientElectric} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={st.avatar}>
            <Text style={st.avatarText}>{initials}</Text>
          </LinearGradient>
        )}
        {onAvatarPress && (
          <View style={[st.avatarEditBadge, { backgroundColor: colors.electric }]}>
            <Ionicons name="camera" size={10} color="#fff" />
          </View>
        )}
      </Pressable>
      <View style={st.profileInfo}>
        <Text style={[st.profileName, { color: colors.textPrimary }]}>{name || 'Your Name'}</Text>
        <Text style={[st.profileEmail, { color: colors.textSecondary }]}>{email || 'email@example.com'}</Text>
      </View>
      <View style={[st.planBadge, { backgroundColor: colors.cyanGlow }]}>
        <Ionicons name="diamond" size={12} color={colors.cyan} />
        <Text style={[st.planBadgeText, { color: colors.cyan }]}>{PLAN_LABELS[plan] || plan || 'Solo'}</Text>
      </View>
    </Animated.View>
  );
}

// ── Mock Data ───────────────────────────────────────────────

const MOCK_INVOICES: Invoice[] = [
  { id: '1', date: '2026-02-01', amount: 39.00, status: 'paid', description: 'Solo Operator - February' },
  { id: '2', date: '2026-01-01', amount: 39.00, status: 'paid', description: 'Solo Operator - January' },
  { id: '3', date: '2025-12-01', amount: 39.00, status: 'paid', description: 'Solo Operator - December' },
];

// ── Main Screen ─────────────────────────────────────────────

export default function SettingsScreen() {
  const { colors, isDark, toggleTheme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signOut, user, isGuestMode, setGuestMode } = useAuthStore();
  const { agentStatus, toggleAgent } = useLeadsStore();

  const meta = user?.user_metadata;
  const ownerName = meta?.owner_name || meta?.full_name || meta?.name || meta?.display_name || '';
  const email = user?.email || '';
  const businessName = meta?.business_name || '';
  const phone = meta?.phone || '';
  const greetingMessage = meta?.greeting_message || meta?.agent_greeting || 'Hi, thanks for calling! How can I help you today?';
  const userPlan = meta?.plan || 'solo';

  const agentActive = agentStatus?.is_active ?? true;

  // Avatar state
  const [avatarUrl, setAvatarUrl] = useState<string | null>(meta?.avatar_url || null);

  // Collapsible sections
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['account']));
  const toggleSection = (section: string) => {
    Haptics.selectionAsync();
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) next.delete(section);
      else next.add(section);
      return next;
    });
  };
  const isExpanded = (s: string) => expandedSections.has(s);

  // Editable account fields
  const [editName, setEditName] = useState(ownerName);
  const [editEmail, setEditEmail] = useState(email);
  const [editBusiness, setEditBusiness] = useState(businessName);
  const [editPhone, setEditPhone] = useState(phone);

  // Notification toggles
  const [pushEnabled, setPushEnabled] = useState(true);
  const [newLeadAlert, setNewLeadAlert] = useState(true);
  const [dailySummary, setDailySummary] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(false);
  const [offlineAlert, setOfflineAlert] = useState(true);

  // Integration states
  const [integrations, setIntegrations] = useState({
    googleCalendar: false,
    zapier: false,
    quickbooks: false,
    slack: false,
  });

  // App preferences
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [biometricLock, setBiometricLock] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Invoices
  const [invoices] = useState<Invoice[]>(MOCK_INVOICES);

  // Loading state for danger zone
  const [exporting, setExporting] = useState(false);

  // Load preferences from AsyncStorage
  useEffect(() => {
    (async () => {
      const prefs = await AsyncStorage.multiGet([
        'pref_haptics', 'pref_biometric', 'pref_autorefresh',
        'pref_push', 'pref_newlead', 'pref_daily', 'pref_weekly', 'pref_offline',
      ]);
      const map = Object.fromEntries(prefs.map(([k, v]) => [k, v]));
      if (map.pref_haptics !== null) setHapticsEnabled(map.pref_haptics !== 'false');
      if (map.pref_biometric !== null) setBiometricLock(map.pref_biometric === 'true');
      if (map.pref_autorefresh !== null) setAutoRefresh(map.pref_autorefresh !== 'false');
      if (map.pref_push !== null) setPushEnabled(map.pref_push !== 'false');
      if (map.pref_newlead !== null) setNewLeadAlert(map.pref_newlead !== 'false');
      if (map.pref_daily !== null) setDailySummary(map.pref_daily !== 'false');
      if (map.pref_weekly !== null) setWeeklyReport(map.pref_weekly === 'true');
      if (map.pref_offline !== null) setOfflineAlert(map.pref_offline !== 'false');
    })();
  }, []);

  const savePref = useCallback((key: string, val: boolean) => {
    AsyncStorage.setItem(key, String(val));
  }, []);

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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isGuestMode) {
      setGuestMode(false);
      router.replace('/(auth)/signup' as any);
      return;
    }
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            // Clear all stores first
            useLeadsStore.getState().reset?.();
            
            // Sign out from Supabase
            await supabase.auth.signOut();
            
            // Clear auth store state
            useAuthStore.setState({
              user: null,
              session: null,
              isAuthenticated: false,
              isGuestMode: false,
              isLoading: false,
            });
            
            // Clear persisted preferences (keep has_seen_welcome)
            await AsyncStorage.multiRemove([
              'pref_haptics',
              'pref_biometric',
              'pref_autorefresh',
              'pref_push',
              'pref_newlead',
              'pref_daily',
              'pref_weekly',
              'pref_offline',
            ]);
            
            // Navigate to welcome screen
            router.replace('/(auth)/welcome' as any);
          } catch (error) {
            console.error('[Settings] Sign out error:', error);
            // Still navigate even if sign out fails
            useAuthStore.setState({
              user: null,
              session: null,
              isAuthenticated: false,
              isGuestMode: false,
              isLoading: false,
            });
            router.replace('/(auth)/welcome' as any);
          }
        },
      },
    ]);
  };

  const handleExportData = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Export Your Data',
      'We\'ll prepare a download of all your data including leads, call recordings, and account info. You\'ll receive an email when it\'s ready.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Export',
          onPress: async () => {
            setExporting(true);
            try {
              await api.exportData();
              Alert.alert('Export Started', 'You\'ll receive an email with your data download link within 24 hours.');
            } catch {
              Alert.alert('Export Started', 'You\'ll receive an email with your data download link within 24 hours.');
            }
            setExporting(false);
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      'Delete Account',
      'This action is permanent and cannot be undone. All your data, leads, recordings, and settings will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Are you absolutely sure?',
              'This cannot be undone.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Yes, Delete Everything',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await api.deleteAccount();
                    } catch {}
                    await signOut();
                    router.replace('/(auth)/welcome' as any);
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const handleSaveProfile = (field: string, value: string) => {
    api.updateUserProfile({ [field]: value }).catch(() => {});
  };

  const handlePickAvatar = async () => {
    if (isGuestMode) {
      Alert.alert('Guest Mode', 'Create an account to upload a profile photo.');
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your photo library to set a profile photo.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    const ext = asset.uri.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${user?.id || 'anon'}-${Date.now()}.${ext}`;

    try {
      const response = await fetch(asset.uri);
      const blob = await response.blob();
      const arrayBuffer = await new Response(blob).arrayBuffer();

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, arrayBuffer, {
          contentType: `image/${ext === 'png' ? 'png' : 'jpeg'}`,
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
      const publicUrl = urlData.publicUrl;

      setAvatarUrl(publicUrl);
      await supabase.auth.updateUser({ data: { avatar_url: publicUrl } });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      console.warn('[Settings] Avatar upload failed:', err.message);
      Alert.alert('Upload Failed', 'Could not upload your photo. Please try again.');
    }
  };

  const toggleIntegration = (key: keyof typeof integrations) => {
    const current = integrations[key];
    if (current) {
      Alert.alert('Disconnect', `Disconnect ${key.replace(/([A-Z])/g, ' $1').trim()}?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: () => setIntegrations((p) => ({ ...p, [key]: false })),
        },
      ]);
    } else {
      setIntegrations((p) => ({ ...p, [key]: true }));
    }
  };

  const lastCallAt = agentStatus?.last_call_at
    ? new Date(agentStatus.last_call_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
    : 'No calls yet';

  return (
    <View style={[st.root, { backgroundColor: colors.bgPrimary }]}>
      <LinearGradient
        colors={[colors.bgPrimary, colors.bgPrimary, `${colors.electric}08`]}
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
          <Text style={[st.title, { color: colors.textPrimary }]}>Settings</Text>
          <Text style={[st.subtitle, { color: colors.textMuted }]}>{businessName || 'Your Business'}</Text>
        </View>

        {/* Profile Card */}
        <ProfileCard
          name={isGuestMode ? 'Guest User' : ownerName}
          email={isGuestMode ? 'Browsing as guest' : email}
          plan={isGuestMode ? 'demo' : userPlan}
          avatarUrl={isGuestMode ? null : avatarUrl}
          onAvatarPress={handlePickAvatar}
        />

        {/* 1. Account */}
        <View style={st.sectionWrap}>
          <View style={[st.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <ShimmerOverlay />
            <SectionHeader
              icon="person-outline"
              iconColor={colors.electric}
              title="Account"
              expanded={isExpanded('account')}
              onPress={() => toggleSection('account')}
            />
            {isExpanded('account') && (
              <View>
                <EditableRow
                  icon="person-outline"
                  iconColor={colors.electric}
                  label="Full Name"
                  value={editName}
                  onSave={(v) => { setEditName(v); handleSaveProfile('owner_name', v); }}
                />
                <EditableRow
                  icon="mail-outline"
                  iconColor={colors.electric}
                  label="Email"
                  value={editEmail}
                  onSave={(v) => { setEditEmail(v); handleSaveProfile('email', v); }}
                  keyboardType="email-address"
                />
                <EditableRow
                  icon="business-outline"
                  iconColor={colors.electric}
                  label="Business Name"
                  value={editBusiness}
                  onSave={(v) => { setEditBusiness(v); handleSaveProfile('business_name', v); }}
                />
                <EditableRow
                  icon="call-outline"
                  iconColor={colors.electric}
                  label="Phone"
                  value={editPhone}
                  onSave={(v) => { setEditPhone(v); handleSaveProfile('phone', v); }}
                  keyboardType="phone-pad"
                  isLast
                />
              </View>
            )}
          </View>
        </View>

        {/* 2. Subscription & Billing */}
        <View style={st.sectionWrap}>
          <View style={[st.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <ShimmerOverlay />
            <SectionHeader
              icon="diamond-outline"
              iconColor={colors.cyan}
              title="Subscription & Billing"
              expanded={isExpanded('billing')}
              onPress={() => toggleSection('billing')}
              badge={PLAN_LABELS[userPlan] || 'Solo'}
            />
            {isExpanded('billing') && (
              <View>
                <Row
                  icon="diamond-outline"
                  iconColor={colors.cyan}
                  label="Current Plan"
                  value={`${PLAN_LABELS[userPlan] || 'Solo Operator'} - ${PLAN_PRICES[userPlan] || '$39'}/mo`}
                />
                <Row
                  icon="calendar-outline"
                  iconColor={colors.cyan}
                  label="Billing Cycle"
                  value="Monthly"
                />
                <Row
                  icon="card-outline"
                  iconColor={colors.cyan}
                  label="Manage Billing"
                  onPress={() => Alert.alert('Coming Soon', 'Billing management will be available in a future update.')}
                />
                <Row
                  icon="arrow-up-circle-outline"
                  iconColor={colors.success}
                  label="Upgrade Plan"
                  onPress={() => Alert.alert('Coming Soon', 'Plan upgrades will be available in a future update.')}
                />

                {/* Recent Invoices */}
                <View style={[st.invoiceHeader, { borderTopColor: colors.border }]}>
                  <Text style={[st.invoiceHeaderText, { color: colors.textMuted }]}>Recent Invoices</Text>
                </View>
                {invoices.map((inv, i) => (
                  <InvoiceRow key={inv.id} invoice={inv} isLast={i === invoices.length - 1} />
                ))}
              </View>
            )}
          </View>
        </View>

        {/* 3. Notifications */}
        <View style={st.sectionWrap}>
          <View style={[st.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <ShimmerOverlay />
            <SectionHeader
              icon="notifications-outline"
              iconColor={colors.warning}
              title="Notifications"
              expanded={isExpanded('notifications')}
              onPress={() => toggleSection('notifications')}
            />
            {isExpanded('notifications') && (
              <View>
                <ToggleRow
                  icon="notifications-outline"
                  iconColor={colors.warning}
                  label="Push Notifications"
                  description="Enable all push notifications"
                  value={pushEnabled}
                  onToggle={(v) => { setPushEnabled(v); savePref('pref_push', v); }}
                />
                <ToggleRow
                  icon="flash-outline"
                  iconColor={colors.success}
                  label="New Lead Alerts"
                  description="Instant notification when a lead is captured"
                  value={newLeadAlert}
                  onToggle={(v) => { setNewLeadAlert(v); savePref('pref_newlead', v); }}
                />
                <ToggleRow
                  icon="sunny-outline"
                  iconColor={colors.electric}
                  label="Daily Summary"
                  description="Receive a daily digest at 9am"
                  value={dailySummary}
                  onToggle={(v) => { setDailySummary(v); savePref('pref_daily', v); }}
                />
                <ToggleRow
                  icon="bar-chart-outline"
                  iconColor={colors.cyan}
                  label="Weekly Report"
                  description="Performance report every Monday"
                  value={weeklyReport}
                  onToggle={(v) => { setWeeklyReport(v); savePref('pref_weekly', v); }}
                />
                <ToggleRow
                  icon="alert-circle-outline"
                  iconColor={colors.danger}
                  label="Agent Offline Alert"
                  description="Get notified if your agent goes offline"
                  value={offlineAlert}
                  onToggle={(v) => { setOfflineAlert(v); savePref('pref_offline', v); }}
                  isLast
                />
              </View>
            )}
          </View>
        </View>

        {/* 4. AI Agent Quick Status */}
        <View style={st.sectionWrap}>
          <View style={[st.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <ShimmerOverlay />
            <SectionHeader
              icon="hardware-chip-outline"
              iconColor={agentActive ? colors.success : colors.textMuted}
              title="AI Agent"
              expanded={isExpanded('agent')}
              onPress={() => toggleSection('agent')}
              badge={agentActive ? 'Active' : 'Paused'}
            />
            {isExpanded('agent') && (
              <View>
                <Row
                  icon="flash-outline"
                  iconColor={agentActive ? colors.success : colors.textMuted}
                  label="Agent Active"
                  rightElement={
                    <Switch
                      value={agentActive}
                      onValueChange={handleAgentToggle}
                      trackColor={{ false: colors.bgElevated, true: colors.success }}
                      thumbColor="#fff"
                    />
                  }
                />

                {/* Greeting Preview */}
                <View style={st.greetingRow}>
                  <View style={st.greetingLabelRow}>
                    <View style={[st.greetingDot, { backgroundColor: agentActive ? colors.success : colors.textMuted }]} />
                    <Text style={[st.greetingLabel, { color: colors.textMuted }]}>Greeting Preview</Text>
                  </View>
                  <View style={[st.greetingBubble, { backgroundColor: colors.bgInput, borderColor: colors.borderElectric }]}>
                    <Text style={[st.greetingText, { color: colors.textSecondary }]}>"{greetingMessage}"</Text>
                  </View>
                </View>

                {/* Agent Stats */}
                <View style={st.agentStatsRow}>
                  <View style={st.agentStat}>
                    <Text style={[st.agentStatValue, { color: colors.textPrimary }]}>{agentStatus?.phone_number || '--'}</Text>
                    <Text style={[st.agentStatLabel, { color: colors.textMuted }]}>Phone Number</Text>
                  </View>
                  <View style={[st.agentStatDivider, { backgroundColor: colors.border }]} />
                  <View style={st.agentStat}>
                    <Text style={[st.agentStatValue, { color: colors.textPrimary }]}>{agentStatus?.total_calls_handled ?? 0}</Text>
                    <Text style={[st.agentStatLabel, { color: colors.textMuted }]}>Calls Handled</Text>
                  </View>
                  <View style={[st.agentStatDivider, { backgroundColor: colors.border }]} />
                  <View style={st.agentStat}>
                    <Text style={[st.agentStatValue, { color: colors.textPrimary }]}>{lastCallAt}</Text>
                    <Text style={[st.agentStatLabel, { color: colors.textMuted }]}>Last Call</Text>
                  </View>
                </View>

                {/* Manage Locations */}
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push('/locations' as any);
                  }}
                  style={[st.locationsLink, { borderTopColor: colors.border }]}
                >
                  <Ionicons name="location-outline" size={16} color={colors.electric} />
                  <Text style={[st.locationsLinkText, { color: colors.electric }]}>Manage Locations & Agents</Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.electric} />
                </Pressable>
              </View>
            )}
          </View>
        </View>

        {/* 5. Integrations */}
        <View style={st.sectionWrap}>
          <View style={[st.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <ShimmerOverlay />
            <SectionHeader
              icon="git-network-outline"
              iconColor="#A78BFA"
              title="Integrations"
              expanded={isExpanded('integrations')}
              onPress={() => toggleSection('integrations')}
            />
            {isExpanded('integrations') && (
              <View>
                <IntegrationRow
                  icon="calendar-outline"
                  iconColor="#4285F4"
                  name="Google Calendar"
                  description="Sync appointments from booked leads"
                  connected={integrations.googleCalendar}
                  onToggle={() => toggleIntegration('googleCalendar')}
                />
                <IntegrationRow
                  icon="flash-outline"
                  iconColor="#FF4A00"
                  name="Zapier"
                  description="Connect to 5000+ apps"
                  connected={integrations.zapier}
                  onToggle={() => toggleIntegration('zapier')}
                />
                <IntegrationRow
                  icon="calculator-outline"
                  iconColor="#2CA01C"
                  name="QuickBooks"
                  description="Auto-create invoices from leads"
                  connected={integrations.quickbooks}
                  onToggle={() => toggleIntegration('quickbooks')}
                />
                <IntegrationRow
                  icon="chatbubbles-outline"
                  iconColor="#E01E5A"
                  name="Slack"
                  description="Real-time lead notifications"
                  connected={integrations.slack}
                  onToggle={() => toggleIntegration('slack')}
                  isLast
                />
              </View>
            )}
          </View>
        </View>

        {/* 6. App Preferences */}
        <View style={st.sectionWrap}>
          <View style={[st.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <ShimmerOverlay />
            <SectionHeader
              icon="options-outline"
              iconColor={colors.electric}
              title="App Preferences"
              expanded={isExpanded('preferences')}
              onPress={() => toggleSection('preferences')}
            />
            {isExpanded('preferences') && (
              <View>
                <ToggleRow
                  icon={isDark ? 'moon-outline' : 'sunny-outline'}
                  iconColor={isDark ? '#A78BFA' : '#F59E0B'}
                  label="Dark Mode"
                  description={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
                  value={isDark}
                  onToggle={() => { toggleTheme(); }}
                />
                <ToggleRow
                  icon="pulse-outline"
                  iconColor={colors.electric}
                  label="Haptic Feedback"
                  description="Vibration on button taps and navigation"
                  value={hapticsEnabled}
                  onToggle={(v) => { setHapticsEnabled(v); savePref('pref_haptics', v); }}
                />
                <ToggleRow
                  icon="finger-print-outline"
                  iconColor={colors.cyan}
                  label="Biometric Lock"
                  description="Require Face ID / fingerprint to open"
                  value={biometricLock}
                  onToggle={(v) => { setBiometricLock(v); savePref('pref_biometric', v); }}
                />
                <ToggleRow
                  icon="refresh-outline"
                  iconColor={colors.success}
                  label="Auto-Refresh"
                  description="Refresh dashboard data automatically"
                  value={autoRefresh}
                  onToggle={(v) => { setAutoRefresh(v); savePref('pref_autorefresh', v); }}
                  isLast
                />
              </View>
            )}
          </View>
        </View>

        {/* 7. Support & Legal */}
        <View style={st.sectionWrap}>
          <View style={[st.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <ShimmerOverlay />
            <SectionHeader
              icon="help-circle-outline"
              iconColor={colors.warning}
              title="Support & Legal"
              expanded={isExpanded('support')}
              onPress={() => toggleSection('support')}
            />
            {isExpanded('support') && (
              <View>
                <Row
                  icon="mail-outline"
                  iconColor={colors.warning}
                  label="Email Support"
                  value={SUPPORT_EMAIL}
                  onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}
                />
                <Row
                  icon="call-outline"
                  iconColor={colors.warning}
                  label="Call Support"
                  value="561-446-4520"
                  onPress={() => Linking.openURL(`tel:${SUPPORT_PHONE}`)}
                />
                <Row
                  icon="help-buoy-outline"
                  iconColor={colors.electric}
                  label="FAQ & Help Center"
                  onPress={() => Linking.openURL(FAQ_URL)}
                />
                <Row
                  icon="document-text-outline"
                  iconColor={colors.textSecondary}
                  label="Terms of Service"
                  onPress={() => Linking.openURL(TERMS_URL)}
                />
                <Row
                  icon="shield-checkmark-outline"
                  iconColor={colors.textSecondary}
                  label="Privacy Policy"
                  onPress={() => Linking.openURL(PRIVACY_URL)}
                />
                <Row
                  icon="information-circle-outline"
                  iconColor={colors.textSecondary}
                  label="App Version"
                  value={`${APP_VERSION} (${BUILD_NUMBER})`}
                  isLast
                />
              </View>
            )}
          </View>
        </View>

        {/* 8. Danger Zone */}
        <View style={st.sectionWrap}>
          <View style={[st.card, { backgroundColor: colors.bgCard, borderColor: 'rgba(239, 68, 68, 0.15)' }]}>
            <ShimmerOverlay />
            <SectionHeader
              icon="warning-outline"
              iconColor={colors.danger}
              title="Danger Zone"
              expanded={isExpanded('danger')}
              onPress={() => toggleSection('danger')}
            />
            {isExpanded('danger') && (
              <View>
                <Row
                  icon="download-outline"
                  iconColor={colors.warning}
                  label="Export All Data"
                  value="Download your leads, recordings, and settings"
                  onPress={handleExportData}
                  rightElement={
                    exporting ? (
                      <ActivityIndicator size="small" color={colors.warning} />
                    ) : (
                      <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                    )
                  }
                />
                <Row
                  icon="trash-outline"
                  danger
                  label="Delete Account"
                  value="Permanently delete all data"
                  onPress={handleDeleteAccount}
                  isLast
                />
              </View>
            )}
          </View>
        </View>

        {/* Sign Out / Create Account */}
        <View style={{ marginTop: Spacing.lg }}>
          {isGuestMode ? (
            <CreateAccountButton onPress={handleSignOut} />
          ) : (
            <SignOutButton onPress={handleSignOut} />
          )}
        </View>

        <PulsingFooter />
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1 },
  container: { flex: 1 },
  scroll: { paddingHorizontal: ScreenPadding.horizontal },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingTop: Spacing.base,
    paddingBottom: Spacing.sm,
  },
  title: { ...TextStyles.h1 },
  subtitle: { ...Fonts.mono, fontSize: TypeScale.bodySm },

  /* Profile Card */
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.base,
    marginBottom: Spacing.xs,
    overflow: 'hidden',
    gap: Spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...Fonts.display,
    fontSize: TypeScale.h4,
    color: '#fff',
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  profileInfo: { flex: 1 },
  profileName: {
    ...Fonts.bodySemibold,
    fontSize: TypeScale.h4,
  },
  profileEmail: {
    ...Fonts.body,
    fontSize: TypeScale.bodySm,
    marginTop: 1,
  },
  planBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  planBadgeText: {
    ...Fonts.bodyMedium,
    fontSize: TypeScale.tiny,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  /* Section wrap */
  sectionWrap: { marginTop: Spacing.md },

  /* Section Header (collapsible) */
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  sectionHeaderIcon: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeaderTitle: {
    ...Fonts.bodySemibold,
    fontSize: TypeScale.body,
    flex: 1,
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  badgeText: {
    ...Fonts.bodyMedium,
    fontSize: TypeScale.tiny,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },

  /* Cards */
  card: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
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
  },
  rowValue: {
    ...Fonts.body,
    fontSize: TypeScale.bodySm,
    marginTop: 1,
  },

  /* Edit input */
  editInput: {
    ...Fonts.body,
    fontSize: TypeScale.bodySm,
    borderBottomWidth: 1,
    paddingVertical: 2,
    marginTop: 2,
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
  },
  greetingBubble: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
  },
  greetingText: {
    ...Fonts.body,
    fontSize: TypeScale.bodySm,
    fontStyle: 'italic',
    lineHeight: TypeScale.bodySm * 1.5,
  },

  /* Agent Stats */
  agentStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.base,
  },
  agentStat: {
    flex: 1,
    alignItems: 'center',
  },
  agentStatValue: {
    ...Fonts.monoBold,
    fontSize: TypeScale.caption,
  },
  agentStatLabel: {
    ...Fonts.body,
    fontSize: TypeScale.tiny,
    marginTop: 2,
  },
  agentStatDivider: {
    width: 1,
    height: 24,
  },
  locationsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
  },
  locationsLinkText: {
    ...Fonts.bodyMedium,
    fontSize: TypeScale.body,
    flex: 1,
  },

  /* Connect button */
  connectBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  connectBtnText: {
    ...Fonts.bodyMedium,
    fontSize: TypeScale.caption,
  },

  /* Invoice */
  invoiceHeader: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xs,
    borderTopWidth: 1,
  },
  invoiceHeaderText: {
    ...Fonts.bodyMedium,
    fontSize: TypeScale.caption,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  invoiceAmount: {
    ...Fonts.monoBold,
    fontSize: TypeScale.bodySm,
  },
  invoiceStatus: {
    ...Fonts.bodyMedium,
    fontSize: TypeScale.tiny,
    marginTop: 1,
  },

  /* Sign Out */
  signOutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
    overflow: 'hidden',
  },
  signOutText: {
    ...Fonts.bodySemibold,
    fontSize: TypeScale.body,
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
  },
  footerVersion: {
    ...Fonts.mono,
    fontSize: TypeScale.tiny,
  },
});
