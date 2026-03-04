import { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../contexts/ThemeContext';
import { Colors } from '../../constants/colors';
import { Fonts, TypeScale, TextStyles } from '../../constants/typography';
import { Spacing, BorderRadius, ScreenPadding } from '../../constants/layout';

const { width: SCREEN_W } = Dimensions.get('window');

// ── Data ─────────────────────────────────────────────────────

type PeriodKey = 'today' | '7d' | '30d' | '90d';

const PERIODS: { key: PeriodKey; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: '7d', label: '7 Days' },
  { key: '30d', label: '30 Days' },
  { key: '90d', label: '90 Days' },
];

const MOCK_STATS: Record<PeriodKey, { calls: number; leads: number; rate: number; revenue: number }> = {
  today: { calls: 18, leads: 14, rate: 78, revenue: 840 },
  '7d': { calls: 124, leads: 97, rate: 78, revenue: 5_820 },
  '30d': { calls: 489, leads: 391, rate: 80, revenue: 23_460 },
  '90d': { calls: 1_342, leads: 1_087, rate: 81, revenue: 65_220 },
};

const DAILY_LEADS: Record<PeriodKey, { day: string; value: number }[]> = {
  today: [
    { day: 'Mon', value: 15 }, { day: 'Tue', value: 22 }, { day: 'Wed', value: 18 },
    { day: 'Thu', value: 27 }, { day: 'Fri', value: 20 }, { day: 'Sat', value: 12 }, { day: 'Sun', value: 14 },
  ],
  '7d': [
    { day: 'Mon', value: 15 }, { day: 'Tue', value: 22 }, { day: 'Wed', value: 18 },
    { day: 'Thu', value: 27 }, { day: 'Fri', value: 20 }, { day: 'Sat', value: 12 }, { day: 'Sun', value: 14 },
  ],
  '30d': [
    { day: 'Mon', value: 68 }, { day: 'Tue', value: 74 }, { day: 'Wed', value: 71 },
    { day: 'Thu', value: 82 }, { day: 'Fri', value: 76 }, { day: 'Sat', value: 45 }, { day: 'Sun', value: 38 },
  ],
  '90d': [
    { day: 'Mon', value: 192 }, { day: 'Tue', value: 210 }, { day: 'Wed', value: 198 },
    { day: 'Thu', value: 224 }, { day: 'Fri', value: 208 }, { day: 'Sat', value: 134 }, { day: 'Sun', value: 112 },
  ],
};

const CALL_REASONS = [
  { label: 'Appointment Booking', pct: 45, color: Colors.electric },
  { label: 'Price Inquiry', pct: 25, color: Colors.cyan },
  { label: 'Service Question', pct: 15, color: Colors.warning },
  { label: 'Emergency', pct: 10, color: Colors.danger },
  { label: 'Other', pct: 5, color: Colors.textMuted },
];

const PEAK_HOURS = [
  { hour: '8 AM', pct: 15 }, { hour: '9 AM', pct: 45 }, { hour: '10 AM', pct: 70 },
  { hour: '11 AM', pct: 85 }, { hour: '12 PM', pct: 60 }, { hour: '1 PM', pct: 50 },
  { hour: '2 PM', pct: 65 }, { hour: '3 PM', pct: 80 }, { hour: '4 PM', pct: 55 },
  { hour: '5 PM', pct: 90 }, { hour: '6 PM', pct: 40 }, { hour: '7 PM', pct: 20 },
];

function fmt(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`;
  return n.toString();
}

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

// ── Shimmer ──────────────────────────────────────────────────

function ShimmerOverlay() {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(anim, { toValue: 1, duration: 2000, useNativeDriver: true }),
      Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
      Animated.delay(3000),
    ])).start();
  }, []);
  return (
    <Animated.View style={[st.shimmer, { transform: [{ translateX: anim.interpolate({ inputRange: [0, 1], outputRange: [-SCREEN_W, SCREEN_W] }) }] }]}>
      <LinearGradient colors={['transparent', 'rgba(255,255,255,0.04)', 'rgba(255,255,255,0.08)', 'rgba(255,255,255,0.04)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFill} />
    </Animated.View>
  );
}

// ── Count-Up ─────────────────────────────────────────────────

function CountUpText({ target, prefix, suffix, style }: { target: number; prefix?: string; suffix?: string; style: any }) {
  const [display, setDisplay] = useState(0);
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    anim.setValue(0);
    const listener = anim.addListener(({ value }) => setDisplay(Math.round(value)));
    Animated.timing(anim, { toValue: target, duration: 1000, useNativeDriver: false }).start();
    return () => anim.removeListener(listener);
  }, [target]);

  return <Text style={style}>{prefix}{display.toLocaleString()}{suffix}</Text>;
}

// ── Animated Bar ─────────────────────────────────────────────

function AnimatedBar({ heightPct, delay, value, label }: { heightPct: number; delay: number; value: number; label: string }) {
  const grow = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(grow, { toValue: 1, duration: 600, delay, useNativeDriver: false }).start();
  }, [heightPct]);

  const height = grow.interpolate({ inputRange: [0, 1], outputRange: ['4%', `${Math.max(heightPct, 4)}%`] });

  return (
    <View style={st.barCol}>
      <Text style={st.barValue}>{value}</Text>
      <View style={st.barTrack}>
        <Animated.View style={[st.barAnimWrap, { height }]}>
          <LinearGradient colors={Colors.gradientElectric} start={{ x: 0.5, y: 1 }} end={{ x: 0.5, y: 0 }} style={st.bar} />
        </Animated.View>
      </View>
      <Text style={st.barLabel}>{label}</Text>
    </View>
  );
}

// ── Animated Progress Bar ────────────────────────────────────

function AnimatedReasonBar({ pct, color, delay }: { pct: number; color: string; delay: number }) {
  const width = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(width, { toValue: pct, duration: 800, delay, useNativeDriver: false }).start();
  }, [pct]);
  const widthPct = width.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] });
  return (
    <View style={st.reasonBarTrack}>
      <Animated.View style={[st.reasonBar, { width: widthPct, backgroundColor: color }]} />
    </View>
  );
}

// ── Peak Badge ───────────────────────────────────────────────

function PeakBadge() {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1.1, duration: 1000, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 1, duration: 1000, useNativeDriver: true }),
    ])).start();
  }, []);
  return (
    <Animated.View style={[st.peakBadge, { transform: [{ scale: pulse }] }]}>
      <Text style={st.peakText}>PEAK</Text>
    </Animated.View>
  );
}

// ── Pressable Stat Card ──────────────────────────────────────

function StatCard({ icon, label, value, prefix, suffix, color, bg }: {
  icon: IoniconsName; label: string; value: number; prefix?: string; suffix?: string; color: string; bg: string;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Pressable
      onPressIn={() => Animated.spring(scale, { toValue: 0.95, useNativeDriver: true, friction: 8 }).start()}
      onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 8 }).start()}
      style={{ width: '48%' as any, flexGrow: 1 }}
    >
      <Animated.View style={[st.statCard, { transform: [{ scale }] }]}>
        <ShimmerOverlay />
        <View style={[st.statIconWrap, { backgroundColor: bg }]}>
          <Ionicons name={icon} size={18} color={color} />
        </View>
        <CountUpText target={value} prefix={prefix} suffix={suffix} style={st.statValue} />
        <Text style={st.statLabel}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

// ── Shimmer Card Wrapper ─────────────────────────────────────

function ShimmerCard({ children, style }: { children: React.ReactNode; style?: any }) {
  return (
    <View style={[st.card, style]}>
      <ShimmerOverlay />
      {children}
    </View>
  );
}

// ── Main Screen ──────────────────────────────────────────────

export default function AnalyticsScreen() {
  const { colors, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [period, setPeriod] = useState<PeriodKey>('7d');

  const stats = MOCK_STATS[period];
  const dailyData = DAILY_LEADS[period];
  const maxDaily = useMemo(() => Math.max(...dailyData.map((d) => d.value)), [dailyData]);

  const statCards: { icon: IoniconsName; label: string; value: number; prefix?: string; suffix?: string; color: string; bg: string }[] = [
    { icon: 'call-outline', label: 'Total Calls', value: stats.calls, color: Colors.electric, bg: Colors.electricMuted },
    { icon: 'people-outline', label: 'Captured', value: stats.leads, color: Colors.success, bg: Colors.successGlow },
    { icon: 'trending-up-outline', label: 'Conversion', value: stats.rate, suffix: '%', color: Colors.cyan, bg: Colors.cyanGlow },
    { icon: 'cash-outline', label: 'Revenue', value: stats.revenue, prefix: '$', color: Colors.warning, bg: Colors.warningGlow },
  ];

  return (
    <View style={[st.root, { backgroundColor: colors.bgPrimary }]}>
      <LinearGradient
        colors={[Colors.bgPrimary, Colors.bgPrimary, 'rgba(14, 165, 233, 0.03)']}
        locations={[0, 0.65, 1]}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView
        style={[st.container, { paddingTop: insets.top }]}
        contentContainerStyle={st.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={st.title}>Analytics</Text>

        {/* Period Selector — Glassmorphism */}
        <View style={st.periodOuter}>
          <BlurView intensity={20} tint="dark" style={st.periodBlur}>
            <View style={st.periodInner}>
              {PERIODS.map((p) => {
                const active = period === p.key;
                return (
                  <Pressable key={p.key} onPress={() => setPeriod(p.key)} style={[st.periodBtn, active && st.periodBtnActive]}>
                    <Text style={[st.periodText, active && st.periodTextActive]}>{p.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </BlurView>
        </View>

        {/* Stat Cards */}
        <View style={st.statsGrid}>
          {statCards.map((s) => (
            <StatCard key={s.label} {...s} />
          ))}
        </View>

        {/* Bar Chart */}
        <View style={st.section}>
          <View style={st.sectionHeader}>
            <View style={st.sectionDot} />
            <Text style={st.sectionTitle}>Leads by Day</Text>
          </View>
          <ShimmerCard>
            <View style={st.chartWrap}>
              {dailyData.map((d, i) => (
                <AnimatedBar
                  key={d.day}
                  heightPct={maxDaily > 0 ? (d.value / maxDaily) * 100 : 0}
                  delay={i * 80}
                  value={d.value}
                  label={d.day}
                />
              ))}
            </View>
          </ShimmerCard>
        </View>

        {/* Call Reasons */}
        <View style={st.section}>
          <View style={st.sectionHeader}>
            <View style={st.sectionDot} />
            <Text style={st.sectionTitle}>Top Call Reasons</Text>
          </View>
          <ShimmerCard>
            {CALL_REASONS.map((r, i) => (
              <View key={r.label} style={[st.reasonRow, i < CALL_REASONS.length - 1 && st.reasonBorder]}>
                <View style={st.reasonHeader}>
                  <View style={st.reasonLabelRow}>
                    <View style={[st.reasonDot, { backgroundColor: r.color }]} />
                    <Text style={st.reasonLabel}>{r.label}</Text>
                  </View>
                  <Text style={[st.reasonPct, { color: r.color }]}>{r.pct}%</Text>
                </View>
                <AnimatedReasonBar pct={r.pct} color={r.color} delay={i * 100} />
              </View>
            ))}
          </ShimmerCard>
        </View>

        {/* Peak Hours */}
        <View style={st.section}>
          <View style={st.sectionHeader}>
            <View style={st.sectionDot} />
            <Text style={st.sectionTitle}>Call Volume by Hour</Text>
          </View>
          <ShimmerCard>
            {PEAK_HOURS.map((h, i) => {
              const isPeak = h.pct >= 80;
              return (
                <View key={h.hour} style={[st.hourRow, i < PEAK_HOURS.length - 1 && st.hourBorder]}>
                  <Text style={[st.hourLabel, isPeak && { color: Colors.textPrimary }]}>{h.hour}</Text>
                  <View style={st.hourBarTrack}>
                    <View style={[st.hourBar, { width: `${h.pct}%`, backgroundColor: isPeak ? Colors.electric : Colors.bgElevated }]}>
                      {isPeak && <View style={st.hourBarGlow} />}
                    </View>
                  </View>
                  <Text style={[st.hourPct, { color: isPeak ? Colors.electric : Colors.textSecondary }]}>{h.pct}%</Text>
                  {isPeak && <PeakBadge />}
                </View>
              );
            })}
          </ShimmerCard>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bgPrimary },
  container: { flex: 1 },
  scroll: { paddingHorizontal: ScreenPadding.horizontal },
  title: { ...TextStyles.h1, color: Colors.textPrimary, paddingTop: Spacing.base, marginBottom: Spacing.sm },

  /* Period selector */
  periodOuter: { borderRadius: BorderRadius.lg, overflow: 'hidden', marginBottom: Spacing.base, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  periodBlur: { borderRadius: BorderRadius.lg, overflow: 'hidden' },
  periodInner: { flexDirection: 'row', backgroundColor: 'rgba(17, 24, 39, 0.6)', padding: 4 },
  periodBtn: { flex: 1, alignItems: 'center', paddingVertical: Spacing.sm, borderRadius: BorderRadius.md },
  periodBtnActive: { backgroundColor: Colors.electricMuted },
  periodText: { ...Fonts.bodyMedium, fontSize: TypeScale.bodySm, color: Colors.textSecondary },
  periodTextActive: { color: Colors.electric },

  /* Stats grid */
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.sm },
  statCard: { width: '48%' as any, flexGrow: 1, backgroundColor: Colors.bgCard, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border, padding: Spacing.md, gap: Spacing.xs, overflow: 'hidden' },
  statIconWrap: { width: 32, height: 32, borderRadius: BorderRadius.sm, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xs },
  statValue: { ...Fonts.monoBold, fontSize: TypeScale.h2, color: Colors.textPrimary, letterSpacing: -0.5 },
  statLabel: { ...Fonts.bodyMedium, fontSize: TypeScale.caption, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.3 },

  /* Shimmer */
  shimmer: { position: 'absolute', top: 0, bottom: 0, width: SCREEN_W * 0.6, zIndex: 1 },

  /* Sections */
  section: { marginTop: Spacing.lg },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  sectionDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.electric },
  sectionTitle: { ...Fonts.bodySemibold, fontSize: TypeScale.h4, color: Colors.textPrimary },
  card: { backgroundColor: Colors.bgCard, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border, padding: Spacing.base, overflow: 'hidden' },

  /* Bar chart */
  chartWrap: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm, height: 160 },
  barCol: { flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end' },
  barValue: { ...Fonts.mono, fontSize: TypeScale.tiny, color: Colors.textSecondary, marginBottom: Spacing.xs },
  barTrack: { flex: 1, width: '100%', justifyContent: 'flex-end', borderRadius: BorderRadius.sm, overflow: 'hidden' },
  barAnimWrap: { width: '100%', borderRadius: BorderRadius.sm, overflow: 'hidden' },
  bar: { flex: 1, borderRadius: BorderRadius.sm },
  barLabel: { ...Fonts.bodyMedium, fontSize: TypeScale.tiny, color: Colors.textMuted, marginTop: Spacing.xs },

  /* Call reasons */
  reasonRow: { paddingVertical: Spacing.md },
  reasonBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  reasonHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  reasonLabelRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  reasonDot: { width: 8, height: 8, borderRadius: 4 },
  reasonLabel: { ...Fonts.bodySemibold, fontSize: TypeScale.body, color: Colors.textPrimary },
  reasonPct: { ...Fonts.monoBold, fontSize: TypeScale.body },
  reasonBarTrack: { height: 6, backgroundColor: Colors.bgElevated, borderRadius: 3, overflow: 'hidden' },
  reasonBar: { height: '100%', borderRadius: 3 },

  /* Peak hours */
  hourRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm, gap: Spacing.sm },
  hourBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  hourLabel: { ...Fonts.mono, fontSize: TypeScale.caption, color: Colors.textMuted, width: 42 },
  hourBarTrack: { flex: 1, height: 8, backgroundColor: Colors.bgInput, borderRadius: 4, overflow: 'hidden' },
  hourBar: { height: '100%', borderRadius: 4 },
  hourBarGlow: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(14, 165, 233, 0.3)', borderRadius: 4 },
  hourPct: { ...Fonts.mono, fontSize: TypeScale.tiny, width: 30, textAlign: 'right' },
  peakBadge: { backgroundColor: Colors.electricMuted, borderRadius: BorderRadius.full, paddingHorizontal: 6, paddingVertical: 1 },
  peakText: { ...Fonts.monoBold, fontSize: 8, color: Colors.electric, letterSpacing: 0.5 },
});
