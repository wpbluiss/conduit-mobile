import { useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, interpolate } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLeadsStore } from '../../store/leadsStore';
import { useAuthStore } from '../../store/authStore';
import { Badge } from '../../components/ui/Badge';
import { Colors, StatusColors } from '../../constants/colors';
import { Fonts, TypeScale, TextStyles } from '../../constants/typography';
import { Spacing, BorderRadius, ScreenPadding } from '../../constants/layout';

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

export default function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { leads, dashboardStats, agentStatus, isRefreshing, fetchLeads, fetchDashboard, fetchAgentStatus, refresh } = useLeadsStore();

  const glowPulse = useSharedValue(0);

  useEffect(() => {
    fetchDashboard();
    fetchLeads('today');
    fetchAgentStatus();
    glowPulse.value = withRepeat(withTiming(1, { duration: 2000 }), -1, true);
  }, []);

  const onRefresh = useCallback(async () => { await refresh(); }, []);

  const stats = dashboardStats || { leads_today: 0, revenue_saved: 0, capture_rate: 0 };
  const recentLeads = leads.slice(0, 5);
  const meta = user?.user_metadata;
  const name = meta?.owner_name || meta?.full_name || meta?.name || meta?.display_name || 'Luis';
  const biz = meta?.business_name || '';
  const active = agentStatus?.is_active ?? true;

  const agentGlowStyle = useAnimatedStyle(() => ({
    borderColor: active
      ? `rgba(16, 185, 129, ${interpolate(glowPulse.value, [0, 1], [0.15, 0.5])})`
      : 'rgba(239, 68, 68, 0.15)',
    shadowOpacity: active ? interpolate(glowPulse.value, [0, 1], [0, 0.4]) : 0,
  }));

  return (
    <ScrollView
      style={[st.container, { paddingTop: insets.top }]}
      contentContainerStyle={st.scroll}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={Colors.electric} />}
    >
      {/* Header */}
      <View style={st.header}>
        <View style={st.headerLeft}>
          <Text style={st.greeting}>{getGreeting()}, {name}</Text>
          {biz ? <Text style={st.bizName}>{biz}</Text> : null}
        </View>
      </View>

      {/* Agent Status */}
      <Animated.View style={[st.card, st.agentCard, agentGlowStyle]}>
        <View style={st.agentRow}>
          <View style={st.agentLeft}>
            <View style={[st.agentDot, { backgroundColor: active ? Colors.success : Colors.danger }]} />
            <View>
              <Text style={st.agentTitle}>AI Agent: {active ? 'Active' : 'Inactive'}</Text>
              <Text style={st.agentSub}>{active ? 'Answering calls 24/7' : 'Agent is paused'}</Text>
            </View>
          </View>
          <View style={[st.statusPill, { backgroundColor: active ? Colors.successGlow : Colors.dangerGlow }]}>
            <Text style={[st.statusPillText, { color: active ? Colors.success : Colors.danger }]}>
              {active ? 'LIVE' : 'OFF'}
            </Text>
          </View>
        </View>
      </Animated.View>

      {/* Stat Cards */}
      <View style={st.statsRow}>
        <LinearGradient colors={[Colors.bgCard, 'rgba(14, 165, 233, 0.12)']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={[st.statCard, { borderColor: 'rgba(14, 165, 233, 0.15)' }]}>
          <View style={[st.statAccent, { backgroundColor: Colors.electric }]} />
          <Text style={st.statLabel}>LEADS</Text>
          <Text style={st.statValue}>{stats.leads_today}</Text>
          <View style={[st.trendBadge, { backgroundColor: Colors.successGlow }]}>
            <Text style={[st.trendText, { color: Colors.success }]}>↑ 18%</Text>
          </View>
        </LinearGradient>
        <LinearGradient colors={[Colors.bgCard, 'rgba(16, 185, 129, 0.12)']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={[st.statCard, { borderColor: 'rgba(16, 185, 129, 0.15)' }]}>
          <View style={[st.statAccent, { backgroundColor: Colors.success }]} />
          <Text style={st.statLabel}>REVENUE</Text>
          <Text style={st.statValue}>${stats.revenue_saved.toLocaleString()}</Text>
        </LinearGradient>
        <LinearGradient colors={[Colors.bgCard, 'rgba(6, 182, 212, 0.12)']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={[st.statCard, { borderColor: 'rgba(6, 182, 212, 0.15)' }]}>
          <View style={[st.statAccent, { backgroundColor: Colors.cyan }]} />
          <Text style={st.statLabel}>CAPTURE</Text>
          <Text style={st.statValue}>{stats.capture_rate}%</Text>
        </LinearGradient>
      </View>

      {/* Recent Activity Header */}
      <View style={st.sectionHeader}>
        <Text style={st.sectionTitle}>Recent Activity</Text>
        <Pressable onPress={() => router.push('/(tabs)/calls')}>
          <Text style={st.viewAll}>View All</Text>
        </Pressable>
      </View>

      {/* Lead Cards */}
      {recentLeads.map((lead) => (
        <Pressable key={lead.id} onPress={() => router.push(`/lead/${lead.id}`)} style={st.leadCard}>
          <View style={st.leadRow}>
            <LinearGradient colors={Colors.gradientElectric} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={st.leadAvatar}>
              <Text style={st.leadAvatarText}>{lead.caller_name.charAt(0)}</Text>
            </LinearGradient>
            <View style={st.leadInfo}>
              <View style={st.leadNameRow}>
                <Text style={st.leadName} numberOfLines={1}>{lead.caller_name}</Text>
                <Text style={st.leadTime}>{getTimeAgo(lead.created_at)}</Text>
              </View>
              <Text style={st.leadSummary} numberOfLines={1}>{lead.summary}</Text>
              <View style={st.leadBottom}>
                <Text style={st.leadPhone}>{lead.caller_phone}</Text>
                <Badge status={lead.status} size="sm" />
              </View>
            </View>
          </View>
        </Pressable>
      ))}

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgPrimary },
  scroll: { paddingHorizontal: ScreenPadding.horizontal, gap: Spacing.base },

  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingTop: Spacing.base, marginBottom: Spacing.sm },
  headerLeft: { flex: 1 },
  greeting: { ...TextStyles.h2, color: Colors.textPrimary },
  bizName: { ...Fonts.body, fontSize: TypeScale.bodySm, color: Colors.textMuted, marginTop: 2 },

  // Shared card base
  card: { backgroundColor: Colors.bgCard, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border, padding: Spacing.base },

  // Agent status
  agentCard: { borderWidth: 1, shadowColor: Colors.success, shadowOffset: { width: 0, height: 0 }, shadowRadius: 12, elevation: 4 },
  agentRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  agentLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  agentDot: { width: 10, height: 10, borderRadius: 5 },
  agentTitle: { ...Fonts.bodySemibold, fontSize: TypeScale.body, color: Colors.textPrimary },
  agentSub: { ...Fonts.body, fontSize: TypeScale.caption, color: Colors.textMuted, marginTop: 1 },
  statusPill: { paddingHorizontal: Spacing.md, paddingVertical: 4, borderRadius: BorderRadius.full },
  statusPillText: { ...Fonts.monoBold, fontSize: TypeScale.tiny, letterSpacing: 1 },

  // Stat cards
  statsRow: { flexDirection: 'row', gap: Spacing.md },
  statCard: { flex: 1, backgroundColor: Colors.bgCard, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border, padding: Spacing.md, minHeight: 100, justifyContent: 'space-between', overflow: 'hidden' },
  statAccent: { position: 'absolute', top: 0, left: 0, right: 0, height: 2, borderTopLeftRadius: BorderRadius.lg, borderTopRightRadius: BorderRadius.lg },
  statLabel: { ...Fonts.bodyMedium, fontSize: TypeScale.caption, color: Colors.textMuted, letterSpacing: 0.5, marginBottom: Spacing.sm },
  statValue: { ...Fonts.monoBold, fontSize: TypeScale.stat, color: Colors.textPrimary, letterSpacing: -0.5 },
  trendBadge: { alignSelf: 'flex-start', paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.sm, marginTop: Spacing.xs },
  trendText: { ...Fonts.mono, fontSize: TypeScale.tiny, fontWeight: '600' },

  // Section header
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.sm },
  sectionTitle: { ...Fonts.bodySemibold, fontSize: TypeScale.h4, color: Colors.textPrimary },
  viewAll: { ...Fonts.bodyMedium, fontSize: TypeScale.bodySm, color: Colors.electric },

  // Lead cards
  leadCard: { backgroundColor: Colors.bgCard, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border, padding: Spacing.md },
  leadRow: { flexDirection: 'row', gap: Spacing.md },
  leadAvatar: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  leadAvatarText: { ...Fonts.displayBold, fontSize: TypeScale.h3, color: '#fff' },
  leadInfo: { flex: 1, gap: 3 },
  leadNameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  leadName: { ...Fonts.bodySemibold, fontSize: TypeScale.body, color: Colors.textPrimary, flex: 1 },
  leadTime: { ...Fonts.mono, fontSize: TypeScale.tiny, color: Colors.textMuted, marginLeft: Spacing.sm },
  leadSummary: { ...Fonts.body, fontSize: TypeScale.bodySm, color: Colors.textSecondary },
  leadBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 },
  leadPhone: { ...Fonts.mono, fontSize: TypeScale.caption, color: Colors.textMuted },
});
