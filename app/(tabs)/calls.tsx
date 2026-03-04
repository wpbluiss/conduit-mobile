import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
  TextInput,
  Animated,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLeadsStore } from '../../store/leadsStore';
import { Badge } from '../../components/ui/Badge';
import { useAppTheme } from '../../contexts/ThemeContext';
import { Colors, StatusColors } from '../../constants/colors';
import { Fonts, TypeScale, TextStyles } from '../../constants/typography';
import { Spacing, BorderRadius, ScreenPadding } from '../../constants/layout';
import type { Lead } from '../../lib/api';

const { width: SCREEN_W } = Dimensions.get('window');

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

// ── Count-Up Text ───────────────────────────────────────────

function CountUpText({ target, style }: { target: number; style: any }) {
  const [display, setDisplay] = useState(0);
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    anim.setValue(0);
    const listener = anim.addListener(({ value }) => setDisplay(Math.round(value)));
    Animated.timing(anim, { toValue: target, duration: 800, useNativeDriver: false }).start();
    return () => anim.removeListener(listener);
  }, [target]);

  return <Text style={style}>{display} total</Text>;
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

type FilterKey = 'all' | 'new' | 'contacted' | 'booked' | 'lost';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'new', label: 'New' },
  { key: 'contacted', label: 'Contacted' },
  { key: 'booked', label: 'Booked' },
  { key: 'lost', label: 'Lost' },
];

// ── Animated Lead Card ───────────────────────────────────────

function LeadCard({ lead, onPress, delay }: { lead: Lead; onPress: () => void; delay: number }) {
  const scale = useRef(new Animated.Value(1)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;
  const borderColor = STATUS_BORDER[lead.status] || Colors.border;

  useEffect(() => {
    Animated.timing(fadeIn, { toValue: 1, duration: 400, delay, useNativeDriver: true }).start();
  }, []);

  return (
    <Animated.View
      style={{
        opacity: fadeIn,
        transform: [{ translateY: fadeIn.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
      }}
    >
      <Pressable
        onPressIn={() => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, friction: 8 }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 8 }).start()}
        onPress={onPress}
      >
        <Animated.View style={[st.leadCard, { transform: [{ scale }] }]}>
          <ShimmerOverlay />
          <View style={[st.leadAccent, { backgroundColor: borderColor }]} />
          <View style={st.leadRow}>
            <LinearGradient colors={Colors.gradientElectric} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={st.leadAvatar}>
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
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

// ── Floating Empty Icon ──────────────────────────────────────

function FloatingEmpty({ search }: { search: string }) {
  const float = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(float, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(float, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={st.emptyWrap}>
      <Animated.View
        style={{ transform: [{ translateY: float.interpolate({ inputRange: [0, 1], outputRange: [0, -10] }) }] }}
      >
        <Ionicons name="search-outline" size={44} color={Colors.textMuted} />
      </Animated.View>
      <Text style={st.emptyTitle}>No leads found</Text>
      <Text style={st.emptyText}>
        {search ? 'Try a different search term' : 'No leads match this filter'}
      </Text>
    </View>
  );
}

// ── Filter Pill ──────────────────────────────────────────────

function FilterPill({
  label,
  count,
  active,
  onPress,
}: {
  label: string;
  count: number;
  active: boolean;
  onPress: () => void;
}) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const prevCount = useRef(count);

  useEffect(() => {
    if (count !== prevCount.current) {
      prevCount.current = count;
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.2, duration: 150, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
      ]).start();
    }
  }, [count]);

  return (
    <Pressable onPress={onPress} style={[st.pill, active && st.pillActive]}>
      <Text style={[st.pillText, active && st.pillTextActive]}>{label}</Text>
      <Animated.View style={[st.pillCount, active && st.pillCountActive, { transform: [{ scale: pulseAnim }] }]}>
        <Text style={[st.pillCountText, active && st.pillCountTextActive]}>{count}</Text>
      </Animated.View>
      {active && <View style={st.pillUnderline} />}
    </Pressable>
  );
}

// ── Main Screen ──────────────────────────────────────────────

export default function CallsScreen() {
  const { colors, isDark } = useAppTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { leads, isRefreshing, fetchLeads, refresh } = useLeadsStore();
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [focused, setFocused] = useState(false);
  const searchGlow = useRef(new Animated.Value(0)).current;

  useEffect(() => { fetchLeads(); }, []);
  const onRefresh = useCallback(async () => { await refresh(); }, []);

  useEffect(() => {
    Animated.timing(searchGlow, { toValue: focused ? 1 : 0, duration: 200, useNativeDriver: false }).start();
  }, [focused]);

  const allLeads = leads;

  const filtered = useMemo(() => {
    let result = allLeads;
    if (activeFilter !== 'all') result = result.filter((l) => l.status === activeFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((l) => l.caller_name.toLowerCase().includes(q) || l.caller_phone.includes(q));
    }
    return result;
  }, [allLeads, activeFilter, search]);

  const counts = useMemo(() => {
    const c = { all: allLeads.length, new: 0, contacted: 0, booked: 0, lost: 0 };
    allLeads.forEach((l) => { if (l.status in c) c[l.status as FilterKey]++; });
    return c;
  }, [allLeads]);

  const searchBorder = searchGlow.interpolate({
    inputRange: [0, 1],
    outputRange: [Colors.border as string, Colors.electric],
  });
  const searchShadow = searchGlow.interpolate({ inputRange: [0, 1], outputRange: [0, 0.25] });

  return (
    <View style={[st.root, { backgroundColor: colors.bgPrimary }]}>
      <LinearGradient
        colors={[Colors.bgPrimary, Colors.bgPrimary, 'rgba(14, 165, 233, 0.03)']}
        locations={[0, 0.7, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={[st.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={st.header}>
          <Text style={st.title}>Leads</Text>
          <CountUpText target={counts.all} style={st.subtitle} />
        </View>

        {/* Glassmorphism Search Bar */}
        <View style={st.searchOuter}>
          <Animated.View
            style={[
              st.searchWrap,
              {
                borderColor: searchBorder,
                shadowColor: Colors.electric,
                shadowOpacity: searchShadow,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 0 },
              },
            ]}
          >
            <Ionicons name="search" size={18} color={focused ? Colors.electric : Colors.textMuted} style={st.searchIcon} />
            <TextInput
              style={st.searchInput}
              placeholder="Search by name or phone..."
              placeholderTextColor={Colors.textMuted}
              value={search}
              onChangeText={setSearch}
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="search"
              selectionColor={Colors.electric}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
            />
            {search.length > 0 && (
              <Pressable onPress={() => setSearch('')} hitSlop={8}>
                <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
              </Pressable>
            )}
          </Animated.View>
        </View>

        {/* Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={st.filtersScroll}
          contentContainerStyle={st.filtersContent}
        >
          {FILTERS.map((f) => (
            <FilterPill
              key={f.key}
              label={f.label}
              count={counts[f.key]}
              active={activeFilter === f.key}
              onPress={() => setActiveFilter(f.key)}
            />
          ))}
        </ScrollView>

        {/* Lead List */}
        <ScrollView
          style={st.list}
          contentContainerStyle={st.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={Colors.electric} />}
        >
          {filtered.length === 0 ? (
            <FloatingEmpty search={search} />
          ) : (
            filtered.map((lead, i) => (
              <LeadCard
                key={lead.id}
                lead={lead}
                onPress={() => router.push(`/lead/${lead.id}`)}
                delay={i * 60}
              />
            ))
          )}
          <View style={{ height: 100 }} />
        </ScrollView>
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bgPrimary },
  container: { flex: 1 },

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

  /* Search */
  searchOuter: { paddingHorizontal: ScreenPadding.horizontal },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgInput,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    height: 46,
    elevation: 0,
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

  /* Filter pills */
  filtersScroll: { flexGrow: 0, marginTop: Spacing.md },
  filtersContent: { paddingHorizontal: ScreenPadding.horizontal, gap: Spacing.sm },
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
    position: 'relative',
  },
  pillActive: { backgroundColor: Colors.electricMuted, borderColor: Colors.borderElectric },
  pillText: { ...Fonts.bodyMedium, fontSize: TypeScale.bodySm, color: Colors.textSecondary },
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
  pillCountText: { ...Fonts.monoBold, fontSize: TypeScale.tiny, color: Colors.textMuted },
  pillCountTextActive: { color: Colors.electricGlow },
  pillUnderline: {
    position: 'absolute',
    bottom: -1,
    left: '20%' as any,
    right: '20%' as any,
    height: 2,
    backgroundColor: Colors.electric,
    borderRadius: 1,
  },

  /* List */
  list: { flex: 1, marginTop: Spacing.md },
  listContent: { paddingHorizontal: ScreenPadding.horizontal, gap: Spacing.sm },

  /* Empty */
  emptyWrap: { alignItems: 'center', justifyContent: 'center', paddingTop: Spacing['5xl'], gap: Spacing.sm },
  emptyTitle: { ...TextStyles.h3, color: Colors.textSecondary },
  emptyText: { ...Fonts.body, fontSize: TypeScale.bodySm, color: Colors.textMuted },

  /* Shimmer */
  shimmer: { position: 'absolute', top: 0, bottom: 0, width: SCREEN_W * 0.6, zIndex: 1 },

  /* Lead cards */
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
