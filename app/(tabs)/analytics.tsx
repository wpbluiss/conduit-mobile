import { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { Fonts, TypeScale, TextStyles } from '../../constants/typography';
import { Spacing, BorderRadius, ScreenPadding } from '../../constants/layout';

// ── Time periods ──────────────────────────────────────────────

type PeriodKey = 'today' | '7d' | '30d' | '90d';

const PERIODS: { key: PeriodKey; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: '7d', label: '7 Days' },
  { key: '30d', label: '30 Days' },
  { key: '90d', label: '90 Days' },
];

// ── Mock data by period ───────────────────────────────────────

const MOCK_STATS: Record<PeriodKey, { calls: number; leads: number; rate: number; revenue: number }> = {
  today: { calls: 18, leads: 14, rate: 78, revenue: 840 },
  '7d': { calls: 124, leads: 97, rate: 78, revenue: 5_820 },
  '30d': { calls: 489, leads: 391, rate: 80, revenue: 23_460 },
  '90d': { calls: 1_342, leads: 1_087, rate: 81, revenue: 65_220 },
};

const DAILY_LEADS: Record<PeriodKey, { day: string; value: number }[]> = {
  today: [
    { day: 'Mon', value: 15 }, { day: 'Tue', value: 22 }, { day: 'Wed', value: 18 },
    { day: 'Thu', value: 27 }, { day: 'Fri', value: 20 }, { day: 'Sat', value: 12 },
    { day: 'Sun', value: 14 },
  ],
  '7d': [
    { day: 'Mon', value: 15 }, { day: 'Tue', value: 22 }, { day: 'Wed', value: 18 },
    { day: 'Thu', value: 27 }, { day: 'Fri', value: 20 }, { day: 'Sat', value: 12 },
    { day: 'Sun', value: 14 },
  ],
  '30d': [
    { day: 'Mon', value: 68 }, { day: 'Tue', value: 74 }, { day: 'Wed', value: 71 },
    { day: 'Thu', value: 82 }, { day: 'Fri', value: 76 }, { day: 'Sat', value: 45 },
    { day: 'Sun', value: 38 },
  ],
  '90d': [
    { day: 'Mon', value: 192 }, { day: 'Tue', value: 210 }, { day: 'Wed', value: 198 },
    { day: 'Thu', value: 224 }, { day: 'Fri', value: 208 }, { day: 'Sat', value: 134 },
    { day: 'Sun', value: 112 },
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
  { hour: '8 AM', pct: 15 },
  { hour: '9 AM', pct: 45 },
  { hour: '10 AM', pct: 70 },
  { hour: '11 AM', pct: 85 },
  { hour: '12 PM', pct: 60 },
  { hour: '1 PM', pct: 50 },
  { hour: '2 PM', pct: 65 },
  { hour: '3 PM', pct: 80 },
  { hour: '4 PM', pct: 55 },
  { hour: '5 PM', pct: 90 },
  { hour: '6 PM', pct: 40 },
  { hour: '7 PM', pct: 20 },
];

// ── Helpers ───────────────────────────────────────────────────

function fmt(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`;
  return n.toString();
}

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

// ── Component ─────────────────────────────────────────────────

export default function AnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const [period, setPeriod] = useState<PeriodKey>('7d');

  const stats = MOCK_STATS[period];
  const dailyData = DAILY_LEADS[period];
  const maxDaily = useMemo(() => Math.max(...dailyData.map((d) => d.value)), [dailyData]);

  const statCards: { icon: IoniconsName; label: string; value: string; color: string; bg: string }[] = [
    { icon: 'call-outline', label: 'Total Calls', value: fmt(stats.calls), color: Colors.electric, bg: Colors.electricMuted },
    { icon: 'people-outline', label: 'Captured', value: fmt(stats.leads), color: Colors.success, bg: Colors.successGlow },
    { icon: 'trending-up-outline', label: 'Conversion', value: `${stats.rate}%`, color: Colors.cyan, bg: Colors.cyanGlow },
    { icon: 'cash-outline', label: 'Revenue', value: `$${stats.revenue.toLocaleString()}`, color: Colors.warning, bg: Colors.warningGlow },
  ];

  return (
    <ScrollView
      style={[st.container, { paddingTop: insets.top }]}
      contentContainerStyle={st.scroll}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <Text style={st.title}>Analytics</Text>

      {/* Period pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={st.pillsScroll}
        contentContainerStyle={st.pillsContent}
      >
        {PERIODS.map((p) => {
          const active = period === p.key;
          return (
            <Pressable
              key={p.key}
              onPress={() => setPeriod(p.key)}
              style={[st.pill, active && st.pillActive]}
            >
              <Text style={[st.pillText, active && st.pillTextActive]}>{p.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Summary Stats */}
      <View style={st.statsGrid}>
        {statCards.map((s) => (
          <View key={s.label} style={st.statCard}>
            <View style={[st.statIconWrap, { backgroundColor: s.bg }]}>
              <Ionicons name={s.icon} size={18} color={s.color} />
            </View>
            <Text style={st.statValue}>{s.value}</Text>
            <Text style={st.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Bar Chart — Leads per Day */}
      <View style={st.section}>
        <Text style={st.sectionTitle}>Leads by Day</Text>
        <View style={st.card}>
          <View style={st.chartWrap}>
            {dailyData.map((d) => {
              const heightPct = maxDaily > 0 ? (d.value / maxDaily) * 100 : 0;
              return (
                <View key={d.day} style={st.barCol}>
                  <Text style={st.barValue}>{d.value}</Text>
                  <View style={st.barTrack}>
                    <LinearGradient
                      colors={Colors.gradientElectric}
                      start={{ x: 0.5, y: 1 }}
                      end={{ x: 0.5, y: 0 }}
                      style={[st.bar, { height: `${Math.max(heightPct, 4)}%` }]}
                    />
                  </View>
                  <Text style={st.barLabel}>{d.day}</Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>

      {/* Top Call Reasons */}
      <View style={st.section}>
        <Text style={st.sectionTitle}>Top Call Reasons</Text>
        <View style={st.card}>
          {CALL_REASONS.map((r, i) => (
            <View key={r.label} style={[st.reasonRow, i < CALL_REASONS.length - 1 && st.reasonBorder]}>
              <View style={st.reasonHeader}>
                <View style={st.reasonLabelRow}>
                  <View style={[st.reasonDot, { backgroundColor: r.color }]} />
                  <Text style={st.reasonLabel}>{r.label}</Text>
                </View>
                <Text style={[st.reasonPct, { color: r.color }]}>{r.pct}%</Text>
              </View>
              <View style={st.reasonBarTrack}>
                <View style={[st.reasonBar, { width: `${r.pct}%`, backgroundColor: r.color }]} />
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Call Volume by Hour */}
      <View style={st.section}>
        <Text style={st.sectionTitle}>Call Volume by Hour</Text>
        <View style={st.card}>
          {PEAK_HOURS.map((h, i) => {
            const isPeak = h.pct >= 80;
            const barColor = isPeak ? Colors.electric : Colors.bgElevated;
            const textColor = isPeak ? Colors.electric : Colors.textSecondary;
            return (
              <View key={h.hour} style={[st.hourRow, i < PEAK_HOURS.length - 1 && st.hourBorder]}>
                <Text style={[st.hourLabel, isPeak && { color: Colors.textPrimary }]}>{h.hour}</Text>
                <View style={st.hourBarTrack}>
                  <View style={[st.hourBar, { width: `${h.pct}%`, backgroundColor: barColor }]}>
                    {isPeak && <View style={st.hourBarGlow} />}
                  </View>
                </View>
                <Text style={[st.hourPct, { color: textColor }]}>{h.pct}%</Text>
                {isPeak && (
                  <View style={st.peakBadge}>
                    <Text style={st.peakText}>PEAK</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

// ── Styles ────────────────────────────────────────────────────

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgPrimary },
  scroll: { paddingHorizontal: ScreenPadding.horizontal },

  title: {
    ...TextStyles.h1,
    color: Colors.textPrimary,
    paddingTop: Spacing.base,
    marginBottom: Spacing.sm,
  },

  // Period pills
  pillsScroll: { flexGrow: 0, marginBottom: Spacing.base },
  pillsContent: { gap: Spacing.sm },
  pill: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
  },
  pillActive: {
    backgroundColor: Colors.electricMuted,
    borderColor: Colors.borderElectric,
  },
  pillText: {
    ...Fonts.bodyMedium,
    fontSize: TypeScale.bodySm,
    color: Colors.textSecondary,
  },
  pillTextActive: { color: Colors.electric },

  // Stat cards grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  statCard: {
    width: '48%' as any,
    flexGrow: 1,
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  statIconWrap: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  statValue: {
    ...Fonts.monoBold,
    fontSize: TypeScale.h2,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  statLabel: {
    ...Fonts.bodyMedium,
    fontSize: TypeScale.caption,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },

  // Sections
  section: { marginTop: Spacing.lg },
  sectionTitle: {
    ...Fonts.bodySemibold,
    fontSize: TypeScale.h4,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },

  // Shared card
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.base,
  },

  // Bar chart
  chartWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
    height: 160,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  barValue: {
    ...Fonts.mono,
    fontSize: TypeScale.tiny,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  barTrack: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
  },
  bar: {
    width: '100%',
    borderRadius: BorderRadius.sm,
    minHeight: 4,
  },
  barLabel: {
    ...Fonts.bodyMedium,
    fontSize: TypeScale.tiny,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },

  // Call reasons
  reasonRow: {
    paddingVertical: Spacing.md,
  },
  reasonBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  reasonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  reasonLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  reasonDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  reasonLabel: {
    ...Fonts.bodySemibold,
    fontSize: TypeScale.body,
    color: Colors.textPrimary,
  },
  reasonPct: {
    ...Fonts.monoBold,
    fontSize: TypeScale.body,
  },
  reasonBarTrack: {
    height: 6,
    backgroundColor: Colors.bgElevated,
    borderRadius: 3,
    overflow: 'hidden',
  },
  reasonBar: {
    height: '100%',
    borderRadius: 3,
  },

  // Call volume by hour
  hourRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  hourBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  hourLabel: {
    ...Fonts.mono,
    fontSize: TypeScale.caption,
    color: Colors.textMuted,
    width: 42,
  },
  hourBarTrack: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.bgInput,
    borderRadius: 4,
    overflow: 'hidden',
  },
  hourBar: {
    height: '100%',
    borderRadius: 4,
  },
  hourBarGlow: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(14, 165, 233, 0.3)',
    borderRadius: 4,
  },
  hourPct: {
    ...Fonts.mono,
    fontSize: TypeScale.tiny,
    width: 30,
    textAlign: 'right',
  },
  peakBadge: {
    backgroundColor: Colors.electricMuted,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  peakText: {
    ...Fonts.monoBold,
    fontSize: 8,
    color: Colors.electric,
    letterSpacing: 0.5,
  },
});
