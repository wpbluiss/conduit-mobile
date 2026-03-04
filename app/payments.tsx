import { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Animated,
  Dimensions,
  TextInput,
  Switch,
  Alert,
  Platform,
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
import {
  api,
  type PaymentOverview,
  type PaymentSettings,
  type Transaction,
} from '../lib/api';

const { width: SCREEN_W } = Dimensions.get('window');

// ── Mock Data ────────────────────────────────────────────────

const MOCK_SETTINGS: PaymentSettings = {
  stripe_connected: true,
  capture_deposits: true,
  deposit_amount: 50,
  no_show_fees: true,
  no_show_fee_amount: 25,
  send_payment_link: false,
  payment_link_amount: null,
};

const MOCK_OVERVIEW: PaymentOverview = {
  total_collected: 4285,
  pending_deposits: 350,
  this_month: 1120,
  next_payout_amount: 980.50,
  next_payout_date: '2026-03-07',
  bank_last4: '4829',
  bank_name: 'Wells Fargo',
  payout_history: [
    { date: '2026-02-21', amount: 1240.00 },
    { date: '2026-02-07', amount: 890.50 },
    { date: '2026-01-21', amount: 1065.00 },
  ],
  transactions: [
    { id: 'txn-1', customer_name: 'Maria Gonzalez', amount: 50, type: 'deposit', status: 'completed', created_at: '2026-03-02T14:22:00Z' },
    { id: 'txn-2', customer_name: 'James Wilson', amount: 25, type: 'no_show_fee', status: 'completed', created_at: '2026-03-01T09:15:00Z' },
    { id: 'txn-3', customer_name: 'Sofia Reyes', amount: 150, type: 'payment', status: 'completed', created_at: '2026-02-28T16:40:00Z' },
    { id: 'txn-4', customer_name: 'David Chen', amount: 50, type: 'deposit', status: 'pending', created_at: '2026-02-28T11:05:00Z' },
    { id: 'txn-5', customer_name: 'Amanda Brooks', amount: 75, type: 'payment', status: 'completed', created_at: '2026-02-27T13:30:00Z' },
    { id: 'txn-6', customer_name: 'Carlos Mendez', amount: 50, type: 'refund', status: 'completed', created_at: '2026-02-26T10:00:00Z' },
  ],
};

// ── Helpers ──────────────────────────────────────────────────

type TxnFilterKey = 'all' | 'deposit' | 'no_show_fee' | 'payment';
const TXN_FILTERS: { key: TxnFilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'deposit', label: 'Deposits' },
  { key: 'no_show_fee', label: 'No-Show Fees' },
  { key: 'payment', label: 'Payments' },
];

const TYPE_CONFIG: Record<Transaction['type'], { label: string; color: string; bg: string; icon: React.ComponentProps<typeof Ionicons>['name'] }> = {
  deposit: { label: 'Deposit', color: Colors.success, bg: Colors.successGlow, icon: 'arrow-down' },
  no_show_fee: { label: 'No-Show Fee', color: Colors.warning, bg: Colors.warningGlow, icon: 'arrow-down' },
  payment: { label: 'Payment', color: Colors.electric, bg: Colors.electricMuted, icon: 'arrow-down' },
  refund: { label: 'Refund', color: Colors.danger, bg: Colors.dangerGlow, icon: 'arrow-up' },
};

const STATUS_CONFIG: Record<Transaction['status'], { color: string }> = {
  completed: { color: Colors.success },
  pending: { color: Colors.warning },
  failed: { color: Colors.danger },
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 86_400_000) {
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }
  if (diff < 172_800_000) return 'Yesterday';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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
  const translateX = shimmer.interpolate({ inputRange: [0, 1], outputRange: [-SCREEN_W, SCREEN_W] });
  return (
    <Animated.View style={[st.shimmer, { transform: [{ translateX }] }]}>
      <LinearGradient
        colors={['transparent', 'rgba(255,255,255,0.04)', 'rgba(255,255,255,0.08)', 'rgba(255,255,255,0.04)', 'transparent']}
        start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  );
}

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

// ── Stat Card ────────────────────────────────────────────────

function OverviewCard({
  label, value, gradientEnd, borderColor, accentColor,
}: {
  label: string; value: number; gradientEnd: string; borderColor: string; accentColor: string;
}) {
  const count = useCountUp(value, 1200);
  const formatted = `$${Math.round(count).toLocaleString()}`;
  return (
    <LinearGradient
      colors={[Colors.bgCard, gradientEnd]}
      start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
      style={[st.overviewCard, { borderColor }]}
    >
      <ShimmerOverlay />
      <View style={[st.overviewAccent, { backgroundColor: accentColor }]} />
      <Text style={st.overviewLabel}>{label}</Text>
      <Text style={st.overviewValue}>{formatted}</Text>
    </LinearGradient>
  );
}

// ── Stagger Entrance ─────────────────────────────────────────

function StaggerIn({ index, children }: { index: number; children: React.ReactNode }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(18)).current;
  useEffect(() => {
    const delay = index * 80;
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 400, delay, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 400, delay, useNativeDriver: true }),
    ]).start();
  }, []);
  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
}

// ── Transaction Row ──────────────────────────────────────────

function TransactionRow({ txn }: { txn: Transaction }) {
  const cfg = TYPE_CONFIG[txn.type];
  const statusCfg = STATUS_CONFIG[txn.status];
  const isRefund = txn.type === 'refund';

  return (
    <View style={st.txnRow}>
      <View style={[st.txnIcon, { backgroundColor: cfg.bg }]}>
        <Ionicons name={cfg.icon} size={16} color={cfg.color} />
      </View>
      <View style={st.txnInfo}>
        <View style={st.txnNameRow}>
          <Text style={st.txnName} numberOfLines={1}>{txn.customer_name}</Text>
          <Text style={[st.txnAmount, { color: isRefund ? Colors.danger : Colors.textPrimary }]}>
            {isRefund ? '-' : '+'}{formatCurrency(txn.amount)}
          </Text>
        </View>
        <View style={st.txnMeta}>
          <View style={[st.txnTypePill, { backgroundColor: cfg.bg }]}>
            <Text style={[st.txnTypeText, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
          <Text style={st.txnDate}>{formatDate(txn.created_at)}</Text>
          <Text style={[st.txnStatus, { color: statusCfg.color }]}>
            {txn.status.charAt(0).toUpperCase() + txn.status.slice(1)}
          </Text>
        </View>
      </View>
    </View>
  );
}

// ── Setting Toggle Row ───────────────────────────────────────

function SettingToggle({
  label, value, onToggle, description,
}: {
  label: string; value: boolean; onToggle: (v: boolean) => void; description?: string;
}) {
  return (
    <View style={st.settingRow}>
      <View style={st.settingLeft}>
        <Text style={st.settingLabel}>{label}</Text>
        {description && <Text style={st.settingDesc}>{description}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={(v) => { Haptics.selectionAsync(); onToggle(v); }}
        trackColor={{ false: Colors.bgElevated, true: Colors.electricMuted }}
        thumbColor={value ? Colors.electric : Colors.textMuted}
        ios_backgroundColor={Colors.bgElevated}
      />
    </View>
  );
}

// ── Amount Input Row ─────────────────────────────────────────

function AmountInput({
  label, value, onChangeText, enabled,
}: {
  label: string; value: string; onChangeText: (t: string) => void; enabled: boolean;
}) {
  return (
    <View style={[st.amountRow, !enabled && { opacity: 0.4 }]}>
      <Text style={st.amountLabel}>{label}</Text>
      <View style={st.amountInputWrap}>
        <Text style={st.amountDollar}>$</Text>
        <TextInput
          style={st.amountInput}
          value={value}
          onChangeText={onChangeText}
          keyboardType="numeric"
          editable={enabled}
          placeholderTextColor={Colors.textMuted}
        />
      </View>
    </View>
  );
}

// ── Connect Stripe CTA ──────────────────────────────────────

function ConnectStripeCard() {
  return (
    <View style={st.connectCard}>
      <ShimmerOverlay />
      <View style={st.connectIconWrap}>
        <LinearGradient
          colors={['rgba(99, 91, 255, 0.15)', 'rgba(99, 91, 255, 0.05)']}
          style={st.connectIconBg}
        >
          <Ionicons name="card-outline" size={40} color="#635BFF" />
        </LinearGradient>
      </View>
      <Text style={st.connectTitle}>Connect Stripe</Text>
      <Text style={st.connectDesc}>
        Connect your Stripe account to start accepting payments from leads during and after calls
      </Text>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          Alert.alert('Connect Stripe', 'This will redirect you to Stripe to connect your account.');
        }}
        style={st.connectBtnWrap}
      >
        <LinearGradient
          colors={['#635BFF', '#7C3AED']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={st.connectBtn}
        >
          <Ionicons name="link-outline" size={18} color="#fff" />
          <Text style={st.connectBtnText}>Connect Stripe</Text>
        </LinearGradient>
      </Pressable>
    </View>
  );
}

// ── Main Screen ──────────────────────────────────────────────

export default function PaymentsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [overview, setOverview] = useState<PaymentOverview>(MOCK_OVERVIEW);
  const [settings, setSettings] = useState<PaymentSettings>(MOCK_SETTINGS);
  const [txnFilter, setTxnFilter] = useState<TxnFilterKey>('all');
  const [captureOpen, setCaptureOpen] = useState(false);
  const [depositAmtStr, setDepositAmtStr] = useState(String(MOCK_SETTINGS.deposit_amount));
  const [noShowAmtStr, setNoShowAmtStr] = useState(String(MOCK_SETTINGS.no_show_fee_amount));
  const [linkAmtStr, setLinkAmtStr] = useState(MOCK_SETTINGS.payment_link_amount ? String(MOCK_SETTINGS.payment_link_amount) : '');

  useEffect(() => {
    api.getPayments()
      .then(setOverview)
      .catch(() => { /* use mock */ });
    api.getPaymentSettings()
      .then((s) => {
        setSettings(s);
        setDepositAmtStr(String(s.deposit_amount));
        setNoShowAmtStr(String(s.no_show_fee_amount));
        setLinkAmtStr(s.payment_link_amount ? String(s.payment_link_amount) : '');
      })
      .catch(() => { /* use mock */ });
  }, []);

  const updateSetting = useCallback((patch: Partial<PaymentSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
    api.updatePaymentSettings(patch).catch(() => {});
  }, []);

  const filteredTxns = txnFilter === 'all'
    ? overview.transactions
    : overview.transactions.filter((t) => t.type === txnFilter);

  const stripeConnected = settings.stripe_connected;

  return (
    <View style={st.root}>
      <LinearGradient
        colors={[Colors.bgPrimary, Colors.bgPrimary, 'rgba(14, 165, 233, 0.03)']}
        locations={[0, 0.6, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* ── Header ── */}
      <View style={[st.header, { paddingTop: insets.top + Spacing.sm }]}>
        <Pressable onPress={() => router.back()} style={st.backBtn} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </Pressable>
        <View style={st.headerTextCol}>
          <Text style={st.headerTitle}>Payments</Text>
          <Text style={st.headerSub}>Manage deposits & payment capture</Text>
        </View>
      </View>

      <ScrollView
        style={st.container}
        contentContainerStyle={st.scroll}
        showsVerticalScrollIndicator={false}
      >
        {!stripeConnected ? (
          <StaggerIn index={0}>
            <ConnectStripeCard />
          </StaggerIn>
        ) : (
          <>
            {/* ── Overview Stats ── */}
            <StaggerIn index={0}>
              <View style={st.statsRow}>
                <OverviewCard
                  label="COLLECTED"
                  value={overview.total_collected}
                  gradientEnd="rgba(16, 185, 129, 0.12)"
                  borderColor="rgba(16, 185, 129, 0.15)"
                  accentColor={Colors.success}
                />
                <OverviewCard
                  label="PENDING"
                  value={overview.pending_deposits}
                  gradientEnd="rgba(245, 158, 11, 0.12)"
                  borderColor="rgba(245, 158, 11, 0.15)"
                  accentColor={Colors.warning}
                />
                <OverviewCard
                  label="THIS MONTH"
                  value={overview.this_month}
                  gradientEnd="rgba(14, 165, 233, 0.12)"
                  borderColor="rgba(14, 165, 233, 0.15)"
                  accentColor={Colors.electric}
                />
              </View>
            </StaggerIn>

            {/* ── Auto-Capture Settings ── */}
            <StaggerIn index={1}>
              <Pressable
                onPress={() => { Haptics.selectionAsync(); setCaptureOpen(!captureOpen); }}
                style={st.sectionHeader}
              >
                <View style={st.sectionLeft}>
                  <View style={st.sectionDot} />
                  <Text style={st.sectionTitle}>Auto-Capture Settings</Text>
                </View>
                <Ionicons name={captureOpen ? 'chevron-up' : 'chevron-down'} size={20} color={Colors.textMuted} />
              </Pressable>

              {captureOpen && (
                <View style={st.settingsCard}>
                  <ShimmerOverlay />

                  <SettingToggle
                    label="Capture deposits during calls"
                    description="AI asks for a deposit when confirming appointments"
                    value={settings.capture_deposits}
                    onToggle={(v) => updateSetting({ capture_deposits: v })}
                  />
                  <AmountInput
                    label="Deposit amount"
                    value={depositAmtStr}
                    onChangeText={(t) => {
                      setDepositAmtStr(t);
                      const num = parseFloat(t);
                      if (!isNaN(num)) updateSetting({ deposit_amount: num });
                    }}
                    enabled={settings.capture_deposits}
                  />

                  <View style={st.settingDivider} />

                  <SettingToggle
                    label="No-show fees"
                    description="Automatically charge fee for missed appointments"
                    value={settings.no_show_fees}
                    onToggle={(v) => updateSetting({ no_show_fees: v })}
                  />
                  <AmountInput
                    label="No-show fee amount"
                    value={noShowAmtStr}
                    onChangeText={(t) => {
                      setNoShowAmtStr(t);
                      const num = parseFloat(t);
                      if (!isNaN(num)) updateSetting({ no_show_fee_amount: num });
                    }}
                    enabled={settings.no_show_fees}
                  />

                  <View style={st.settingDivider} />

                  <SettingToggle
                    label="Send payment link via SMS"
                    description="Text the lead a Stripe payment link after the call"
                    value={settings.send_payment_link}
                    onToggle={(v) => updateSetting({ send_payment_link: v })}
                  />
                  <AmountInput
                    label="Payment link amount"
                    value={linkAmtStr}
                    onChangeText={(t) => {
                      setLinkAmtStr(t);
                      const num = parseFloat(t);
                      updateSetting({ payment_link_amount: isNaN(num) ? null : num });
                    }}
                    enabled={settings.send_payment_link}
                  />

                  <View style={st.settingDivider} />
                  <View style={st.secureNote}>
                    <Ionicons name="lock-closed" size={14} color={Colors.textMuted} />
                    <Text style={st.secureNoteText}>Payments processed securely via Stripe</Text>
                  </View>
                </View>
              )}
            </StaggerIn>

            {/* ── Recent Transactions ── */}
            <StaggerIn index={2}>
              <View style={st.sectionHeader}>
                <View style={st.sectionLeft}>
                  <View style={st.sectionDot} />
                  <Text style={st.sectionTitle}>Recent Transactions</Text>
                </View>
              </View>

              <View style={st.txnCard}>
                <ShimmerOverlay />
                {/* Filters */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.filterRow}>
                  {TXN_FILTERS.map((f) => {
                    const active = txnFilter === f.key;
                    return (
                      <Pressable
                        key={f.key}
                        onPress={() => { Haptics.selectionAsync(); setTxnFilter(f.key); }}
                        style={[st.filterPill, active && st.filterPillActive]}
                      >
                        <Text style={[st.filterPillText, active && st.filterPillTextActive]}>{f.label}</Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>

                {filteredTxns.length === 0 ? (
                  <View style={st.txnEmpty}>
                    <Text style={st.txnEmptyText}>No transactions found</Text>
                  </View>
                ) : (
                  filteredTxns.map((txn) => (
                    <TransactionRow key={txn.id} txn={txn} />
                  ))
                )}
              </View>
            </StaggerIn>

            {/* ── Payout Summary ── */}
            <StaggerIn index={3}>
              <View style={st.sectionHeader}>
                <View style={st.sectionLeft}>
                  <View style={st.sectionDot} />
                  <Text style={st.sectionTitle}>Payout Summary</Text>
                </View>
              </View>

              <View style={st.payoutCard}>
                <ShimmerOverlay />

                {/* Next payout */}
                <View style={st.payoutTopRow}>
                  <View>
                    <Text style={st.payoutLabel}>Next Payout</Text>
                    <Text style={st.payoutAmount}>{formatCurrency(overview.next_payout_amount)}</Text>
                  </View>
                  <View style={st.payoutDateCol}>
                    <Text style={st.payoutLabel}>Estimated Date</Text>
                    <Text style={st.payoutDate}>
                      {new Date(overview.next_payout_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </Text>
                  </View>
                </View>

                <View style={st.payoutDivider} />

                {/* Bank account */}
                <View style={st.bankRow}>
                  <View style={st.bankIconWrap}>
                    <Ionicons name="business-outline" size={18} color={Colors.electric} />
                  </View>
                  <View style={st.bankInfo}>
                    <Text style={st.bankName}>{overview.bank_name}</Text>
                    <Text style={st.bankAccount}>****{overview.bank_last4}</Text>
                  </View>
                </View>

                <View style={st.payoutDivider} />

                {/* Payout history */}
                <Text style={st.payoutHistoryTitle}>Payout History</Text>
                {overview.payout_history.map((p, i) => (
                  <View key={i} style={st.payoutHistoryRow}>
                    <Text style={st.payoutHistoryDate}>
                      {new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </Text>
                    <Text style={st.payoutHistoryAmt}>{formatCurrency(p.amount)}</Text>
                  </View>
                ))}

                <View style={st.payoutDivider} />

                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    Alert.alert('Stripe Dashboard', 'This will open the Stripe dashboard to manage your account.');
                  }}
                  style={st.stripeLink}
                >
                  <Ionicons name="open-outline" size={16} color={Colors.electric} />
                  <Text style={st.stripeLinkText}>Manage in Stripe</Text>
                </Pressable>
              </View>
            </StaggerIn>
          </>
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

  /* ── Overview Stats ── */
  statsRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  overviewCard: {
    flex: 1, backgroundColor: Colors.bgCard, borderRadius: BorderRadius.lg,
    borderWidth: 1, padding: Spacing.md, minHeight: 104,
    justifyContent: 'space-between', overflow: 'hidden',
  },
  overviewAccent: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 2,
    borderTopLeftRadius: BorderRadius.lg, borderTopRightRadius: BorderRadius.lg,
  },
  overviewLabel: {
    ...Fonts.bodyMedium, fontSize: TypeScale.tiny, color: Colors.textMuted,
    letterSpacing: 0.8, marginBottom: Spacing.sm,
  },
  overviewValue: {
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

  /* ── Settings Card ── */
  settingsCard: {
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.border, padding: Spacing.base,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  settingLeft: { flex: 1, marginRight: Spacing.md },
  settingLabel: { ...Fonts.bodySemibold, fontSize: TypeScale.body, color: Colors.textPrimary },
  settingDesc: { ...Fonts.body, fontSize: TypeScale.caption, color: Colors.textMuted, marginTop: 2 },
  settingDivider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.sm },
  amountRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  amountLabel: { ...Fonts.body, fontSize: TypeScale.bodySm, color: Colors.textSecondary },
  amountInputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.bgInput, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.sm, height: 36, width: 100,
  },
  amountDollar: { ...Fonts.monoBold, fontSize: TypeScale.body, color: Colors.textMuted, marginRight: 2 },
  amountInput: {
    flex: 1, ...Fonts.mono, fontSize: TypeScale.body, color: Colors.textPrimary,
    paddingVertical: 0,
  },
  secureNote: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingTop: Spacing.sm,
  },
  secureNoteText: { ...Fonts.body, fontSize: TypeScale.caption, color: Colors.textMuted },

  /* ── Transactions ── */
  txnCard: {
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.border, padding: Spacing.base,
    overflow: 'hidden',
  },
  filterRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  filterPill: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.full, backgroundColor: Colors.bgInput,
    borderWidth: 1, borderColor: Colors.border,
  },
  filterPillActive: {
    backgroundColor: Colors.electricMuted, borderColor: Colors.electricBorder,
  },
  filterPillText: { ...Fonts.bodyMedium, fontSize: TypeScale.caption, color: Colors.textMuted },
  filterPillTextActive: { color: Colors.electric },

  txnRow: {
    flexDirection: 'row', gap: Spacing.md, paddingVertical: Spacing.sm,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  txnIcon: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  txnInfo: { flex: 1, gap: 4 },
  txnNameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  txnName: { ...Fonts.bodySemibold, fontSize: TypeScale.body, color: Colors.textPrimary, flex: 1, marginRight: Spacing.sm },
  txnAmount: { ...Fonts.monoBold, fontSize: TypeScale.body },
  txnMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  txnTypePill: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.full },
  txnTypeText: { ...Fonts.monoBold, fontSize: TypeScale.tiny, letterSpacing: 0.5 },
  txnDate: { ...Fonts.mono, fontSize: TypeScale.caption, color: Colors.textMuted },
  txnStatus: { ...Fonts.bodyMedium, fontSize: TypeScale.caption },
  txnEmpty: { alignItems: 'center', paddingVertical: Spacing.xl },
  txnEmptyText: { ...Fonts.body, fontSize: TypeScale.bodySm, color: Colors.textMuted },

  /* ── Payout Card ── */
  payoutCard: {
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.border, padding: Spacing.base,
    overflow: 'hidden',
  },
  payoutTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  payoutLabel: {
    ...Fonts.bodyMedium, fontSize: TypeScale.tiny, color: Colors.textMuted,
    letterSpacing: 0.8, marginBottom: Spacing.xs,
  },
  payoutAmount: { ...Fonts.monoBold, fontSize: TypeScale.h2, color: Colors.success, letterSpacing: -0.5 },
  payoutDateCol: { alignItems: 'flex-end' },
  payoutDate: { ...Fonts.mono, fontSize: TypeScale.body, color: Colors.textPrimary },
  payoutDivider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.md },

  bankRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  bankIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: Colors.electricMuted,
    alignItems: 'center', justifyContent: 'center',
  },
  bankInfo: { flex: 1 },
  bankName: { ...Fonts.bodySemibold, fontSize: TypeScale.body, color: Colors.textPrimary },
  bankAccount: { ...Fonts.mono, fontSize: TypeScale.caption, color: Colors.textMuted, marginTop: 1 },

  payoutHistoryTitle: {
    ...Fonts.bodyMedium, fontSize: TypeScale.caption, color: Colors.textMuted,
    letterSpacing: 0.8, marginBottom: Spacing.sm,
  },
  payoutHistoryRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: Spacing.xs + 2,
  },
  payoutHistoryDate: { ...Fonts.body, fontSize: TypeScale.bodySm, color: Colors.textSecondary },
  payoutHistoryAmt: { ...Fonts.monoBold, fontSize: TypeScale.bodySm, color: Colors.textPrimary },

  stripeLink: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, paddingVertical: Spacing.sm,
  },
  stripeLinkText: { ...Fonts.bodyMedium, fontSize: TypeScale.body, color: Colors.electric },

  /* ── Connect Stripe ── */
  connectCard: {
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.xl,
    borderWidth: 1, borderColor: Colors.border, padding: Spacing['2xl'],
    alignItems: 'center', overflow: 'hidden', marginTop: Spacing.xl,
  },
  connectIconWrap: { marginBottom: Spacing.lg },
  connectIconBg: {
    width: 88, height: 88, borderRadius: 44,
    alignItems: 'center', justifyContent: 'center',
  },
  connectTitle: { ...TextStyles.h2, color: Colors.textPrimary, marginBottom: Spacing.sm },
  connectDesc: {
    ...Fonts.body, fontSize: TypeScale.bodySm, color: Colors.textSecondary,
    textAlign: 'center', lineHeight: 20, marginBottom: Spacing.lg,
  },
  connectBtnWrap: { borderRadius: BorderRadius.md, overflow: 'hidden' },
  connectBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  connectBtnText: { ...Fonts.bodySemibold, fontSize: TypeScale.body, color: '#fff' },
});
