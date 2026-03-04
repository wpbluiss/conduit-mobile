import { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Animated,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors } from '../constants/colors';
import { Fonts, TypeScale, TextStyles } from '../constants/typography';
import { Spacing, BorderRadius, ScreenPadding } from '../constants/layout';
import { api, type RevenueDashboard, type Milestone } from '../lib/api';

const { width: SCREEN_W } = Dimensions.get('window');

// ── Mock Data ────────────────────────────────────────────────

const MOCK_DATA: RevenueDashboard = {
  total_revenue_saved: 12847,
  signup_date: '2025-11-15',
  leads_captured: 47,
  calls_handled: 189,
  avg_lead_value: 273,
  roi_multiplier: 32,
  subscription_cost: 39,
  milestones: [
    { id: 'ms-1', title: '10 Leads Captured', description: 'First double digits', target: 10, current: 10, status: 'unlocked', icon: 'star' },
    { id: 'ms-2', title: '50 Leads Captured', description: 'Growing fast', target: 50, current: 50, status: 'unlocked', icon: 'flash' },
    { id: 'ms-3', title: '$1,000 Saved', description: 'First grand', target: 1000, current: 1000, status: 'unlocked', icon: 'cash' },
    { id: 'ms-4', title: '100 Leads Captured', description: 'Triple digits', target: 100, current: 47, status: 'in_progress', icon: 'rocket' },
    { id: 'ms-5', title: '$5,000 Saved', description: 'Serious ROI', target: 5000, current: 4285, status: 'in_progress', icon: 'diamond' },
    { id: 'ms-6', title: '500 Leads Captured', description: 'Power user', target: 500, current: 47, status: 'locked', icon: 'shield-checkmark' },
    { id: 'ms-7', title: '$10,000 Saved', description: 'Five figures', target: 10000, current: 4285, status: 'locked', icon: 'medal' },
    { id: 'ms-8', title: '1,000 Leads Captured', description: 'Legend', target: 1000, current: 47, status: 'locked', icon: 'trophy' },
  ],
  current_streak: 7,
  best_streak: 14,
  streak_week: [true, true, true, false, true, true, true],
  weekly_leads: [
    { day: 'M', count: 3 },
    { day: 'T', count: 5 },
    { day: 'W', count: 2 },
    { day: 'T', count: 7 },
    { day: 'F', count: 4 },
    { day: 'S', count: 1 },
    { day: 'S', count: 0 },
  ],
  this_month: { leads: 23, revenue: 6280, calls: 92, conversion_rate: 68 },
  last_month: { leads: 18, revenue: 4920, calls: 78, conversion_rate: 62 },
};

// ── Animated Count-Up ────────────────────────────────────────

function useCountUp(target: number, duration = 1500, decimals = 0) {
  const [display, setDisplay] = useState(0);
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    anim.setValue(0);
    const factor = Math.pow(10, decimals);
    const listener = anim.addListener(({ value }) => setDisplay(Math.round(value * factor) / factor));
    Animated.timing(anim, { toValue: target, duration, useNativeDriver: false }).start();
    return () => anim.removeListener(listener);
  }, [target]);
  return display;
}

// ── Shimmer ──────────────────────────────────────────────────

function ShimmerOverlay() {
  const shimmer = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(shimmer, { toValue: 1, duration: 2000, useNativeDriver: true }),
      Animated.timing(shimmer, { toValue: 0, duration: 0, useNativeDriver: true }),
      Animated.delay(3000),
    ])).start();
  }, []);
  const translateX = shimmer.interpolate({ inputRange: [0, 1], outputRange: [-SCREEN_W, SCREEN_W] });
  return (
    <Animated.View style={[st.shimmer, { transform: [{ translateX }] }]}>
      <LinearGradient colors={['transparent', 'rgba(255,255,255,0.04)', 'rgba(255,255,255,0.08)', 'rgba(255,255,255,0.04)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFill} />
    </Animated.View>
  );
}

// ── Stagger ──────────────────────────────────────────────────

function StaggerIn({ index, children }: { index: number; children: React.ReactNode }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  useEffect(() => {
    const delay = index * 100;
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 500, delay, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 500, delay, useNativeDriver: true }),
    ]).start();
  }, []);
  return <Animated.View style={{ opacity, transform: [{ translateY }] }}>{children}</Animated.View>;
}

// ── Glow Pulse ───────────────────────────────────────────────

function GlowPulse() {
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 1500, useNativeDriver: false }),
      Animated.timing(pulse, { toValue: 0, duration: 1500, useNativeDriver: false }),
    ])).start();
  }, []);
  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.08, 0.25] });
  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1.05] });
  return (
    <Animated.View style={[st.glowPulse, { opacity, transform: [{ scale }] }]}>
      <LinearGradient colors={[Colors.electricMuted, 'rgba(6, 182, 212, 0.05)']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFill} />
    </Animated.View>
  );
}

// ── Mini Stat ────────────────────────────────────────────────

function MiniStat({ label, value, prefix, suffix }: { label: string; value: number; prefix?: string; suffix?: string }) {
  const count = useCountUp(value, 1200);
  const formatted = prefix === '$'
    ? `$${Math.round(count).toLocaleString()}`
    : suffix === 'x'
      ? `${Math.round(count)}x`
      : Math.round(count).toLocaleString();

  return (
    <View style={st.miniStat}>
      <Text style={st.miniStatLabel}>{label}</Text>
      <Text style={st.miniStatValue}>{formatted}</Text>
    </View>
  );
}

// ── Milestone Row ────────────────────────────────────────────

function MilestoneRow({ milestone, isLast }: { milestone: Milestone; isLast: boolean }) {
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const isInProgress = milestone.status === 'in_progress';
  const isUnlocked = milestone.status === 'unlocked';
  const isLocked = milestone.status === 'locked';
  const progress = Math.min(milestone.current / milestone.target, 1);

  useEffect(() => {
    if (isInProgress) {
      Animated.loop(Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: false }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 1200, useNativeDriver: false }),
      ])).start();
    }
  }, [isInProgress]);

  const dotBorderColor = isInProgress
    ? pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [Colors.electric, Colors.electricGlow] })
    : isUnlocked ? Colors.success : Colors.textMuted;

  const dotShadow = isInProgress
    ? pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.6] })
    : 0;

  const iconName: React.ComponentProps<typeof Ionicons>['name'] = isUnlocked
    ? 'checkmark-circle'
    : isLocked
      ? 'lock-closed'
      : (milestone.icon as any) || 'ellipse';

  return (
    <View style={st.msRow}>
      {/* Timeline connector */}
      <View style={st.msTimeline}>
        <Animated.View style={[
          st.msDot,
          {
            borderColor: dotBorderColor,
            backgroundColor: isUnlocked ? Colors.success : isInProgress ? Colors.electric : Colors.bgElevated,
            shadowColor: Colors.electric,
            shadowOpacity: dotShadow,
            shadowRadius: 8,
          },
        ]}>
          <Ionicons
            name={iconName}
            size={isUnlocked ? 14 : 12}
            color={isUnlocked ? '#fff' : isInProgress ? '#fff' : Colors.textMuted}
          />
        </Animated.View>
        {!isLast && <View style={[st.msLine, { backgroundColor: isUnlocked ? Colors.success : Colors.border }]} />}
      </View>

      {/* Content */}
      <View style={[st.msContent, isLocked && { opacity: 0.45 }]}>
        <View style={st.msNameRow}>
          <Text style={[st.msTitle, isUnlocked && { color: Colors.textPrimary }]}>{milestone.title}</Text>
          {isUnlocked && (
            <View style={st.msUnlockedBadge}>
              <ShimmerOverlay />
              <Ionicons name="checkmark" size={10} color={Colors.success} />
            </View>
          )}
        </View>
        <Text style={st.msDesc}>{milestone.description}</Text>
        {isInProgress && (
          <View style={st.msProgressWrap}>
            <View style={st.msProgressBg}>
              <LinearGradient
                colors={Colors.gradientElectric}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={[st.msProgressFill, { width: `${Math.round(progress * 100)}%` as any }]}
              />
            </View>
            <Text style={st.msProgressText}>{Math.round(progress * 100)}%</Text>
          </View>
        )}
      </View>
    </View>
  );
}

// ── Bar Chart ────────────────────────────────────────────────

function WeeklyChart({ data }: { data: { day: string; count: number }[] }) {
  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  return (
    <View style={st.chartWrap}>
      <View style={st.chartBars}>
        {data.map((d, i) => {
          const height = (d.count / maxCount) * 100;
          const isSelected = selectedIdx === i;
          return (
            <Pressable key={i} style={st.chartBarCol} onPress={() => { Haptics.selectionAsync(); setSelectedIdx(isSelected ? null : i); }}>
              {isSelected && (
                <View style={st.chartTooltip}>
                  <Text style={st.chartTooltipText}>{d.count}</Text>
                </View>
              )}
              <View style={st.chartBarTrack}>
                <LinearGradient
                  colors={Colors.gradientElectric}
                  start={{ x: 0.5, y: 1 }} end={{ x: 0.5, y: 0 }}
                  style={[st.chartBar, { height: `${Math.max(height, 4)}%` as any }, isSelected && st.chartBarSelected]}
                />
              </View>
              <Text style={[st.chartDayLabel, isSelected && { color: Colors.electric }]}>{d.day}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// ── Comparison Row ───────────────────────────────────────────

function ComparisonRow({ label, current, previous, prefix, suffix }: {
  label: string; current: number; previous: number; prefix?: string; suffix?: string;
}) {
  const diff = previous > 0 ? ((current - previous) / previous) * 100 : 0;
  const isUp = diff > 0;
  const isDown = diff < 0;
  const fmt = (v: number) => {
    if (prefix === '$') return `$${v.toLocaleString()}`;
    if (suffix === '%') return `${v}%`;
    return v.toLocaleString();
  };

  return (
    <View style={st.compRow}>
      <Text style={st.compLabel}>{label}</Text>
      <View style={st.compValues}>
        <Text style={st.compCurrent}>{fmt(current)}</Text>
        <Text style={st.compPrevious}>vs {fmt(previous)}</Text>
        {diff !== 0 && (
          <View style={[st.compBadge, { backgroundColor: isUp ? Colors.successGlow : Colors.dangerGlow }]}>
            <Ionicons name={isUp ? 'trending-up' : 'trending-down'} size={12} color={isUp ? Colors.success : Colors.danger} />
            <Text style={[st.compBadgeText, { color: isUp ? Colors.success : Colors.danger }]}>
              {isUp ? '+' : ''}{Math.round(diff)}%
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

// ── Main Screen ──────────────────────────────────────────────

export default function RevenueScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<RevenueDashboard>(MOCK_DATA);

  useEffect(() => {
    api.getRevenueDashboard()
      .then(setData)
      .catch(() => { /* use mock */ });
  }, []);

  const heroCount = useCountUp(data.total_revenue_saved, 1500);
  const heroFormatted = `$${Math.round(heroCount).toLocaleString()}`;
  const signupFormatted = new Date(data.signup_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

  return (
    <View style={st.root}>
      <LinearGradient colors={[Colors.bgPrimary, Colors.bgPrimary, 'rgba(14, 165, 233, 0.03)']} locations={[0, 0.6, 1]} style={StyleSheet.absoluteFill} />

      {/* ── Header ── */}
      <View style={[st.header, { paddingTop: insets.top + Spacing.sm }]}>
        <Pressable onPress={() => router.back()} style={st.backBtn} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </Pressable>
        <View style={st.headerTextCol}>
          <Text style={st.headerTitle}>Revenue</Text>
          <Text style={st.headerSub}>Track your ROI with Conduit AI</Text>
        </View>
      </View>

      <ScrollView style={st.container} contentContainerStyle={st.scroll} showsVerticalScrollIndicator={false}>
        {/* ── Hero Stat ── */}
        <StaggerIn index={0}>
          <View style={st.heroCard}>
            <ShimmerOverlay />
            <GlowPulse />
            <Text style={st.heroLabel}>Total Revenue Saved</Text>
            <Text style={st.heroValue}>{heroFormatted}</Text>
            <Text style={st.heroSub}>Since {signupFormatted}</Text>
          </View>
        </StaggerIn>

        {/* ── Stats Row ── */}
        <StaggerIn index={1}>
          <View style={st.statsGrid}>
            <MiniStat label="Leads" value={data.leads_captured} />
            <MiniStat label="Calls" value={data.calls_handled} />
            <MiniStat label="Avg Value" value={data.avg_lead_value} prefix="$" />
            <MiniStat label="ROI" value={data.roi_multiplier} suffix="x" />
          </View>
        </StaggerIn>

        {/* ── Weekly Performance ── */}
        <StaggerIn index={2}>
          <View style={st.sectionHeader}>
            <View style={st.sectionLeft}>
              <View style={st.sectionDot} />
              <Text style={st.sectionTitle}>Weekly Leads</Text>
            </View>
          </View>
          <View style={st.glassCard}>
            <ShimmerOverlay />
            <WeeklyChart data={data.weekly_leads} />
          </View>
        </StaggerIn>

        {/* ── Streaks ── */}
        <StaggerIn index={3}>
          <View style={st.sectionHeader}>
            <View style={st.sectionLeft}>
              <View style={st.sectionDot} />
              <Text style={st.sectionTitle}>Streak</Text>
            </View>
          </View>
          <View style={st.streakCard}>
            <ShimmerOverlay />
            <View style={st.streakTop}>
              <View style={st.streakLeft}>
                <Ionicons name="flame" size={28} color={Colors.warning} />
                <View>
                  <Text style={st.streakCount}>{data.current_streak} days</Text>
                  <Text style={st.streakLabel}>Current Streak</Text>
                </View>
              </View>
              <Text style={st.streakBest}>Best: {data.best_streak} days</Text>
            </View>
            <View style={st.streakGrid}>
              {data.streak_week.map((filled, i) => (
                <View key={i} style={[st.streakSquare, filled && st.streakSquareFilled]} />
              ))}
            </View>
          </View>
        </StaggerIn>

        {/* ── Milestones ── */}
        <StaggerIn index={4}>
          <View style={st.sectionHeader}>
            <View style={st.sectionLeft}>
              <View style={st.sectionDot} />
              <Text style={st.sectionTitle}>Milestones</Text>
            </View>
            <Ionicons name="trophy-outline" size={18} color={Colors.textMuted} />
          </View>
          <View style={st.glassCard}>
            <ShimmerOverlay />
            {data.milestones.map((ms, i) => (
              <MilestoneRow key={ms.id} milestone={ms} isLast={i === data.milestones.length - 1} />
            ))}
          </View>
        </StaggerIn>

        {/* ── Monthly Comparison ── */}
        <StaggerIn index={5}>
          <View style={st.sectionHeader}>
            <View style={st.sectionLeft}>
              <View style={st.sectionDot} />
              <Text style={st.sectionTitle}>This Month vs Last Month</Text>
            </View>
          </View>
          <View style={st.glassCard}>
            <ShimmerOverlay />
            <ComparisonRow label="Leads" current={data.this_month.leads} previous={data.last_month.leads} />
            <View style={st.compDivider} />
            <ComparisonRow label="Revenue Saved" current={data.this_month.revenue} previous={data.last_month.revenue} prefix="$" />
            <View style={st.compDivider} />
            <ComparisonRow label="Calls Handled" current={data.this_month.calls} previous={data.last_month.calls} />
            <View style={st.compDivider} />
            <ComparisonRow label="Conversion Rate" current={data.this_month.conversion_rate} previous={data.last_month.conversion_rate} suffix="%" />
          </View>
        </StaggerIn>

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
  shimmer: { position: 'absolute', top: 0, bottom: 0, width: SCREEN_W * 0.6, zIndex: 1 },

  /* ── Header ── */
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: ScreenPadding.horizontal, paddingBottom: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    backgroundColor: Colors.bgPrimary,
  },
  backBtn: { marginRight: Spacing.sm },
  headerTextCol: { flex: 1 },
  headerTitle: { ...Fonts.bodySemibold, fontSize: TypeScale.h3, color: Colors.textPrimary },
  headerSub: { ...Fonts.body, fontSize: TypeScale.caption, color: Colors.textMuted, marginTop: 1 },

  /* ── Hero ── */
  heroCard: {
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.xl,
    borderWidth: 1, borderColor: Colors.border,
    paddingVertical: Spacing['2xl'], paddingHorizontal: Spacing.lg,
    alignItems: 'center', overflow: 'hidden', marginTop: Spacing.sm,
  },
  glowPulse: {
    position: 'absolute', width: 200, height: 200, borderRadius: 100,
    top: '50%', left: '50%', marginTop: -100, marginLeft: -100,
  },
  heroLabel: {
    ...Fonts.bodyMedium, fontSize: TypeScale.caption, color: Colors.textMuted,
    letterSpacing: 1, textTransform: 'uppercase', marginBottom: Spacing.sm,
  },
  heroValue: {
    ...Fonts.displayBold, fontSize: 48, color: Colors.electric,
    letterSpacing: -1.5,
  },
  heroSub: {
    ...Fonts.body, fontSize: TypeScale.bodySm, color: Colors.textMuted,
    marginTop: Spacing.xs,
  },

  /* ── Stats Grid ── */
  statsGrid: { flexDirection: 'row', gap: Spacing.sm },
  miniStat: {
    flex: 1, backgroundColor: Colors.bgCard, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md, alignItems: 'center',
  },
  miniStatLabel: {
    ...Fonts.bodyMedium, fontSize: TypeScale.tiny, color: Colors.textMuted,
    letterSpacing: 0.5, marginBottom: Spacing.xs,
  },
  miniStatValue: { ...Fonts.monoBold, fontSize: TypeScale.h3, color: Colors.textPrimary },

  /* ── Section Header ── */
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginTop: Spacing.sm,
  },
  sectionLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  sectionDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.electric },
  sectionTitle: { ...Fonts.bodySemibold, fontSize: TypeScale.h4, color: Colors.textPrimary },

  /* ── Glass Card ── */
  glassCard: {
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.base, overflow: 'hidden',
  },

  /* ── Chart ── */
  chartWrap: { paddingTop: Spacing.sm },
  chartBars: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.sm },
  chartBarCol: { flex: 1, alignItems: 'center' },
  chartBarTrack: {
    height: 120, width: '100%', borderRadius: BorderRadius.sm,
    backgroundColor: Colors.bgElevated, justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  chartBar: { width: '100%', borderRadius: BorderRadius.sm, minHeight: 4 },
  chartBarSelected: { opacity: 0.85 },
  chartDayLabel: { ...Fonts.mono, fontSize: TypeScale.tiny, color: Colors.textMuted, marginTop: Spacing.xs },
  chartTooltip: {
    backgroundColor: Colors.electric, borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm, paddingVertical: 2, marginBottom: Spacing.xs,
  },
  chartTooltipText: { ...Fonts.monoBold, fontSize: TypeScale.tiny, color: '#fff' },

  /* ── Streak ── */
  streakCard: {
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.base, overflow: 'hidden',
  },
  streakTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  streakLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  streakCount: { ...Fonts.monoBold, fontSize: TypeScale.h2, color: Colors.textPrimary },
  streakLabel: { ...Fonts.body, fontSize: TypeScale.caption, color: Colors.textMuted },
  streakBest: { ...Fonts.mono, fontSize: TypeScale.bodySm, color: Colors.textMuted },
  streakGrid: {
    flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md,
    justifyContent: 'center',
  },
  streakSquare: {
    width: 28, height: 28, borderRadius: BorderRadius.sm,
    backgroundColor: Colors.bgElevated, borderWidth: 1, borderColor: Colors.border,
  },
  streakSquareFilled: {
    backgroundColor: Colors.electricMuted, borderColor: Colors.electricBorder,
  },

  /* ── Milestones ── */
  msRow: { flexDirection: 'row', minHeight: 56 },
  msTimeline: { width: 32, alignItems: 'center' },
  msDot: {
    width: 28, height: 28, borderRadius: 14, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center', zIndex: 1,
    shadowOffset: { width: 0, height: 0 },
  },
  msLine: { width: 2, flex: 1, marginTop: -2, marginBottom: -2 },
  msContent: { flex: 1, paddingLeft: Spacing.md, paddingBottom: Spacing.lg },
  msNameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  msTitle: { ...Fonts.bodySemibold, fontSize: TypeScale.body, color: Colors.textSecondary },
  msDesc: { ...Fonts.body, fontSize: TypeScale.caption, color: Colors.textMuted, marginTop: 2 },
  msUnlockedBadge: {
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: Colors.successGlow,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  msProgressWrap: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.sm },
  msProgressBg: {
    flex: 1, height: 6, borderRadius: 3, backgroundColor: Colors.bgElevated,
    overflow: 'hidden',
  },
  msProgressFill: { height: 6, borderRadius: 3 },
  msProgressText: { ...Fonts.monoBold, fontSize: TypeScale.tiny, color: Colors.electric },

  /* ── Monthly Comparison ── */
  compRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  compLabel: { ...Fonts.body, fontSize: TypeScale.bodySm, color: Colors.textSecondary },
  compValues: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  compCurrent: { ...Fonts.monoBold, fontSize: TypeScale.body, color: Colors.textPrimary },
  compPrevious: { ...Fonts.mono, fontSize: TypeScale.caption, color: Colors.textMuted },
  compBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 2,
    paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.full,
  },
  compBadgeText: { ...Fonts.monoBold, fontSize: TypeScale.tiny },
  compDivider: { height: 1, backgroundColor: Colors.border },
});
