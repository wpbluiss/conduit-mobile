import { useEffect, useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
  Animated,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLeadsStore } from '../../store/leadsStore';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../contexts/ThemeContext';
import { Badge } from '../../components/ui/Badge';
import { ShimmerSkeleton } from '../../components/ui/ShimmerSkeleton';
import { StatusColors } from '../../constants/colors';
import { Fonts, TypeScale, TextStyles } from '../../constants/typography';
import { Spacing, BorderRadius, ScreenPadding } from '../../constants/layout';

const { width: SCREEN_W } = Dimensions.get('window');

// ── Helpers ──────────────────────────────────────────────────

function getGreeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

function getTimeAgo(d: string) {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ── Animated Count-Up ────────────────────────────────────────

function useCountUp(target: number, duration = 1000) {
  const [display, setDisplay] = useState(0);
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    anim.setValue(0);
    const listener = anim.addListener(({ value }) => {
      setDisplay(Math.round(value));
    });
    Animated.timing(anim, {
      toValue: target,
      duration,
      useNativeDriver: false,
    }).start();
    return () => anim.removeListener(listener);
  }, [target]);

  return display;
}

// ── Waveform Bars ────────────────────────────────────────────

function WaveformBars({ active, successColor, mutedColor }: { active: boolean; successColor: string; mutedColor: string }) {
  const bars = useRef(
    Array.from({ length: 5 }, () => new Animated.Value(0))
  ).current;

  useEffect(() => {
    if (!active) {
      bars.forEach((b) => {
        Animated.timing(b, { toValue: 0, duration: 300, useNativeDriver: true }).start();
      });
      return;
    }
    const anims = bars.map((bar, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(bar, { toValue: 1, duration: 400 + i * 80, useNativeDriver: true }),
          Animated.timing(bar, { toValue: 0, duration: 400 + i * 80, useNativeDriver: true }),
        ])
      )
    );
    anims.forEach((a) => a.start());
    return () => anims.forEach((a) => a.stop());
  }, [active]);

  const heights = [0.4, 0.7, 1, 0.6, 0.8];
  return (
    <View style={st.waveWrap}>
      {bars.map((bar, i) => (
        <Animated.View
          key={i}
          style={[
            st.waveBar,
            {
              backgroundColor: active ? successColor : mutedColor,
              transform: [{
                scaleY: bar.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.3, heights[i]],
                }),
              }],
            },
          ]}
        />
      ))}
    </View>
  );
}

// ── Lead Card ──────────────────────────────────────────────

function LeadCard({ lead, onPress }: {
  lead: { id: string; caller_name: string; caller_phone: string; summary: string; status: string; created_at: string };
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;
  const borderColor = {
    new: colors.electric,
    contacted: StatusColors.contacted,
    booked: colors.success,
    lost: colors.danger,
  }[lead.status] || colors.border;

  return (
    <Pressable
      onPressIn={() => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, friction: 8 }).start()}
      onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 8 }).start()}
      onPress={onPress}
    >
      <Animated.View style={[st.leadCard, { backgroundColor: colors.bgCard, borderColor: colors.border, transform: [{ scale }] }]}>
        <View style={[st.leadAccent, { backgroundColor: borderColor }]} />
        <View style={st.leadRow}>
          <LinearGradient colors={colors.gradientElectric as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={st.leadAvatar}>
            <Text style={st.leadAvatarText}>{lead.caller_name.charAt(0)}</Text>
          </LinearGradient>
          <View style={st.leadInfo}>
            <View style={st.leadNameRow}>
              <Text style={[st.leadName, { color: colors.textPrimary }]} numberOfLines={1}>{lead.caller_name}</Text>
              <Text style={[st.leadTime, { color: colors.textMuted }]}>{getTimeAgo(lead.created_at)}</Text>
            </View>
            <Text style={[st.leadSummary, { color: colors.textSecondary }]} numberOfLines={1}>{lead.summary}</Text>
            <View style={st.leadBottom}>
              <Text style={[st.leadPhone, { color: colors.textMuted }]}>{lead.caller_phone}</Text>
              <Badge status={lead.status as any} size="sm" />
            </View>
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
}

// ── Stat Card ────────────────────────────────────────────────

function DashStatCard({ label, value, prefix, suffix, accentColor }: {
  label: string; value: number; prefix?: string; suffix?: string; accentColor: string;
}) {
  const { colors } = useTheme();
  const count = useCountUp(value, 1200);

  return (
    <View style={[st.statCard, { backgroundColor: colors.bgCard, borderColor: colors.borderLight }]}>
      <View style={[st.statAccent, { backgroundColor: accentColor }]} />
      <Text style={[st.statLabel, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[st.statValue, { color: colors.textPrimary }]}>
        {prefix}{count.toLocaleString()}{suffix}
      </Text>
    </View>
  );
}

// ── Feature Card ─────────────────────────────────────────────

function FeatureCard({ icon, title, subtitle, gradientColors, onPress }: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  gradientColors: [string, string];
  onPress: () => void;
}) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [st.featureCard, { backgroundColor: colors.bgCard, borderColor: colors.border }, pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}
    >
      <View style={st.featureRow}>
        <LinearGradient colors={gradientColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={st.featureIcon}>
          <Ionicons name={icon} size={20} color="#fff" />
        </LinearGradient>
        <View style={st.featureTextCol}>
          <Text style={[st.featureTitle, { color: colors.textPrimary }]}>{title}</Text>
          <Text style={[st.featureSub, { color: colors.textMuted }]}>{subtitle}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      </View>
    </Pressable>
  );
}

// ── Loading Skeleton ─────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <View style={{ gap: Spacing.md, paddingHorizontal: ScreenPadding.horizontal }}>
      <ShimmerSkeleton width="100%" height={80} borderRadius={BorderRadius.xl} />
      <ShimmerSkeleton width="100%" height={60} />
      <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
        <ShimmerSkeleton width="33%" height={104} />
        <ShimmerSkeleton width="33%" height={104} />
        <ShimmerSkeleton width="33%" height={104} />
      </View>
      <ShimmerSkeleton width="100%" height={60} />
      <ShimmerSkeleton width="100%" height={60} />
      <ShimmerSkeleton width="100%" height={60} />
      <ShimmerSkeleton width="100%" height={60} />
    </View>
  );
}

// ── Main Screen ──────────────────────────────────────────────

export default function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { user, isGuestMode } = useAuthStore();
  const {
    leads,
    dashboardStats,
    agentStatus,
    isLoading,
    isRefreshing,
    fetchLeads,
    fetchDashboard,
    fetchAgentStatus,
    refresh,
  } = useLeadsStore();

  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchDashboard();
    fetchLeads('today');
    fetchAgentStatus();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 1500, useNativeDriver: false }),
        Animated.timing(glowAnim, { toValue: 0, duration: 1500, useNativeDriver: false }),
      ])
    ).start();
  }, []);

  const onRefresh = useCallback(async () => {
    await refresh();
  }, []);

  const stats = dashboardStats || { leads_today: 0, leads_this_week: 0, leads_this_month: 0, revenue_saved: 0, capture_rate: 0 };
  const recentLeads = leads.slice(0, 5);
  const meta = user?.user_metadata;
  const name = meta?.owner_name || meta?.full_name || meta?.name || meta?.display_name || '';
  const firstName = isGuestMode ? 'Guest' : (name.split(' ')[0] || 'there');
  const biz = isGuestMode ? 'Demo Mode' : (meta?.business_name || '');
  const active = agentStatus?.is_active ?? false;

  const agentBorderColor = active
    ? glowAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['rgba(16, 185, 129, 0.15)', 'rgba(16, 185, 129, 0.55)'],
      })
    : 'rgba(239, 68, 68, 0.15)';

  const agentShadowOpacity = active
    ? glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.4] })
    : 0;

  // Show skeleton only during initial load
  if (isLoading && !dashboardStats) {
    return (
      <View style={[st.root, { backgroundColor: colors.bgPrimary }]}>
        <View style={{ paddingTop: insets.top + Spacing.base }}>
          <DashboardSkeleton />
        </View>
      </View>
    );
  }

  return (
    <View style={[st.root, { backgroundColor: colors.bgPrimary }]}>
      <LinearGradient
        colors={[colors.bgPrimary, colors.bgPrimary, isDark ? 'rgba(14, 165, 233, 0.03)' : 'rgba(2, 132, 199, 0.03)']}
        locations={[0, 0.6, 1]}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        style={[st.container, { paddingTop: insets.top }]}
        contentContainerStyle={st.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.electric} />
        }
      >
        {/* ── Header ── */}
        <View style={[st.headerOuter, { borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]}>
          <BlurView intensity={25} tint={isDark ? 'dark' : 'light'} style={st.headerBlur}>
            <View style={[st.headerInner, { backgroundColor: isDark ? 'rgba(17,24,39,0.65)' : 'rgba(241,245,249,0.85)' }]}>
              <View style={st.headerLeft}>
                <Text style={[TextStyles.h2, { color: colors.textPrimary }]}>
                  {getGreeting()}, {firstName}
                </Text>
                {biz ? <Text style={[st.bizName, { color: colors.textMuted }]}>{biz}</Text> : null}
              </View>
              <LinearGradient colors={colors.gradientElectric as any} style={st.headerAvatar}>
                <Text style={st.headerAvatarText}>{firstName.charAt(0).toUpperCase()}</Text>
              </LinearGradient>
            </View>
          </BlurView>
        </View>

        {/* ── Agent Status ── */}
        <Animated.View style={[st.agentCard, { backgroundColor: colors.bgCard, borderColor: agentBorderColor, shadowOpacity: agentShadowOpacity, shadowColor: colors.success }]}>
          <View style={st.agentRow}>
            <View style={st.agentLeft}>
              <View style={[st.agentDot, { backgroundColor: active ? colors.success : colors.danger }]} />
              <View>
                <Text style={[st.agentTitle, { color: colors.textPrimary }]}>AI Agent: {active ? 'Active' : 'Inactive'}</Text>
                <Text style={[st.agentSub, { color: colors.textMuted }]}>{active ? 'Answering calls 24/7' : 'Agent is paused'}</Text>
              </View>
            </View>
            <View style={st.agentRight}>
              <WaveformBars active={active} successColor={colors.success} mutedColor={colors.textMuted} />
              <View style={[st.statusPill, { backgroundColor: active ? colors.successGlow : colors.dangerGlow }]}>
                <Text style={[st.statusPillText, { color: active ? colors.success : colors.danger }]}>{active ? 'LIVE' : 'OFF'}</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* ── Stat Cards ── */}
        <View style={st.statsRow}>
          <DashStatCard label="TODAY" value={stats.leads_today} accentColor={colors.cyan} />
          <DashStatCard label="THIS MONTH" value={stats.leads_this_month} accentColor={colors.success} />
          <DashStatCard label="CAPTURE" value={stats.capture_rate} suffix="%" accentColor={colors.warning} />
        </View>

        {/* ── Feature Cards ── */}
        <FeatureCard
          icon="card-outline"
          title="Payments & Deposits"
          subtitle={stats.revenue_saved ? `$${stats.revenue_saved.toLocaleString()} collected` : 'View payments'}
          gradientColors={colors.gradientElectric as any}
          onPress={() => router.push('/payments')}
        />
        <FeatureCard
          icon="calendar-outline"
          title="Calendar & Bookings"
          subtitle={stats.leads_this_week ? `${stats.leads_this_week} this week` : 'View bookings'}
          gradientColors={[colors.cyan, colors.electric]}
          onPress={() => router.push('/calendar')}
        />
        <FeatureCard
          icon="trending-up"
          title="Revenue Dashboard"
          subtitle={stats.revenue_saved ? `$${stats.revenue_saved.toLocaleString()} saved` : 'View revenue'}
          gradientColors={[colors.success, colors.cyan]}
          onPress={() => router.push('/revenue')}
        />
        <FeatureCard
          icon="star"
          title="Reviews & Reputation"
          subtitle="Manage reviews"
          gradientColors={[colors.warning, '#F97316']}
          onPress={() => router.push('/reviews')}
        />

        {/* ── Recent Activity ── */}
        <View style={st.sectionHeader}>
          <View style={st.sectionLeft}>
            <View style={[st.sectionDot, { backgroundColor: colors.electric }]} />
            <Text style={[st.sectionTitle, { color: colors.textPrimary }]}>Recent Activity</Text>
          </View>
          <Pressable onPress={() => router.push('/(tabs)/calls')} hitSlop={8}>
            <Text style={[st.viewAll, { color: colors.electric }]}>View All</Text>
          </Pressable>
        </View>

        {recentLeads.length === 0 ? (
          <View style={st.emptyWrap}>
            <Ionicons name="call-outline" size={36} color={colors.textMuted} />
            <Text style={[st.emptyTitle, { color: colors.textSecondary }]}>No leads yet</Text>
            <Text style={[st.emptyText, { color: colors.textMuted }]}>
              Leads will appear here as your AI agent handles calls
            </Text>
          </View>
        ) : (
          recentLeads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} onPress={() => router.push(`/lead/${lead.id}`)} />
          ))
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────

const st = StyleSheet.create({
  root: { flex: 1 },
  container: { flex: 1 },
  scroll: { paddingHorizontal: ScreenPadding.horizontal, gap: Spacing.md },

  headerOuter: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    marginTop: Spacing.base,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  headerBlur: { overflow: 'hidden', borderRadius: BorderRadius.xl },
  headerInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  headerLeft: { flex: 1 },
  bizName: { ...Fonts.bodyMedium, fontSize: TypeScale.bodySm, marginTop: 3 },
  headerAvatar: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  headerAvatarText: { ...Fonts.displayBold, fontSize: TypeScale.h3, color: '#fff' },

  agentCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.base,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 16,
    elevation: 4,
  },
  agentRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  agentLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, flex: 1 },
  agentDot: { width: 10, height: 10, borderRadius: 5 },
  agentTitle: { ...Fonts.bodySemibold, fontSize: TypeScale.body },
  agentSub: { ...Fonts.body, fontSize: TypeScale.caption, marginTop: 1 },
  agentRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  statusPill: { paddingHorizontal: Spacing.md, paddingVertical: 4, borderRadius: BorderRadius.full },
  statusPillText: { ...Fonts.monoBold, fontSize: TypeScale.tiny, letterSpacing: 1 },

  waveWrap: { flexDirection: 'row', alignItems: 'center', gap: 3, height: 22 },
  waveBar: { width: 3, height: 22, borderRadius: 1.5 },

  statsRow: { flexDirection: 'row', gap: Spacing.sm },
  statCard: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    minHeight: 104,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  statAccent: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 2,
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
  },
  statLabel: { ...Fonts.bodyMedium, fontSize: TypeScale.tiny, letterSpacing: 0.8, marginBottom: Spacing.sm },
  statValue: { ...Fonts.monoBold, fontSize: TypeScale.stat, letterSpacing: -0.5 },

  featureCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.base,
    overflow: 'hidden',
  },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  featureIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  featureTextCol: { flex: 1 },
  featureTitle: { ...Fonts.bodySemibold, fontSize: TypeScale.body },
  featureSub: { ...Fonts.mono, fontSize: TypeScale.caption, marginTop: 2 },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.sm },
  sectionLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  sectionDot: { width: 6, height: 6, borderRadius: 3 },
  sectionTitle: { ...Fonts.bodySemibold, fontSize: TypeScale.h4 },
  viewAll: { ...Fonts.bodyMedium, fontSize: TypeScale.bodySm },

  leadCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    paddingVertical: Spacing.md,
    paddingRight: Spacing.md,
    paddingLeft: Spacing.md + 4,
    overflow: 'hidden',
  },
  leadAccent: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, borderTopLeftRadius: BorderRadius.lg, borderBottomLeftRadius: BorderRadius.lg },
  leadRow: { flexDirection: 'row', gap: Spacing.md },
  leadAvatar: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  leadAvatarText: { ...Fonts.displayBold, fontSize: TypeScale.h3, color: '#fff' },
  leadInfo: { flex: 1, gap: 3 },
  leadNameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  leadName: { ...Fonts.bodySemibold, fontSize: TypeScale.body, flex: 1 },
  leadTime: { ...Fonts.mono, fontSize: TypeScale.tiny, marginLeft: Spacing.sm },
  leadSummary: { ...Fonts.body, fontSize: TypeScale.bodySm },
  leadBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 },
  leadPhone: { ...Fonts.mono, fontSize: TypeScale.caption },

  emptyWrap: { alignItems: 'center', paddingVertical: Spacing['3xl'], gap: Spacing.sm },
  emptyTitle: { ...TextStyles.h3 },
  emptyText: { ...Fonts.body, fontSize: TypeScale.bodySm, textAlign: 'center' },
});
