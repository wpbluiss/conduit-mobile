import { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Pressable, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLeadsStore } from '../../store/leadsStore';
import { Badge } from '../../components/ui/Badge';
import { Colors, StatusColors } from '../../constants/colors';
import { Fonts, TypeScale, TextStyles } from '../../constants/typography';
import { Spacing, BorderRadius, ScreenPadding } from '../../constants/layout';
import type { Lead } from '../../lib/api';

function getTimeAgo(d: string) {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

type FilterKey = 'all' | 'new' | 'contacted' | 'booked' | 'lost';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'new', label: 'New' },
  { key: 'contacted', label: 'Contacted' },
  { key: 'booked', label: 'Booked' },
  { key: 'lost', label: 'Lost' },
];

export default function CallsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { leads, isRefreshing, fetchLeads, refresh } = useLeadsStore();
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');

  useEffect(() => { fetchLeads(); }, []);
  const onRefresh = useCallback(async () => { await refresh(); }, []);

  const allLeads = leads;

  const filtered = useMemo(() => {
    let result = allLeads;
    if (activeFilter !== 'all') {
      result = result.filter((l) => l.status === activeFilter);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (l) => l.caller_name.toLowerCase().includes(q) || l.caller_phone.includes(q)
      );
    }
    return result;
  }, [allLeads, activeFilter, search]);

  const counts = useMemo(() => {
    const c = { all: allLeads.length, new: 0, contacted: 0, booked: 0, lost: 0 };
    allLeads.forEach((l) => { if (l.status in c) c[l.status as FilterKey]++; });
    return c;
  }, [allLeads]);

  return (
    <View style={[st.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={st.header}>
        <Text style={st.title}>Leads</Text>
        <Text style={st.subtitle}>{counts.all} total</Text>
      </View>

      {/* Search Bar */}
      <View style={st.searchWrap}>
        <Ionicons name="search" size={18} color={Colors.textMuted} style={st.searchIcon} />
        <TextInput
          style={st.searchInput}
          placeholder="Search by name or phone..."
          placeholderTextColor={Colors.textMuted}
          value={search}
          onChangeText={setSearch}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch('')} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
          </Pressable>
        )}
      </View>

      {/* Filter Pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={st.filtersScroll}
        contentContainerStyle={st.filtersContent}
      >
        {FILTERS.map((f) => {
          const active = activeFilter === f.key;
          return (
            <Pressable
              key={f.key}
              onPress={() => setActiveFilter(f.key)}
              style={[st.pill, active && st.pillActive]}
            >
              <Text style={[st.pillText, active && st.pillTextActive]}>
                {f.label}
              </Text>
              <View style={[st.pillCount, active && st.pillCountActive]}>
                <Text style={[st.pillCountText, active && st.pillCountTextActive]}>
                  {counts[f.key]}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Lead List */}
      <ScrollView
        style={st.list}
        contentContainerStyle={st.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={Colors.electric} />
        }
      >
        {filtered.length === 0 ? (
          <View style={st.emptyWrap}>
            <Ionicons name="search-outline" size={40} color={Colors.textMuted} />
            <Text style={st.emptyTitle}>No leads found</Text>
            <Text style={st.emptyText}>
              {search ? 'Try a different search term' : 'No leads match this filter'}
            </Text>
          </View>
        ) : (
          filtered.map((lead) => (
            <Pressable key={lead.id} onPress={() => router.push(`/lead/${lead.id}`)} style={st.leadCard}>
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
                    <Text style={st.leadName} numberOfLines={1}>{lead.caller_name}</Text>
                    <Text style={st.leadTime}>{getTimeAgo(lead.created_at)}</Text>
                  </View>
                  <Text style={st.leadSummary} numberOfLines={2}>{lead.summary}</Text>
                  <View style={st.leadBottom}>
                    <Text style={st.leadPhone}>{lead.caller_phone}</Text>
                    <Badge status={lead.status} size="sm" />
                  </View>
                </View>
              </View>
            </Pressable>
          ))
        )}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgPrimary },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingHorizontal: ScreenPadding.horizontal,
    paddingTop: Spacing.base,
    paddingBottom: Spacing.sm,
  },
  title: { ...TextStyles.h1, color: Colors.textPrimary },
  subtitle: { ...Fonts.mono, fontSize: TypeScale.bodySm, color: Colors.textMuted },

  // Search
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgInput,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginHorizontal: ScreenPadding.horizontal,
    paddingHorizontal: Spacing.md,
    height: 44,
  },
  searchIcon: { marginRight: Spacing.sm },
  searchInput: {
    flex: 1,
    ...Fonts.body,
    fontSize: TypeScale.body,
    color: Colors.textPrimary,
    height: '100%',
    paddingVertical: 0,
  },

  // Filter pills
  filtersScroll: { flexGrow: 0, marginTop: Spacing.md },
  filtersContent: {
    paddingHorizontal: ScreenPadding.horizontal,
    gap: Spacing.sm,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
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
  pillCount: {
    backgroundColor: Colors.bgElevated,
    borderRadius: BorderRadius.full,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  pillCountActive: { backgroundColor: 'rgba(14, 165, 233, 0.25)' },
  pillCountText: {
    ...Fonts.monoBold,
    fontSize: TypeScale.tiny,
    color: Colors.textMuted,
  },
  pillCountTextActive: { color: Colors.electricGlow },

  // List
  list: { flex: 1, marginTop: Spacing.md },
  listContent: { paddingHorizontal: ScreenPadding.horizontal, gap: Spacing.sm },

  // Empty state
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: Spacing['5xl'],
    gap: Spacing.sm,
  },
  emptyTitle: { ...TextStyles.h3, color: Colors.textSecondary },
  emptyText: { ...TextStyles.bodySm, color: Colors.textMuted },

  // Lead cards (matches dashboard pattern)
  leadCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
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
  leadNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leadName: {
    ...Fonts.bodySemibold,
    fontSize: TypeScale.body,
    color: Colors.textPrimary,
    flex: 1,
  },
  leadTime: {
    ...Fonts.mono,
    fontSize: TypeScale.tiny,
    color: Colors.textMuted,
    marginLeft: Spacing.sm,
  },
  leadSummary: {
    ...Fonts.body,
    fontSize: TypeScale.bodySm,
    color: Colors.textSecondary,
  },
  leadBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  leadPhone: { ...Fonts.mono, fontSize: TypeScale.caption, color: Colors.textMuted },
});
