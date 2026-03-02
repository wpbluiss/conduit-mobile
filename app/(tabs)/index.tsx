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
import { Badge } from '../../components/ui/Badge';
import { Colors, StatusColors } from '../../constants/colors';
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

const STATUS_BORDER: Record<string, string> = {
  new: Colors.electric,
  contacted: StatusColors.contacted,
  booked: Colors.success,
  lost: Colors.danger,
};

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

// ── Shimmer Effect ───────────────────────────────────────────

function ShimmerOverlay() {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 0, useNativeDriver: true }),
        Animated.delay(3000),
      ])
    ).start();
  }, []);

  const translateX = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-SCREEN_W, SCREEN_W],
  });

  return (
    <Animated.View style={[st.shimmer, { transform: [{ translateX }] }]}>
      <LinearGradient
        colors={['transparent', 'rgba(255,255,255,0.04)', 'rgba(255,255,255,0.08)', 'rgba(255,255,255,0.04)', 'transparent']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  );
}

// ── Waveform Bars ────────────────────────────────────────────

function WaveformBars({ active }: { active: boolean }) {
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
          Animated.timing(bar, {
            toValue: 1,
            duration: 400 + i * 80,
            useNativeDriver: true,
          }),
          Animated.timing(bar, {
            toValue: 0,
            duration: 400 + i * 80,
            useNativeDriver: true,
          }),
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
              backgroundColor: active ? Colors.success : Colors.textMuted,
              transform: [
                {
                  scaleY: bar.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.3, heights[i]],
                  }),
                },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
}

// ── Pressable Lead Card ──────────────────────────────────────

function LeadCard({
  lead,
  onPress,
}: {
  lead: { id: string; caller_name: string; caller_phone: string; summary: string; status: string; created_at: string };
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const borderColor = STATUS_BORDER[lead.status] || Colors.border;

  return (
    <Pressable
      onPressIn={() =>
        Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, friction: 8 }).start()
      }
      onPressOut={() =>
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 8 }).start()
      }
      onPress={onPress}
    >
      <Animated.View style={[st.leadCard, { transform: [{ scale }] }]}>
        {/* Status accent border */}
        <View style={[st.leadAccent, { backgroundColor: borderColor }]} />
        <View style={st.leadRow}>
          <LinearGradient
            colors={Colors.gradientElectric}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={st.leadAvatar}
          >
            <Text style={st.leadAvatarText}>{lead.caller_name.charAt(0)}</Text>
          </LinearGradient>
          <View style={st.leadInfo}>
            <View style={st.leadNameRow}>
              <Text style={st.leadName} numberOfLines={1}>
                {lead.caller_name}
              </Text>
              <Text style={st.leadTime}>{getTimeAgo(lead.created_at)}</Text>
            </View>
            <Text style={st.leadSummary} numberOfLines={1}>
              {lead.summary}
            </Text>
            <View style={st.leadBottom}>
              <Text style={st.leadPhone}>{lead.caller_phone}</Text>
              <Badge status={lead.status as any} size="sm" />
            </View>
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
}

// ── Stat Card ────────────────────────────────────────────────

function StatCard({
  label,
  value,
  prefix,
  suffix,
  gradientEnd,
  borderColor,
  accentColor,
  trend,
}: {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  gradientEnd: string;
  borderColor: string;
  accentColor: string;
  trend?: string;
}) {
  const count = useCountUp(value, 1200);

  return (
    <LinearGradient
      colors={[Colors.bgCard, gradientEnd]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={[st.statCard, { borderColor }]}
    >
      <ShimmerOverlay />
      <View style={[st.statAccent, { backgroundColor: accentColor }]} />
      <Text style={st.statLabel}>{label}</Text>
      <Text style={st.statValue}>
        {prefix}
        {count.toLocaleString()}
        {suffix}
      </Text>
      {trend && (
        <View style={[st.trendBadge, { backgroundColor: Colors.successGlow }]}>
          <Text style={[st.trendText, { color: Colors.success }]}>{trend}</Text>
        </View>
      )}
    </LinearGradient>
  );
}

// ── Main Screen ──────────────────────────────────────────────

export default function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const {
    leads,
    dashboardStats,
    agentStatus,
    isRefreshing,
    fetchLeads,
    fetchDashboard,
    fetchAgentStatus,
    refresh,
  } = useLeadsStore();

  // Agent glow animation (RN Animated)
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

  const stats = dashboardStats || { leads_today: 0, revenue_saved: 0, capture_rate: 0 };
  const recentLeads = leads.slice(0, 5);
  const meta = user?.user_metadata;
  const name = meta?.owner_name || meta?.full_name || meta?.name || meta?.display_name || '';
  const firstName = name.split(' ')[0] || 'there';
  const biz = meta?.business_name || '';
  const active = agentStatus?.is_active ?? true;

  const agentBorderColor = active
    ? glowAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['rgba(16, 185, 129, 0.15)', 'rgba(16, 185, 129, 0.55)'],
      })
    : 'rgba(239, 68, 68, 0.15)';

  const agentShadowOpacity = active
    ? glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.4] })
    : 0;

  return (
    <View style={st.root}>
      {/* Gradient mesh background */}
      <LinearGradient
        colors={[Colors.bgPrimary, Colors.bgPrimary, 'rgba(14, 165, 233, 0.03)']}
        locations={[0, 0.6, 1]}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        style={[st.container, { paddingTop: insets.top }]}
        contentContainerStyle={st.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={Colors.electric} />
        }
      >
        {/* ── Glassmorphism Header ── */}
        <View style={st.headerOuter}>
          <BlurView intensity={25} tint="dark" style={st.headerBlur}>
            <View style={st.headerInner}>
              <View style={st.headerLeft}>
                <Text style={st.greeting}>
                  {getGreeting()}, {firstName}
                </Text>
                {biz ? <Text style={st.bizName}>{biz}</Text> : null}
              </View>
              <View style={st.headerRight}>
                <LinearGradient
                  colors={['#0EA5E9', '#06B6D4']}
                  style={st.headerAvatar}
                >
                  <Text style={st.headerAvatarText}>
                    {firstName.charAt(0).toUpperCase()}
                  </Text>
                </LinearGradient>
              </View>
            </View>
          </BlurView>
        </View>

        {/* ── Agent Status Card ── */}
        <Animated.View
          style={[
            st.agentCard,
            {
              borderColor: agentBorderColor,
              shadowOpacity: agentShadowOpacity,
            },
          ]}
        >
          <View style={st.agentRow}>
            <View style={st.agentLeft}>
              <View
                style={[
                  st.agentDot,
                  { backgroundColor: active ? Colors.success : Colors.danger },
                ]}
              />
              <View style={st.agentTextCol}>
                <Text style={st.agentTitle}>
                  AI Agent: {active ? 'Active' : 'Inactive'}
                </Text>
                <Text style={st.agentSub}>
                  {active ? 'Answering calls 24/7' : 'Agent is paused'}
                </Text>
              </View>
            </View>
            <View style={st.agentRight}>
              <WaveformBars active={active} />
              <View
                style={[
                  st.statusPill,
                  {
                    backgroundColor: active ? Colors.successGlow : Colors.dangerGlow,
                  },
                ]}
              >
                <Text
                  style={[
                    st.statusPillText,
                    { color: active ? Colors.success : Colors.danger },
                  ]}
                >
                  {active ? 'LIVE' : 'OFF'}
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* ── Stat Cards ── */}
        <View style={st.statsRow}>
          <StatCard
            label="LEADS"
            value={stats.leads_today}
            gradientEnd="rgba(14, 165, 233, 0.12)"
            borderColor="rgba(14, 165, 233, 0.15)"
            accentColor={Colors.electric}
            trend="↑ 18%"
          />
          <StatCard
            label="REVENUE"
            value={stats.revenue_saved}
            prefix="$"
            gradientEnd="rgba(16, 185, 129, 0.12)"
            borderColor="rgba(16, 185, 129, 0.15)"
            accentColor={Colors.success}
          />
          <StatCard
            label="CAPTURE"
            value={stats.capture_rate}
            suffix="%"
            gradientEnd="rgba(6, 182, 212, 0.12)"
            borderColor="rgba(6, 182, 212, 0.15)"
            accentColor={Colors.cyan}
          />
        </View>

        {/* ── Recent Activity Header ── */}
        <View style={st.sectionHeader}>
          <View style={st.sectionLeft}>
            <View style={st.sectionDot} />
            <Text style={st.sectionTitle}>Recent Activity</Text>
          </View>
          <Pressable onPress={() => router.push('/(tabs)/calls')} hitSlop={8}>
            <Text style={st.viewAll}>View All</Text>
          </Pressable>
        </View>

        {/* ── Lead Cards ── */}
        {recentLeads.length === 0 ? (
          <View style={st.emptyWrap}>
            <Ionicons name="call-outline" size={36} color={Colors.textMuted} />
            <Text style={st.emptyTitle}>No leads yet</Text>
            <Text style={st.emptyText}>
              Leads will appear here as your AI agent handles calls
            </Text>
          </View>
        ) : (
          recentLeads.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              onPress={() => router.push(`/lead/${lead.id}`)}
            />
          ))
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bgPrimary },
  container: { flex: 1 },
  scroll: { paddingHorizontal: ScreenPadding.horizontal, gap: Spacing.md },

  /* ── Glassmorphism Header ── */
  headerOuter: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    marginTop: Spacing.base,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  headerBlur: {
    overflow: 'hidden',
    borderRadius: BorderRadius.xl,
  },
  headerInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    backgroundColor: 'rgba(17, 24, 39, 0.65)',
  },
  headerLeft: { flex: 1 },
  greeting: {
    ...TextStyles.h2,
    color: Colors.textPrimary,
  },
  bizName: {
    ...Fonts.bodyMedium,
    fontSize: TypeScale.bodySm,
    color: Colors.textMuted,
    marginTop: 3,
  },
  headerRight: {},
  headerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarText: {
    ...Fonts.displayBold,
    fontSize: TypeScale.h3,
    color: '#fff',
  },

  /* ── Agent Status ── */
  agentCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.base,
    shadowColor: Colors.success,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 16,
    elevation: 4,
  },
  agentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  agentLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, flex: 1 },
  agentDot: { width: 10, height: 10, borderRadius: 5 },
  agentTextCol: {},
  agentTitle: { ...Fonts.bodySemibold, fontSize: TypeScale.body, color: Colors.textPrimary },
  agentSub: { ...Fonts.body, fontSize: TypeScale.caption, color: Colors.textMuted, marginTop: 1 },
  agentRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  statusPill: { paddingHorizontal: Spacing.md, paddingVertical: 4, borderRadius: BorderRadius.full },
  statusPillText: { ...Fonts.monoBold, fontSize: TypeScale.tiny, letterSpacing: 1 },

  /* ── Waveform ── */
  waveWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    height: 22,
  },
  waveBar: {
    width: 3,
    height: 22,
    borderRadius: 1.5,
  },

  /* ── Stat Cards ── */
  statsRow: { flexDirection: 'row', gap: Spacing.sm },
  statCard: {
    flex: 1,
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    minHeight: 104,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  statAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
  },
  statLabel: {
    ...Fonts.bodyMedium,
    fontSize: TypeScale.tiny,
    color: Colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
  },
  statValue: {
    ...Fonts.monoBold,
    fontSize: TypeScale.stat,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  trendBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.xs,
  },
  trendText: { ...Fonts.mono, fontSize: TypeScale.tiny, fontWeight: '600' },

  /* ── Shimmer ── */
  shimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: SCREEN_W * 0.6,
    zIndex: 1,
  },

  /* ── Section Header ── */
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  sectionLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  sectionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.electric,
  },
  sectionTitle: { ...Fonts.bodySemibold, fontSize: TypeScale.h4, color: Colors.textPrimary },
  viewAll: { ...Fonts.bodyMedium, fontSize: TypeScale.bodySm, color: Colors.electric },

  /* ── Lead Cards ── */
  leadCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: Spacing.md,
    paddingRight: Spacing.md,
    paddingLeft: Spacing.md + 4,
    overflow: 'hidden',
  },
  leadAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    borderTopLeftRadius: BorderRadius.lg,
    borderBottomLeftRadius: BorderRadius.lg,
  },
  leadRow: { flexDirection: 'row', gap: Spacing.md },
  leadAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leadAvatarText: { ...Fonts.displayBold, fontSize: TypeScale.h3, color: '#fff' },
  leadInfo: { flex: 1, gap: 3 },
  leadNameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  leadName: { ...Fonts.bodySemibold, fontSize: TypeScale.body, color: Colors.textPrimary, flex: 1 },
  leadTime: { ...Fonts.mono, fontSize: TypeScale.tiny, color: Colors.textMuted, marginLeft: Spacing.sm },
  leadSummary: { ...Fonts.body, fontSize: TypeScale.bodySm, color: Colors.textSecondary },
  leadBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 },
  leadPhone: { ...Fonts.mono, fontSize: TypeScale.caption, color: Colors.textMuted },

  /* ── Empty State ── */
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: Spacing['3xl'],
    gap: Spacing.sm,
  },
  emptyTitle: { ...TextStyles.h3, color: Colors.textSecondary },
  emptyText: { ...Fonts.body, fontSize: TypeScale.bodySm, color: Colors.textMuted, textAlign: 'center' },
});
