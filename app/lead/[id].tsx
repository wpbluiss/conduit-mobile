import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Linking,
  Alert,
  ActivityIndicator,
  Animated,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLeadsStore } from '../../store/leadsStore';
import { Badge } from '../../components/ui/Badge';
import { Colors, StatusColors } from '../../constants/colors';
import { useAppTheme } from '../../contexts/ThemeContext';
import { Fonts, TypeScale, TextStyles } from '../../constants/typography';
import { Spacing, BorderRadius, ScreenPadding } from '../../constants/layout';
import { api, getLeadDetailFromSupabase } from '../../lib/api';
import type { LeadDetail, Lead } from '../../lib/api';

const { width: SCREEN_W } = Dimensions.get('window');

// ── Helpers ───────────────────────────────────────────────────

function formatDate(d: string) {
  const date = new Date(d);
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTime(d: string) {
  return new Date(d).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function getTimeAgo(d: string) {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

type LeadStatus = Lead['status'];
type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const STATUS_OPTIONS: { key: LeadStatus; label: string; icon: IoniconsName; color: string }[] = [
  { key: 'new', label: 'New', icon: 'sparkles', color: Colors.electric },
  { key: 'contacted', label: 'Contacted', icon: 'chatbubble-ellipses', color: Colors.warning },
  { key: 'booked', label: 'Booked', icon: 'checkmark-circle', color: Colors.success },
  { key: 'lost', label: 'Lost', icon: 'close-circle', color: Colors.danger },
];

// ── Mock detail data ──────────────────────────────────────────

const MOCK_DETAILS: Record<string, Partial<LeadDetail>> = {
  '1': {
    caller_email: 'marcus.j@gmail.com',
    transcript: 'Agent: Hi, thanks for calling! How can I help you today?\nCaller: Hey, I wanted to book a fade haircut. Do you have anything open Saturday morning?\nAgent: Absolutely! We have openings at 9 AM and 10:30 AM this Saturday. Which works better for you?\nCaller: 9 AM is perfect. The name is Marcus Johnson.\nAgent: Great, Marcus! You\'re booked for a fade at 9 AM Saturday. We\'ll see you then!',
    notes: 'Prefers a skin fade. Regular client, comes in every 3 weeks.',
  },
  '2': {
    caller_email: 'diana.reyes@yahoo.com',
    transcript: 'Agent: Hi, thanks for calling! How can I help you today?\nCaller: My kitchen sink is leaking really badly. I need someone out here as soon as possible.\nAgent: I\'m sorry to hear that! Can you describe the leak? Is it under the sink or at the faucet?\nCaller: Under the sink. There\'s water pooling on the floor.\nAgent: Got it. We can have a plumber out today between 2-4 PM. Would that work?\nCaller: Yes please, that would be great. It\'s Diana Reyes.',
    notes: 'Emergency call. Pipe joint appears to be the issue based on description.',
  },
  '3': {
    transcript: 'Agent: Hi, thanks for calling! How can I help you today?\nCaller: Yeah, I want to come in for a beard trim and lineup. Do you take walk-ins?\nAgent: We sure do! We have a chair open right now if you want to head over.\nCaller: Perfect, I\'ll be there in 20 minutes. Name is Terrence.\nAgent: Sounds good, Terrence! We\'ll be ready for you.',
    notes: 'Walk-in. Left voicemail to confirm he\'s on his way.',
  },
  '4': {
    caller_email: 'laura.chen88@gmail.com',
    transcript: 'Agent: Hi, thanks for calling! How can I help you today?\nCaller: I\'m looking to get a quote for a bathroom remodel. It\'s a 2-bedroom condo.\nAgent: We\'d love to help! Can you tell me a bit about what you\'re looking to do?\nCaller: Full gut renovation. New tile, vanity, shower, the works.\nAgent: Understood. We\'ll need to schedule an on-site visit for an accurate quote. How does Thursday at 10 AM sound?\nCaller: Thursday works. It\'s Laura Chen.\nAgent: Perfect, Laura! We\'ll see you Thursday at 10.',
    notes: 'High-value lead. Full bathroom gut reno in Palm Beach condo. Estimate range $15-25k.',
    recording_url: 'https://storage.conduitai.io/recordings/mock-004.mp3',
  },
  '5': {
    transcript: 'Agent: Hi, thanks for calling! How can I help you today?\nCaller: I need a hot towel shave. It\'s for my wedding this weekend.\nAgent: Congratulations! We can definitely get you looking sharp. When would you like to come in?\nCaller: Friday afternoon if possible.\nAgent: We have 3 PM open on Friday. Sound good?\nCaller: That\'s great. Andre Thompson.\nAgent: You\'re booked, Andre! Congrats again on the wedding!',
    notes: 'Wedding grooming. Booked for Friday 3 PM. May want to upsell facial treatment.',
  },
};

// ── Shimmer ──────────────────────────────────────────────────

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

// ── Gradient Action Button ───────────────────────────────────

function ActionButton({
  icon,
  label,
  colors,
  onPress,
}: {
  icon: IoniconsName;
  label: string;
  colors: readonly [string, string];
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Pressable
      onPressIn={() => Animated.spring(scale, { toValue: 0.9, useNativeDriver: true, friction: 8 }).start()}
      onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 8 }).start()}
      onPress={onPress}
      style={st.actionBtn}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <LinearGradient
          colors={colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={st.actionCircle}
        >
          <Ionicons name={icon} size={22} color="#fff" />
        </LinearGradient>
      </Animated.View>
      <Text style={st.actionLabel}>{label}</Text>
    </Pressable>
  );
}

// ── Animated Status Button ───────────────────────────────────

function StatusButton({
  opt,
  active,
  onPress,
}: {
  opt: (typeof STATUS_OPTIONS)[number];
  active: boolean;
  onPress: () => void;
}) {
  const borderAnim = useRef(new Animated.Value(active ? 1 : 0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(borderAnim, { toValue: active ? 1 : 0, duration: 300, useNativeDriver: false }).start();
  }, [active]);

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [Colors.border as string, opt.color],
  });
  const bgColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['transparent', `${opt.color}15`],
  });

  return (
    <Pressable
      onPressIn={() => Animated.spring(scale, { toValue: 0.95, useNativeDriver: true, friction: 8 }).start()}
      onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 8 }).start()}
      onPress={onPress}
    >
      <Animated.View
        style={[
          st.statusBtn,
          { borderColor, backgroundColor: bgColor, transform: [{ scale }] },
        ]}
      >
        <Ionicons name={opt.icon} size={18} color={active ? opt.color : Colors.textMuted} />
        <Text style={[st.statusBtnText, active && { color: opt.color }]}>{opt.label}</Text>
        {active && (
          <View style={[st.activeCheck, { backgroundColor: opt.color }]}>
            <Ionicons name="checkmark" size={10} color="#fff" />
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
}

// ── Animated Chat Bubble ─────────────────────────────────────

function ChatBubble({
  line,
  index,
}: {
  line: string;
  index: number;
}) {
  const fadeIn = useRef(new Animated.Value(0)).current;
  const isAgent = line.startsWith('Agent:');
  const isCaller = line.startsWith('Caller:');
  const content = line.replace(/^(Agent|Caller):\s*/, '');

  useEffect(() => {
    Animated.timing(fadeIn, { toValue: 1, duration: 400, delay: index * 80, useNativeDriver: true }).start();
  }, []);

  return (
    <Animated.View
      style={[
        st.msgRow,
        isAgent && st.msgRowAgent,
        {
          opacity: fadeIn,
          transform: [{ translateY: fadeIn.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
        },
      ]}
    >
      <View style={[st.msgBubble, isAgent ? st.msgBubbleAgent : st.msgBubbleCaller]}>
        <Text style={[st.msgSender, { color: isAgent ? Colors.electric : Colors.warning }]}>
          {isAgent ? 'AI Agent' : isCaller ? 'Caller' : ''}
        </Text>
        <Text style={st.msgText}>{content}</Text>
      </View>
    </Animated.View>
  );
}

// ── Audio Player ─────────────────────────────────────────────

function AudioPlayer({ recordingUrl }: { recordingUrl: string }) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePlay = () => {
    Linking.openURL(recordingUrl);
  };

  return (
    <Pressable
      onPressIn={() => Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, friction: 8 }).start()}
      onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 8 }).start()}
      onPress={handlePlay}
    >
      <Animated.View style={[st.recordingCard, { transform: [{ scale }] }]}>
        <ShimmerOverlay />
        <View style={st.recordingLeft}>
          <LinearGradient
            colors={Colors.gradientElectric}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={st.recordingIcon}
          >
            <Ionicons name="play" size={22} color="#fff" style={{ marginLeft: 2 }} />
          </LinearGradient>
          <View>
            <Text style={st.recordingTitle}>Call Recording</Text>
            <Text style={st.recordingSub}>Tap to listen</Text>
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
}

// ── Section Label ────────────────────────────────────────────

function SectionLabel({ children }: { children: string }) {
  return (
    <View style={st.sectionLabelRow}>
      <View style={st.sectionDot} />
      <Text style={st.sectionLabel}>{children}</Text>
    </View>
  );
}

// ── Info Row ─────────────────────────────────────────────────

function InfoRow({ icon, label, value, isLast }: { icon: IoniconsName; label: string; value: string; isLast?: boolean }) {
  return (
    <View style={[st.infoRow, !isLast && st.infoRowBorder]}>
      <Ionicons name={icon} size={16} color={Colors.textMuted} />
      <Text style={st.infoLabel}>{label}</Text>
      <Text style={st.infoValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

// ── Main Component ───────────────────────────────────────────

export default function LeadDetailScreen() {
  const { colors, isDark } = useAppTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { leads, updateLeadStatus } = useLeadsStore();

  const [detail, setDetail] = useState<LeadDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentStatus, setCurrentStatus] = useState<LeadStatus>('new');

  const storeLead = leads.find((l) => l.id === id);

  // Header fade-in
  const headerFade = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(headerFade, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, [loading]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      // Try Supabase first
      try {
        const supabaseDetail = await getLeadDetailFromSupabase(id!);
        if (mounted && supabaseDetail) {
          setDetail(supabaseDetail);
          setCurrentStatus(supabaseDetail.status);
          setLoading(false);
          return;
        }
      } catch (err) {
        console.warn('[LeadDetail] Supabase fetch failed, trying API:', err);
      }
      // Fallback: try the FastAPI backend
      try {
        const data = await api.getLead(id!);
        if (mounted) {
          setDetail(data);
          setCurrentStatus(data.status);
        }
      } catch {
        // Final fallback: use store lead + mock details
        if (mounted && storeLead) {
          const mock = MOCK_DETAILS[id!] || {};
          setDetail({
            ...storeLead,
            transcript: mock.transcript || 'Transcript not available for this call.',
            recording_url: mock.recording_url,
            caller_email: mock.caller_email,
            notes: mock.notes,
          });
          setCurrentStatus(storeLead.status);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id]);

  const lead = detail || storeLead;

  const handleStatusChange = (status: LeadStatus) => {
    Alert.alert(
      'Update Status',
      `Mark this lead as "${status}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Update',
          onPress: () => {
            setCurrentStatus(status);
            updateLeadStatus(id!, status);
          },
        },
      ]
    );
  };

  const handleCall = () => {
    if (lead?.caller_phone) Linking.openURL(`tel:${lead.caller_phone.replace(/\D/g, '')}`);
  };

  const handleText = () => {
    if (lead?.caller_phone) Linking.openURL(`sms:${lead.caller_phone.replace(/\D/g, '')}`);
  };

  const handleEmail = () => {
    if (detail?.caller_email) Linking.openURL(`mailto:${detail.caller_email}`);
  };

  // ── Loading state ──

  if (loading || !lead) {
    return (
      <View style={[st.loadingWrap, { paddingTop: insets.top, backgroundColor: colors.bgPrimary }]}>
        <LinearGradient
          colors={[colors.bgPrimary, colors.bgPrimary, 'rgba(14, 165, 233, 0.03)']}
          locations={[0, 0.7, 1]}
          style={StyleSheet.absoluteFill}
        />
        <Pressable onPress={() => router.back()} style={st.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </Pressable>
        <View style={st.loadingCenter}>
          {loading ? (
            <ActivityIndicator size="large" color={Colors.electric} />
          ) : (
            <>
              <Ionicons name="alert-circle-outline" size={48} color={Colors.textMuted} />
              <Text style={st.loadingText}>Lead not found</Text>
            </>
          )}
        </View>
      </View>
    );
  }

  const transcriptLines = (detail?.transcript || '').split('\n').filter(Boolean);

  return (
    <View style={[st.screen, { backgroundColor: colors.bgPrimary }]}>
      <LinearGradient
        colors={[colors.bgPrimary, colors.bgPrimary, 'rgba(14, 165, 233, 0.03)']}
        locations={[0, 0.7, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={{ paddingTop: insets.top }}>
        {/* Header */}
        <View style={st.header}>
          <Pressable onPress={() => router.back()} style={st.backBtn} hitSlop={8}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </Pressable>
          <Text style={st.headerTitle}>Lead Details</Text>
          <View style={{ width: 40 }} />
        </View>
      </View>

      <ScrollView
        style={st.scrollView}
        contentContainerStyle={st.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card — Glassmorphism */}
        <Animated.View style={[st.profileCard, { opacity: headerFade, transform: [{ translateY: headerFade.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
          <ShimmerOverlay />
          <LinearGradient
            colors={Colors.gradientElectric}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={st.avatar}
          >
            <Text style={st.avatarText}>{lead.caller_name.charAt(0)}</Text>
          </LinearGradient>
          <Text style={st.profileName}>{lead.caller_name}</Text>
          <Badge status={currentStatus} size="md" />
          <Text style={st.profileTime}>
            {formatDate(lead.created_at)} at {formatTime(lead.created_at)} · {getTimeAgo(lead.created_at)}
          </Text>
        </Animated.View>

        {/* Gradient Action Buttons */}
        <View style={st.actionsRow}>
          <ActionButton
            icon="call"
            label="Call"
            colors={[Colors.success, '#059669'] as const}
            onPress={handleCall}
          />
          <ActionButton
            icon="chatbubble"
            label="Text"
            colors={Colors.gradientElectric}
            onPress={handleText}
          />
          {detail?.caller_email ? (
            <ActionButton
              icon="mail"
              label="Email"
              colors={[Colors.warning, '#D97706'] as const}
              onPress={handleEmail}
            />
          ) : null}
        </View>

        {/* Contact Info */}
        <SectionLabel>Contact Info</SectionLabel>
        <View style={st.card}>
          <ShimmerOverlay />
          <InfoRow icon="call-outline" label="Phone" value={lead.caller_phone} />
          {detail?.caller_email ? (
            <InfoRow icon="mail-outline" label="Email" value={detail.caller_email} />
          ) : null}
          <InfoRow icon="time-outline" label="Received" value={`${formatDate(lead.created_at)}, ${formatTime(lead.created_at)}`} isLast />
        </View>

        {/* Summary */}
        <SectionLabel>AI Summary</SectionLabel>
        <View style={st.card}>
          <ShimmerOverlay />
          <Text style={st.summaryText}>{lead.summary}</Text>
        </View>

        {/* Status Update */}
        <SectionLabel>Update Status</SectionLabel>
        <View style={st.statusGrid}>
          {STATUS_OPTIONS.map((opt) => (
            <StatusButton
              key={opt.key}
              opt={opt}
              active={currentStatus === opt.key}
              onPress={() => { if (currentStatus !== opt.key) handleStatusChange(opt.key); }}
            />
          ))}
        </View>

        {/* Transcript */}
        <SectionLabel>Call Transcript</SectionLabel>
        <View style={st.card}>
          <ShimmerOverlay />
          {transcriptLines.length > 0 ? (
            transcriptLines.map((line, i) => (
              <ChatBubble key={i} line={line} index={i} />
            ))
          ) : (
            <Text style={st.emptyText}>No transcript available</Text>
          )}
        </View>

        {/* Recording */}
        {detail?.recording_url ? (
          <>
            <SectionLabel>Recording</SectionLabel>
            <AudioPlayer recordingUrl={detail.recording_url} />
          </>
        ) : null}

        {/* Notes */}
        {detail?.notes ? (
          <>
            <SectionLabel>Notes</SectionLabel>
            <View style={st.card}>
              <ShimmerOverlay />
              <Text style={st.notesText}>{detail.notes}</Text>
            </View>
          </>
        ) : null}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────

const st = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bgPrimary },

  /* Shimmer */
  shimmer: { position: 'absolute', top: 0, bottom: 0, width: SCREEN_W * 0.6, zIndex: 1 },

  /* Loading */
  loadingWrap: { flex: 1, backgroundColor: Colors.bgPrimary, paddingHorizontal: ScreenPadding.horizontal },
  loadingCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  loadingText: { ...TextStyles.body, color: Colors.textMuted },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ScreenPadding.horizontal,
    paddingVertical: Spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { ...Fonts.bodySemibold, fontSize: TypeScale.h4, color: Colors.textPrimary },

  /* Scroll */
  scrollView: { flex: 1 },
  scroll: { paddingHorizontal: ScreenPadding.horizontal },

  /* Profile card */
  profileCard: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.base,
    gap: Spacing.sm,
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.borderElectric,
    overflow: 'hidden',
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  avatarText: { ...Fonts.displayBold, fontSize: TypeScale.h1, color: '#fff' },
  profileName: { ...TextStyles.h2, color: Colors.textPrimary },
  profileTime: { ...Fonts.mono, fontSize: TypeScale.caption, color: Colors.textMuted, marginTop: Spacing.xs },

  /* Actions */
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing['2xl'],
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  actionBtn: { alignItems: 'center', gap: Spacing.sm },
  actionCircle: {
    width: 56,
    height: 56,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: { ...Fonts.bodyMedium, fontSize: TypeScale.caption, color: Colors.textSecondary },

  /* Section label */
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

  /* Card */
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.base,
    overflow: 'hidden',
  },

  /* Info rows */
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  infoRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  infoLabel: { ...Fonts.bodyMedium, fontSize: TypeScale.bodySm, color: Colors.textMuted, width: 56 },
  infoValue: { ...Fonts.body, fontSize: TypeScale.body, color: Colors.textPrimary, flex: 1 },

  /* Summary */
  summaryText: { ...Fonts.body, fontSize: TypeScale.body, color: Colors.textSecondary, lineHeight: TypeScale.body * 1.5 },

  /* Status grid */
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  statusBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    flexGrow: 1,
    minWidth: '45%' as any,
  },
  statusBtnText: { ...Fonts.bodySemibold, fontSize: TypeScale.bodySm, color: Colors.textMuted },
  activeCheck: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 'auto',
  },

  /* Transcript messages */
  msgRow: { marginBottom: Spacing.sm },
  msgRowAgent: { alignItems: 'flex-start' },
  msgBubble: {
    maxWidth: '88%',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  msgBubbleAgent: { backgroundColor: Colors.bgElevated, alignSelf: 'flex-start', borderBottomLeftRadius: BorderRadius.sm },
  msgBubbleCaller: { backgroundColor: Colors.bgInput, alignSelf: 'flex-end', borderBottomRightRadius: BorderRadius.sm },
  msgSender: { ...Fonts.bodySemibold, fontSize: TypeScale.tiny, letterSpacing: 0.3, marginBottom: 4 },
  msgText: { ...Fonts.body, fontSize: TypeScale.bodySm, color: Colors.textSecondary, lineHeight: TypeScale.bodySm * 1.5 },
  emptyText: { ...Fonts.body, fontSize: TypeScale.bodySm, color: Colors.textMuted, fontStyle: 'italic' },

  /* Recording */
  recordingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.borderElectric,
    padding: Spacing.base,
    overflow: 'hidden',
  },
  recordingLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  recordingIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordingTitle: { ...Fonts.bodySemibold, fontSize: TypeScale.body, color: Colors.textPrimary },
  recordingSub: { ...Fonts.body, fontSize: TypeScale.caption, color: Colors.textMuted, marginTop: 1 },
  progressBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: Colors.bgElevated,
    borderBottomLeftRadius: BorderRadius.lg,
    borderBottomRightRadius: BorderRadius.lg,
  },
  progressFill: {
    height: 3,
    backgroundColor: Colors.electric,
    borderBottomLeftRadius: BorderRadius.lg,
  },

  /* Notes */
  notesText: { ...Fonts.body, fontSize: TypeScale.body, color: Colors.textSecondary, lineHeight: TypeScale.body * 1.5, fontStyle: 'italic' },
});
