import { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Animated,
  Dimensions,
  Share,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../contexts/ThemeContext';
import { Colors } from '../../constants/colors';
import { Fonts, TypeScale, TextStyles } from '../../constants/typography';
import { Spacing, BorderRadius, ScreenPadding } from '../../constants/layout';
import { api, type AffiliateStats, type AffiliateReferral } from '../../lib/api';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';

const { width: SCREEN_W } = Dimensions.get('window');

// ── Mock Data ────────────────────────────────────────────────

const MOCK_STATS: AffiliateStats = {
  referral_code: 'CHRIS20',
  total_referrals: 12,
  active_subscriptions: 8,
  total_earned: 847.20,
  next_payout_amount: 214.40,
  next_payout_date: '2026-03-15',
  referrals: [
    { id: '1', name: 'Sarah Johnson', email: 'sarah@example.com', date: '2026-02-18', plan: 'business', status: 'active', commission: 39.80 },
    { id: '2', name: 'Mike Chen', email: 'mike@example.com', date: '2026-02-10', plan: 'solo', status: 'active', commission: 7.80 },
    { id: '3', name: 'Emily Davis', email: 'emily@example.com', date: '2026-01-25', plan: 'professional', status: 'active', commission: 59.80 },
    { id: '4', name: 'James Wilson', email: 'james@example.com', date: '2026-01-12', plan: 'solo', status: 'trial', commission: 0 },
    { id: '5', name: 'Lisa Park', email: 'lisa@example.com', date: '2025-12-20', plan: 'business', status: 'churned', commission: 0 },
  ],
};

// ── Animated Count-Up ────────────────────────────────────────

function useCountUp(target: number, duration = 1200) {
  const [display, setDisplay] = useState(0);
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    anim.setValue(0);
    const listener = anim.addListener(({ value }) => setDisplay(Math.round(value * 100) / 100));
    Animated.timing(anim, { toValue: target, duration, useNativeDriver: false }).start();
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

// ── Stat Card ────────────────────────────────────────────────

function StatCard({
  label, value, prefix, suffix, gradientEnd, borderColor, accentColor,
}: {
  label: string; value: number; prefix?: string; suffix?: string;
  gradientEnd: string; borderColor: string; accentColor: string;
}) {
  const count = useCountUp(value, 1200);
  const formatted = prefix === '$'
    ? count.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : Math.round(count).toLocaleString();

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
      <Text style={st.statValue}>{prefix}{formatted}{suffix}</Text>
    </LinearGradient>
  );
}

// ── Commission Tier Row ──────────────────────────────────────

function TierRow({ plan, price, earning }: { plan: string; price: string; earning: string }) {
  return (
    <View style={st.tierRow}>
      <View style={st.tierLeft}>
        <View style={st.tierDot} />
        <Text style={st.tierPlan}>{plan}</Text>
      </View>
      <View style={st.tierRight}>
        <Text style={st.tierPrice}>{price}</Text>
        <Ionicons name="arrow-forward" size={14} color={Colors.textMuted} />
        <Text style={st.tierEarning}>{earning}</Text>
      </View>
    </View>
  );
}

// ── Referral Row Card ────────────────────────────────────────

function ReferralCard({ referral }: { referral: AffiliateReferral }) {
  const scale = useRef(new Animated.Value(1)).current;
  const statusColor = referral.status === 'active' ? Colors.success
    : referral.status === 'trial' ? Colors.warning : Colors.danger;
  const statusBg = referral.status === 'active' ? Colors.successGlow
    : referral.status === 'trial' ? Colors.warningGlow : Colors.dangerGlow;

  return (
    <Pressable
      onPressIn={() => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, friction: 8 }).start()}
      onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 8 }).start()}
    >
      <Animated.View style={[st.refCard, { transform: [{ scale }] }]}>
        <ShimmerOverlay />
        <View style={st.refRow}>
          <LinearGradient colors={Colors.gradientElectric} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={st.refAvatar}>
            <Text style={st.refAvatarText}>{referral.name.charAt(0)}</Text>
          </LinearGradient>
          <View style={st.refInfo}>
            <View style={st.refNameRow}>
              <Text style={st.refName} numberOfLines={1}>{referral.name}</Text>
              <View style={[st.refStatusPill, { backgroundColor: statusBg }]}>
                <Text style={[st.refStatusText, { color: statusColor }]}>
                  {referral.status.toUpperCase()}
                </Text>
              </View>
            </View>
            <View style={st.refMeta}>
              <Text style={st.refPlan}>{referral.plan === 'business' ? 'Business' : referral.plan === 'professional' ? 'Professional' : referral.plan === 'enterprise' ? 'Enterprise' : 'Solo Operator'}</Text>
              <Text style={st.refDate}>{new Date(referral.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</Text>
            </View>
            <View style={st.refBottom}>
              <Text style={st.refEmail} numberOfLines={1}>{referral.email}</Text>
              <Text style={[st.refCommission, { color: referral.commission > 0 ? Colors.success : Colors.textMuted }]}>
                {referral.commission > 0 ? `+$${referral.commission.toFixed(2)}/mo` : '—'}
              </Text>
            </View>
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
}

// ── How It Works Step ────────────────────────────────────────

function StepItem({ num, title, desc }: { num: number; title: string; desc: string }) {
  return (
    <View style={st.stepRow}>
      <LinearGradient colors={Colors.gradientElectric} style={st.stepNum}>
        <Text style={st.stepNumText}>{num}</Text>
      </LinearGradient>
      <View style={st.stepText}>
        <Text style={st.stepTitle}>{title}</Text>
        <Text style={st.stepDesc}>{desc}</Text>
      </View>
    </View>
  );
}

// ── Main Screen ──────────────────────────────────────────────

export default function AffiliatesScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { user, isGuestMode } = useAuthStore();
  const [data, setData] = useState<AffiliateStats>(MOCK_STATS);
  const [copied, setCopied] = useState(false);
  const [howOpen, setHowOpen] = useState(false);

  useEffect(() => {
    if (isGuestMode) return; // Keep mock data for guests

    (async () => {
      // Try Supabase first
      try {
        const userId = user?.id;
        if (userId) {
          const { data: refData, error } = await supabase
            .from('referrals')
            .select('*')
            .eq('referrer_id', userId)
            .order('created_at', { ascending: false });

          if (!error && refData && refData.length > 0) {
            const referrals: AffiliateReferral[] = refData.map((r: any) => ({
              id: r.id,
              name: r.referred_name || 'Unknown',
              email: r.referred_email || '',
              date: r.created_at,
              plan: r.plan || 'solo',
              status: r.status || 'trial',
              commission: r.commission || 0,
            }));

            const activeRefs = referrals.filter((r) => r.status === 'active');
            setData({
              referral_code: user?.user_metadata?.referral_code || MOCK_STATS.referral_code,
              total_referrals: referrals.length,
              active_subscriptions: activeRefs.length,
              total_earned: referrals.reduce((sum, r) => sum + r.commission, 0),
              next_payout_amount: activeRefs.reduce((sum, r) => sum + r.commission, 0),
              next_payout_date: MOCK_STATS.next_payout_date,
              referrals,
            });
            return;
          }
        }
      } catch (err) {
        console.warn('[Affiliates] Supabase query failed:', err);
      }

      // Fallback: try API
      try {
        const stats = await api.getAffiliateStats();
        setData(stats);
      } catch {
        // Keep mock data
      }
    })();
  }, []);

  const code = data.referral_code;

  const handleCopy = useCallback(async () => {
    await Clipboard.setStringAsync(code);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  const handleShare = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await Share.share({
      message: `Try Conduit AI - your personal AI assistant that never misses a call. Use my code ${code} for $10 off! https://conduitai.io?ref=${code}`,
    });
  }, [code]);

  return (
    <View style={[st.root, { backgroundColor: colors.bgPrimary }]}>
      <LinearGradient
        colors={[Colors.bgPrimary, Colors.bgPrimary, 'rgba(14, 165, 233, 0.03)']}
        locations={[0, 0.6, 1]}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        style={[st.container, { paddingTop: insets.top }]}
        contentContainerStyle={st.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={st.headerOuter}>
          <BlurView intensity={25} tint="dark" style={st.headerBlur}>
            <View style={st.headerInner}>
              <View style={st.headerTop}>
                <View style={{ flex: 1 }}>
                  <Text style={st.headerTitle}>Referrals</Text>
                  <Text style={st.headerSub}>Earn 20% commission on every referral</Text>
                </View>
                <Pressable onPress={handleShare} style={st.shareBtn}>
                  <LinearGradient colors={Colors.gradientElectric} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={st.shareBtnGrad}>
                    <Ionicons name="share-outline" size={18} color="#fff" />
                    <Text style={st.shareBtnText}>Share</Text>
                  </LinearGradient>
                </Pressable>
              </View>
              <Pressable onPress={handleCopy} style={st.codePill}>
                <Ionicons name={copied ? 'checkmark-circle' : 'copy-outline'} size={16} color={copied ? Colors.success : Colors.electric} />
                <Text style={[st.codeText, copied && { color: Colors.success }]}>
                  {copied ? 'Copied!' : code}
                </Text>
              </Pressable>
            </View>
          </BlurView>
        </View>

        {/* ── Stat Cards ── */}
        <View style={st.statsRow}>
          <StatCard
            label="REFERRALS"
            value={data.total_referrals}
            gradientEnd="rgba(14, 165, 233, 0.12)"
            borderColor="rgba(14, 165, 233, 0.15)"
            accentColor={Colors.electric}
          />
          <StatCard
            label="ACTIVE"
            value={data.active_subscriptions}
            gradientEnd="rgba(16, 185, 129, 0.12)"
            borderColor="rgba(16, 185, 129, 0.15)"
            accentColor={Colors.success}
          />
          <StatCard
            label="EARNED"
            value={data.total_earned}
            prefix="$"
            gradientEnd="rgba(6, 182, 212, 0.12)"
            borderColor="rgba(6, 182, 212, 0.15)"
            accentColor={Colors.cyan}
          />
        </View>

        {/* ── Commission Breakdown ── */}
        <View style={st.sectionHeader}>
          <View style={st.sectionLeft}>
            <View style={st.sectionDot} />
            <Text style={st.sectionTitle}>Commission Breakdown</Text>
          </View>
        </View>

        <View style={st.commCard}>
          <ShimmerOverlay />
          <Text style={st.commDesc}>
            You earn <Text style={{ color: Colors.electric }}>20% recurring commission</Text> for every person who subscribes using your code
          </Text>
          <View style={st.commDivider} />
          <TierRow plan="Solo Operator" price="$39/mo" earning="You earn $7.80/mo" />
          <TierRow plan="Business (Salons)" price="$199/mo" earning="You earn $39.80/mo" />
          <TierRow plan="Professional (HVAC)" price="$299/mo" earning="You earn $59.80/mo" />
        </View>

        {/* ── Referral History ── */}
        <View style={st.sectionHeader}>
          <View style={st.sectionLeft}>
            <View style={st.sectionDot} />
            <Text style={st.sectionTitle}>Referral History</Text>
          </View>
        </View>

        {data.referrals.map((ref) => (
          <ReferralCard key={ref.id} referral={ref} />
        ))}

        {/* ── Payout Section ── */}
        <View style={st.sectionHeader}>
          <View style={st.sectionLeft}>
            <View style={st.sectionDot} />
            <Text style={st.sectionTitle}>Payouts</Text>
          </View>
        </View>

        <View style={st.payoutCard}>
          <ShimmerOverlay />
          <View style={st.payoutRow}>
            <View>
              <Text style={st.payoutLabel}>Next Payout</Text>
              <Text style={st.payoutAmount}>${data.next_payout_amount.toFixed(2)}</Text>
            </View>
            <View style={st.payoutDateCol}>
              <Text style={st.payoutLabel}>Estimated Date</Text>
              <Text style={st.payoutDate}>
                {new Date(data.next_payout_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </Text>
            </View>
          </View>
          <Pressable style={st.payoutBtn} disabled>
            <Text style={st.payoutBtnText}>Request Payout</Text>
            <View style={st.comingSoonBadge}>
              <Text style={st.comingSoonText}>COMING SOON</Text>
            </View>
          </Pressable>
        </View>

        {/* ── How It Works ── */}
        <Pressable
          onPress={() => {
            Haptics.selectionAsync();
            setHowOpen(!howOpen);
          }}
          style={st.howHeader}
        >
          <View style={st.sectionLeft}>
            <View style={st.sectionDot} />
            <Text style={st.sectionTitle}>How It Works</Text>
          </View>
          <Ionicons name={howOpen ? 'chevron-up' : 'chevron-down'} size={20} color={Colors.textMuted} />
        </Pressable>

        {howOpen && (
          <View style={st.howCard}>
            <ShimmerOverlay />
            <StepItem num={1} title="Share your code" desc="Send your unique referral code to friends, clients, or your network" />
            <StepItem num={2} title="They sign up" desc="When they subscribe using your code, they get $10 off their first month" />
            <StepItem num={3} title="You earn 20% forever" desc="Earn recurring commission for as long as they stay subscribed" />
            <View style={st.howDivider} />
            <Text style={st.termsLink}>View full affiliate terms →</Text>
          </View>
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

  /* ── Shimmer ── */
  shimmer: { position: 'absolute', top: 0, bottom: 0, width: SCREEN_W * 0.6, zIndex: 1 },

  /* ── Glassmorphism Header ── */
  headerOuter: {
    borderRadius: BorderRadius.xl, overflow: 'hidden', marginTop: Spacing.base,
    borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.06)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 6,
  },
  headerBlur: { overflow: 'hidden', borderRadius: BorderRadius.xl },
  headerInner: {
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.lg,
    backgroundColor: 'rgba(17, 24, 39, 0.65)',
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerTitle: { ...TextStyles.h1, color: Colors.textPrimary },
  headerSub: { ...Fonts.body, fontSize: TypeScale.bodySm, color: Colors.textSecondary, marginTop: 2 },
  shareBtn: { borderRadius: BorderRadius.md, overflow: 'hidden' },
  shareBtnGrad: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs + 2,
    paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.md,
  },
  shareBtnText: { ...Fonts.bodySemibold, fontSize: TypeScale.bodySm, color: '#fff' },
  codePill: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start',
    gap: Spacing.sm, marginTop: Spacing.md,
    backgroundColor: 'rgba(14, 165, 233, 0.1)', borderWidth: 1, borderColor: Colors.electricBorder,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  codeText: { ...Fonts.monoBold, fontSize: TypeScale.body, color: Colors.electric, letterSpacing: 1.5 },

  /* ── Stats ── */
  statsRow: { flexDirection: 'row', gap: Spacing.sm },
  statCard: {
    flex: 1, backgroundColor: Colors.bgCard, borderRadius: BorderRadius.lg,
    borderWidth: 1, padding: Spacing.md, minHeight: 104,
    justifyContent: 'space-between', overflow: 'hidden',
  },
  statAccent: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 2,
    borderTopLeftRadius: BorderRadius.lg, borderTopRightRadius: BorderRadius.lg,
  },
  statLabel: {
    ...Fonts.bodyMedium, fontSize: TypeScale.tiny, color: Colors.textMuted,
    letterSpacing: 0.8, marginBottom: Spacing.sm,
  },
  statValue: {
    ...Fonts.monoBold, fontSize: TypeScale.stat, color: Colors.textPrimary, letterSpacing: -0.5,
  },

  /* ── Section Header ── */
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginTop: Spacing.sm,
  },
  sectionLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  sectionDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.electric },
  sectionTitle: { ...Fonts.bodySemibold, fontSize: TypeScale.h4, color: Colors.textPrimary },

  /* ── Commission Card ── */
  commCard: {
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.border, padding: Spacing.base,
    overflow: 'hidden',
  },
  commDesc: {
    ...Fonts.body, fontSize: TypeScale.bodySm, color: Colors.textSecondary, lineHeight: 20,
  },
  commDivider: {
    height: 1, backgroundColor: Colors.border, marginVertical: Spacing.md,
  },
  tierRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  tierLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  tierDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: Colors.electric },
  tierPlan: { ...Fonts.bodySemibold, fontSize: TypeScale.bodySm, color: Colors.textPrimary },
  tierRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  tierPrice: { ...Fonts.mono, fontSize: TypeScale.caption, color: Colors.textMuted },
  tierEarning: { ...Fonts.monoBold, fontSize: TypeScale.caption, color: Colors.success },

  /* ── Referral Cards ── */
  refCard: {
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.border, padding: Spacing.md,
    overflow: 'hidden',
  },
  refRow: { flexDirection: 'row', gap: Spacing.md },
  refAvatar: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  refAvatarText: { ...Fonts.displayBold, fontSize: TypeScale.h3, color: '#fff' },
  refInfo: { flex: 1, gap: 3 },
  refNameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  refName: { ...Fonts.bodySemibold, fontSize: TypeScale.body, color: Colors.textPrimary, flex: 1 },
  refStatusPill: {
    paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.full,
  },
  refStatusText: { ...Fonts.monoBold, fontSize: TypeScale.tiny, letterSpacing: 0.5 },
  refMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  refPlan: { ...Fonts.body, fontSize: TypeScale.bodySm, color: Colors.textSecondary },
  refDate: { ...Fonts.mono, fontSize: TypeScale.caption, color: Colors.textMuted },
  refBottom: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2,
  },
  refEmail: { ...Fonts.mono, fontSize: TypeScale.caption, color: Colors.textMuted, flex: 1 },
  refCommission: { ...Fonts.monoBold, fontSize: TypeScale.bodySm },

  /* ── Payout Card ── */
  payoutCard: {
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.border, padding: Spacing.base,
    overflow: 'hidden',
  },
  payoutRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
  },
  payoutLabel: {
    ...Fonts.bodyMedium, fontSize: TypeScale.tiny, color: Colors.textMuted,
    letterSpacing: 0.8, marginBottom: Spacing.xs,
  },
  payoutAmount: {
    ...Fonts.monoBold, fontSize: TypeScale.h2, color: Colors.success, letterSpacing: -0.5,
  },
  payoutDateCol: { alignItems: 'flex-end' },
  payoutDate: { ...Fonts.mono, fontSize: TypeScale.body, color: Colors.textPrimary },
  payoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, marginTop: Spacing.base,
    backgroundColor: Colors.bgElevated, borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md, opacity: 0.6,
  },
  payoutBtnText: { ...Fonts.bodySemibold, fontSize: TypeScale.body, color: Colors.textDisabled },
  comingSoonBadge: {
    backgroundColor: Colors.electricMuted, paddingHorizontal: Spacing.sm,
    paddingVertical: 2, borderRadius: BorderRadius.sm,
  },
  comingSoonText: { ...Fonts.monoBold, fontSize: TypeScale.tiny, color: Colors.electric, letterSpacing: 0.5 },

  /* ── How It Works ── */
  howHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginTop: Spacing.sm,
  },
  howCard: {
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.border, padding: Spacing.base,
    overflow: 'hidden',
  },
  stepRow: { flexDirection: 'row', gap: Spacing.md, paddingVertical: Spacing.sm },
  stepNum: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  stepNumText: { ...Fonts.displayBold, fontSize: TypeScale.bodySm, color: '#fff' },
  stepText: { flex: 1 },
  stepTitle: { ...Fonts.bodySemibold, fontSize: TypeScale.body, color: Colors.textPrimary },
  stepDesc: { ...Fonts.body, fontSize: TypeScale.bodySm, color: Colors.textSecondary, marginTop: 2 },
  howDivider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.md },
  termsLink: { ...Fonts.bodyMedium, fontSize: TypeScale.bodySm, color: Colors.electric },
});
