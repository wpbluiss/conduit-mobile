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
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors } from '../constants/colors';
import { Fonts, TypeScale, TextStyles } from '../constants/typography';
import { Spacing, BorderRadius, ScreenPadding } from '../constants/layout';
import {
  api,
  type ReviewsData,
  type ReviewSettings,
  type Review,
} from '../lib/api';

const { width: SCREEN_W } = Dimensions.get('window');

// ── Mock Data ────────────────────────────────────────────────

const MOCK_REVIEWS: ReviewsData = {
  average_rating: 4.8,
  total_reviews: 127,
  rating_distribution: [
    { stars: 5, percentage: 78 },
    { stars: 4, percentage: 14 },
    { stars: 3, percentage: 5 },
    { stars: 2, percentage: 2 },
    { stars: 1, percentage: 1 },
  ],
  area_percentile: 10,
  reviews: [
    {
      id: 'r1',
      reviewer_name: 'Maria Gonzalez',
      rating: 5,
      text: 'Absolutely professional service! They were on time and did great work. I will definitely be coming back and recommending to friends.',
      source: 'google',
      created_at: '2026-02-28T14:30:00Z',
      ai_suggested_reply: 'Thank you so much, Maria! We appreciate your kind words and look forward to serving you again.',
    },
    {
      id: 'r2',
      reviewer_name: 'James Wilson',
      rating: 5,
      text: 'Friendly staff and excellent results. The whole experience was seamless from booking to completion.',
      source: 'yelp',
      created_at: '2026-02-25T10:15:00Z',
      ai_suggested_reply: 'Thanks James! We pride ourselves on making the experience smooth from start to finish. See you next time!',
    },
    {
      id: 'r3',
      reviewer_name: 'Sofia Reyes',
      rating: 4,
      text: 'Great work overall. The only reason I give 4 stars is the wait time was a bit longer than expected, but the quality made up for it.',
      source: 'google',
      created_at: '2026-02-20T16:00:00Z',
      ai_suggested_reply: 'Hi Sofia, thanks for the feedback! We apologize for the wait and are working to improve our scheduling. Glad you were happy with the quality!',
    },
    {
      id: 'r4',
      reviewer_name: 'David Chen',
      rating: 3,
      text: 'Service was decent but pricing felt a bit high compared to similar options in the area. Would consider returning if they offered better deals.',
      source: 'facebook',
      created_at: '2026-02-15T09:45:00Z',
      ai_suggested_reply: 'Hi David, thank you for your honest feedback. We strive to provide premium quality and would love to discuss our value offerings with you. Please reach out directly!',
    },
    {
      id: 'r5',
      reviewer_name: 'Amanda Brooks',
      rating: 5,
      text: 'Best in the area! On time, professional, and the results exceeded my expectations. Highly recommend!',
      source: 'google',
      created_at: '2026-02-10T13:20:00Z',
      ai_suggested_reply: 'Wow, thank you Amanda! We are thrilled to hear the results exceeded your expectations. Your recommendation means the world to us!',
    },
  ],
  insights: {
    positive_keywords: ['professional', 'on time', 'great work', 'friendly'],
    negative_keywords: ['wait time', 'pricing'],
    sentiment_trend: [72, 76, 80, 85],
  },
  requests_sent_this_month: 42,
  reviews_received_this_month: 18,
  conversion_rate: 43,
};

const MOCK_SETTINGS: ReviewSettings = {
  auto_request_enabled: true,
  send_after_hours: 24,
  platforms: { google: true, yelp: false, facebook: false },
  message_template: 'Hi [Name], thanks for visiting [Business]! We\'d love your feedback: [Link]',
};

// ── Helpers ──────────────────────────────────────────────────

type ReviewFilter = 'all' | 'positive' | 'attention';
const REVIEW_FILTERS: { key: ReviewFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'positive', label: 'Positive (4-5)' },
  { key: 'attention', label: 'Needs Attention' },
];

const TIMING_OPTIONS: { value: 1 | 24 | 48; label: string }[] = [
  { value: 1, label: '1 hour' },
  { value: 24, label: '24 hours' },
  { value: 48, label: '48 hours' },
];

const SOURCE_COLORS: Record<string, { bg: string; color: string }> = {
  google: { bg: 'rgba(66, 133, 244, 0.15)', color: '#4285F4' },
  yelp: { bg: 'rgba(211, 35, 35, 0.15)', color: '#D32323' },
  facebook: { bg: 'rgba(24, 119, 242, 0.15)', color: '#1877F2' },
};

const STAR_COLOR = '#F59E0B';

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 86_400_000) return 'Today';
  if (diff < 172_800_000) return 'Yesterday';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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
  return <Animated.View style={{ opacity, transform: [{ translateY }] }}>{children}</Animated.View>;
}

// ── Star Rating Display ──────────────────────────────────────

function StarRating({ rating, size = 16 }: { rating: number; size?: number }) {
  const stars: React.ReactNode[] = [];
  for (let i = 1; i <= 5; i++) {
    const name: React.ComponentProps<typeof Ionicons>['name'] =
      i <= Math.floor(rating)
        ? 'star'
        : i - rating < 1
          ? 'star-half'
          : 'star-outline';
    stars.push(<Ionicons key={i} name={name} size={size} color={STAR_COLOR} />);
  }
  return <View style={{ flexDirection: 'row', gap: 2 }}>{stars}</View>;
}

// ── Rating Bar ───────────────────────────────────────────────

function RatingBar({ stars, percentage }: { stars: number; percentage: number }) {
  const barWidth = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(barWidth, { toValue: percentage, duration: 800, delay: (5 - stars) * 100, useNativeDriver: false }).start();
  }, [percentage]);

  const barColor =
    stars >= 4 ? Colors.success : stars === 3 ? Colors.warning : Colors.danger;

  return (
    <View style={st.ratingBarRow}>
      <Text style={st.ratingBarLabel}>{stars}</Text>
      <Ionicons name="star" size={10} color={STAR_COLOR} />
      <View style={st.ratingBarTrack}>
        <Animated.View
          style={[
            st.ratingBarFill,
            {
              backgroundColor: barColor,
              width: barWidth.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>
      <Text style={st.ratingBarPct}>{percentage}%</Text>
    </View>
  );
}

// ── Review Card ──────────────────────────────────────────────

function ReviewCard({
  review,
  onReply,
}: {
  review: Review;
  onReply: (id: string, text: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [showAiSuggestion, setShowAiSuggestion] = useState(true);
  const sourceCfg = SOURCE_COLORS[review.source] || SOURCE_COLORS.google;
  const isLong = review.text.length > 120;

  return (
    <View style={st.reviewCard}>
      <View style={st.reviewHeader}>
        <StarRating rating={review.rating} size={14} />
        <View style={[st.sourceBadge, { backgroundColor: sourceCfg.bg }]}>
          <Text style={[st.sourceText, { color: sourceCfg.color }]}>
            {review.source.charAt(0).toUpperCase() + review.source.slice(1)}
          </Text>
        </View>
      </View>

      <View style={st.reviewMeta}>
        <Text style={st.reviewerName}>{review.reviewer_name}</Text>
        <Text style={st.reviewDate}>{formatDate(review.created_at)}</Text>
      </View>

      <Pressable onPress={() => { if (isLong) { Haptics.selectionAsync(); setExpanded(!expanded); } }}>
        <Text style={st.reviewText} numberOfLines={expanded || !isLong ? undefined : 3}>
          {review.text}
        </Text>
        {isLong && !expanded && (
          <Text style={st.readMore}>Read more</Text>
        )}
      </Pressable>

      {review.reply ? (
        <View style={st.replyBubble}>
          <Text style={st.replyLabel}>Your reply</Text>
          <Text style={st.replyText}>{review.reply}</Text>
        </View>
      ) : (
        <>
          {showAiSuggestion && (
            <View style={st.aiSuggestion}>
              <View style={st.aiSuggestionHeader}>
                <Ionicons name="sparkles-outline" size={14} color={Colors.electric} />
                <Text style={st.aiSuggestionLabel}>AI Suggested Reply</Text>
              </View>
              <Text style={st.aiSuggestionText}>{review.ai_suggested_reply}</Text>
              <View style={st.aiSuggestionActions}>
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setReplyText(review.ai_suggested_reply);
                    setReplyOpen(true);
                    setShowAiSuggestion(false);
                  }}
                  style={st.aiUseBtn}
                >
                  <Text style={st.aiUseBtnText}>Use this reply</Text>
                </Pressable>
                <Pressable
                  onPress={() => { Haptics.selectionAsync(); setShowAiSuggestion(false); }}
                  hitSlop={8}
                >
                  <Text style={st.aiDismissText}>Dismiss</Text>
                </Pressable>
              </View>
            </View>
          )}

          {!replyOpen ? (
            <Pressable
              onPress={() => { Haptics.selectionAsync(); setReplyOpen(true); }}
              style={st.replyBtn}
            >
              <Ionicons name="chatbubble-outline" size={14} color={Colors.electric} />
              <Text style={st.replyBtnText}>Reply</Text>
            </Pressable>
          ) : (
            <View style={st.replyInputWrap}>
              <TextInput
                style={st.replyInput}
                value={replyText}
                onChangeText={setReplyText}
                placeholder="Write your reply..."
                placeholderTextColor={Colors.textMuted}
                multiline
              />
              <View style={st.replyActions}>
                <Pressable
                  onPress={() => { setReplyOpen(false); setReplyText(''); }}
                  style={st.replyCancelBtn}
                >
                  <Text style={st.replyCancelText}>Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    if (replyText.trim()) {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      onReply(review.id, replyText.trim());
                      setReplyOpen(false);
                      setReplyText('');
                    }
                  }}
                  style={[st.replySendBtn, !replyText.trim() && { opacity: 0.4 }]}
                >
                  <LinearGradient
                    colors={Colors.gradientElectric}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={st.replySendGradient}
                  >
                    <Text style={st.replySendText}>Send</Text>
                  </LinearGradient>
                </Pressable>
              </View>
            </View>
          )}
        </>
      )}
    </View>
  );
}

// ── Sentiment Trend Chart ────────────────────────────────────

function SentimentTrend({ data }: { data: number[] }) {
  const maxVal = Math.max(...data, 1);
  const minVal = Math.min(...data);
  const range = maxVal - minVal || 1;
  const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];

  return (
    <View style={st.trendWrap}>
      <View style={st.trendChart}>
        {data.map((val, i) => {
          const height = ((val - minVal) / range) * 60 + 20;
          return (
            <View key={i} style={st.trendCol}>
              <View style={st.trendBarTrack}>
                <LinearGradient
                  colors={[Colors.success, Colors.cyan]}
                  start={{ x: 0.5, y: 1 }} end={{ x: 0.5, y: 0 }}
                  style={[st.trendBar, { height }]}
                />
              </View>
              <Text style={st.trendLabel}>{weeks[i]}</Text>
            </View>
          );
        })}
      </View>
      <View style={st.trendIndicator}>
        <Ionicons name="trending-up" size={16} color={Colors.success} />
        <Text style={st.trendIndicatorText}>Trending up</Text>
      </View>
    </View>
  );
}

// ── Main Screen ──────────────────────────────────────────────

export default function ReviewsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [data, setData] = useState<ReviewsData>(MOCK_REVIEWS);
  const [settings, setSettings] = useState<ReviewSettings>(MOCK_SETTINGS);
  const [reviewFilter, setReviewFilter] = useState<ReviewFilter>('all');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [templateText, setTemplateText] = useState(MOCK_SETTINGS.message_template);

  useEffect(() => {
    api.getReviews()
      .then(setData)
      .catch(() => { /* use mock */ });
    api.getReviewSettings()
      .then((s) => {
        setSettings(s);
        setTemplateText(s.message_template);
      })
      .catch(() => { /* use mock */ });
  }, []);

  const updateSetting = useCallback((patch: Partial<ReviewSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
    api.updateReviewSettings(patch).catch(() => {});
  }, []);

  const handleReply = useCallback((id: string, text: string) => {
    api.replyToReview(id, text).catch(() => {});
    setData((prev) => ({
      ...prev,
      reviews: prev.reviews.map((r) =>
        r.id === id ? { ...r, reply: text } : r
      ),
    }));
  }, []);

  const filteredReviews =
    reviewFilter === 'all'
      ? data.reviews
      : reviewFilter === 'positive'
        ? data.reviews.filter((r) => r.rating >= 4)
        : data.reviews.filter((r) => r.rating <= 3);

  // Glow pulse for badge
  const glowAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 1500, useNativeDriver: false }),
        Animated.timing(glowAnim, { toValue: 0, duration: 1500, useNativeDriver: false }),
      ])
    ).start();
  }, []);
  const badgeShadowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.1, 0.4] });

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
          <Text style={st.headerTitle}>Reputation</Text>
          <Text style={st.headerSub}>Manage reviews & build trust</Text>
        </View>
      </View>

      <ScrollView
        style={st.container}
        contentContainerStyle={st.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero: Reputation Score ── */}
        <StaggerIn index={0}>
          <View style={st.heroCard}>
            <ShimmerOverlay />

            {/* Stars and rating */}
            <View style={st.heroStarsRow}>
              <StarRating rating={data.average_rating} size={32} />
            </View>
            <View style={st.heroRatingRow}>
              <Text style={st.heroRatingValue}>{data.average_rating}</Text>
              <Text style={st.heroRatingMax}>/5</Text>
            </View>
            <Text style={st.heroReviewCount}>{data.total_reviews} reviews</Text>

            {/* Rating distribution */}
            <View style={st.distributionWrap}>
              {data.rating_distribution.map((d) => (
                <RatingBar key={d.stars} stars={d.stars} percentage={d.percentage} />
              ))}
            </View>

            {/* Top percentile badge */}
            <Animated.View
              style={[
                st.percentileBadge,
                { shadowOpacity: badgeShadowOpacity },
              ]}
            >
              <LinearGradient
                colors={['rgba(16, 185, 129, 0.2)', 'rgba(6, 182, 212, 0.1)']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={st.percentileGradient}
              >
                <Ionicons name="trophy-outline" size={14} color={Colors.success} />
                <Text style={st.percentileText}>Top {data.area_percentile}% in your area</Text>
              </LinearGradient>
            </Animated.View>
          </View>
        </StaggerIn>

        {/* ── Auto-Review Requests ── */}
        <StaggerIn index={1}>
          <Pressable
            onPress={() => { Haptics.selectionAsync(); setSettingsOpen(!settingsOpen); }}
            style={st.sectionHeader}
          >
            <View style={st.sectionLeft}>
              <View style={st.sectionDot} />
              <Text style={st.sectionTitle}>Automated Review Requests</Text>
            </View>
            <Ionicons name={settingsOpen ? 'chevron-up' : 'chevron-down'} size={20} color={Colors.textMuted} />
          </Pressable>

          {settingsOpen && (
            <View style={st.settingsCard}>
              <ShimmerOverlay />

              {/* Toggle */}
              <View style={st.settingRow}>
                <View style={st.settingLeft}>
                  <Text style={st.settingLabel}>Send review request after completed appointment</Text>
                </View>
                <Switch
                  value={settings.auto_request_enabled}
                  onValueChange={(v) => { Haptics.selectionAsync(); updateSetting({ auto_request_enabled: v }); }}
                  trackColor={{ false: Colors.bgElevated, true: Colors.electricMuted }}
                  thumbColor={settings.auto_request_enabled ? Colors.electric : Colors.textMuted}
                  ios_backgroundColor={Colors.bgElevated}
                />
              </View>

              <View style={st.settingDivider} />

              {/* Timing pills */}
              <Text style={st.settingSubLabel}>Send after</Text>
              <View style={st.timingRow}>
                {TIMING_OPTIONS.map((opt) => {
                  const active = settings.send_after_hours === opt.value;
                  return (
                    <Pressable
                      key={opt.value}
                      onPress={() => { Haptics.selectionAsync(); updateSetting({ send_after_hours: opt.value }); }}
                      style={[st.timingPill, active && st.timingPillActive]}
                    >
                      <Text style={[st.timingPillText, active && st.timingPillTextActive]}>{opt.label}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <View style={st.settingDivider} />

              {/* Platform checkboxes */}
              <Text style={st.settingSubLabel}>Platforms</Text>
              <View style={st.platformRow}>
                {(['google', 'yelp', 'facebook'] as const).map((p) => {
                  const active = settings.platforms[p];
                  return (
                    <Pressable
                      key={p}
                      onPress={() => {
                        Haptics.selectionAsync();
                        updateSetting({ platforms: { ...settings.platforms, [p]: !active } });
                      }}
                      style={st.platformCheck}
                    >
                      <View style={[st.checkbox, active && st.checkboxActive]}>
                        {active && <Ionicons name="checkmark" size={12} color="#fff" />}
                      </View>
                      <Text style={[st.platformLabel, active && { color: Colors.textPrimary }]}>
                        {p.charAt(0).toUpperCase() + p.slice(1)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <View style={st.settingDivider} />

              {/* Custom message template */}
              <Text style={st.settingSubLabel}>Message template</Text>
              <TextInput
                style={st.templateInput}
                value={templateText}
                onChangeText={(t) => {
                  setTemplateText(t);
                  updateSetting({ message_template: t });
                }}
                placeholder="Hi [Name], thanks for visiting [Business]! We'd love your feedback: [Link]"
                placeholderTextColor={Colors.textMuted}
                multiline
              />

              <View style={st.settingDivider} />

              {/* Stats */}
              <View style={st.requestStatsRow}>
                <View style={st.requestStat}>
                  <Text style={st.requestStatValue}>{data.requests_sent_this_month}</Text>
                  <Text style={st.requestStatLabel}>requests sent this month</Text>
                </View>
                <View style={st.requestStatDivider} />
                <View style={st.requestStat}>
                  <Text style={st.requestStatValue}>{data.reviews_received_this_month}</Text>
                  <Text style={st.requestStatLabel}>reviews received ({data.conversion_rate}% conversion)</Text>
                </View>
              </View>
            </View>
          )}
        </StaggerIn>

        {/* ── Recent Reviews ── */}
        <StaggerIn index={2}>
          <View style={st.sectionHeader}>
            <View style={st.sectionLeft}>
              <View style={st.sectionDot} />
              <Text style={st.sectionTitle}>Recent Reviews</Text>
            </View>
          </View>

          <View style={st.reviewsCard}>
            <ShimmerOverlay />

            {/* Filters */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.filterRow}>
              {REVIEW_FILTERS.map((f) => {
                const active = reviewFilter === f.key;
                return (
                  <Pressable
                    key={f.key}
                    onPress={() => { Haptics.selectionAsync(); setReviewFilter(f.key); }}
                    style={[st.filterPill, active && st.filterPillActive]}
                  >
                    <Text style={[st.filterPillText, active && st.filterPillTextActive]}>{f.label}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {filteredReviews.length === 0 ? (
              <View style={st.emptyWrap}>
                <Ionicons name="star-outline" size={32} color={Colors.textMuted} />
                <Text style={st.emptyText}>No reviews in this category</Text>
              </View>
            ) : (
              filteredReviews.map((review) => (
                <ReviewCard key={review.id} review={review} onReply={handleReply} />
              ))
            )}
          </View>
        </StaggerIn>

        {/* ── Review Insights ── */}
        <StaggerIn index={3}>
          <View style={st.sectionHeader}>
            <View style={st.sectionLeft}>
              <View style={st.sectionDot} />
              <Text style={st.sectionTitle}>Review Insights</Text>
            </View>
          </View>

          <View style={st.insightsCard}>
            <ShimmerOverlay />

            <Text style={st.insightsSubtitle}>What customers mention most</Text>

            {/* Positive keywords */}
            <View style={st.keywordsRow}>
              {data.insights.positive_keywords.map((kw) => (
                <View key={kw} style={st.positiveChip}>
                  <Ionicons name="trending-up" size={10} color={Colors.success} />
                  <Text style={st.positiveChipText}>{kw}</Text>
                </View>
              ))}
            </View>

            {/* Negative keywords */}
            <View style={st.keywordsRow}>
              {data.insights.negative_keywords.map((kw) => (
                <View key={kw} style={st.negativeChip}>
                  <Ionicons name="trending-down" size={10} color={Colors.danger} />
                  <Text style={st.negativeChipText}>{kw}</Text>
                </View>
              ))}
            </View>

            <View style={st.settingDivider} />

            {/* Sentiment Trend */}
            <Text style={st.insightsSubtitle}>Sentiment Trend</Text>
            <SentimentTrend data={data.insights.sentiment_trend} />
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

  /* ── Hero Card ── */
  heroCard: {
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.xl,
    borderWidth: 1, borderColor: Colors.border,
    paddingVertical: Spacing['2xl'], paddingHorizontal: Spacing.lg,
    alignItems: 'center', overflow: 'hidden', marginTop: Spacing.sm,
  },
  heroStarsRow: { marginBottom: Spacing.sm },
  heroRatingRow: { flexDirection: 'row', alignItems: 'baseline' },
  heroRatingValue: {
    ...Fonts.displayBold, fontSize: 48, color: STAR_COLOR, letterSpacing: -1.5,
  },
  heroRatingMax: {
    ...Fonts.body, fontSize: TypeScale.h3, color: Colors.textMuted, marginLeft: 4,
  },
  heroReviewCount: {
    ...Fonts.body, fontSize: TypeScale.bodySm, color: Colors.textSecondary, marginTop: Spacing.xs,
  },
  distributionWrap: {
    width: '100%', marginTop: Spacing.lg, gap: Spacing.xs,
  },
  ratingBarRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
  },
  ratingBarLabel: {
    ...Fonts.monoBold, fontSize: TypeScale.caption, color: Colors.textSecondary, width: 12, textAlign: 'right',
  },
  ratingBarTrack: {
    flex: 1, height: 6, borderRadius: 3, backgroundColor: Colors.bgElevated, overflow: 'hidden',
  },
  ratingBarFill: { height: 6, borderRadius: 3 },
  ratingBarPct: {
    ...Fonts.mono, fontSize: TypeScale.tiny, color: Colors.textMuted, width: 30, textAlign: 'right',
  },
  percentileBadge: {
    marginTop: Spacing.lg, borderRadius: BorderRadius.full, overflow: 'hidden',
    shadowColor: Colors.success, shadowOffset: { width: 0, height: 0 }, shadowRadius: 12,
  },
  percentileGradient: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  percentileText: {
    ...Fonts.bodySemibold, fontSize: TypeScale.bodySm, color: Colors.success,
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
  settingSubLabel: {
    ...Fonts.bodyMedium, fontSize: TypeScale.caption, color: Colors.textMuted,
    letterSpacing: 0.5, marginBottom: Spacing.sm,
  },
  settingDivider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.md },

  /* ── Timing Pills ── */
  timingRow: { flexDirection: 'row', gap: Spacing.sm },
  timingPill: {
    paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full, backgroundColor: Colors.bgInput,
    borderWidth: 1, borderColor: Colors.border,
  },
  timingPillActive: { backgroundColor: Colors.electricMuted, borderColor: Colors.electricBorder },
  timingPillText: { ...Fonts.bodyMedium, fontSize: TypeScale.caption, color: Colors.textMuted },
  timingPillTextActive: { color: Colors.electric },

  /* ── Platform Checkboxes ── */
  platformRow: { flexDirection: 'row', gap: Spacing.lg },
  platformCheck: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  checkbox: {
    width: 20, height: 20, borderRadius: BorderRadius.sm, borderWidth: 1.5,
    borderColor: Colors.textMuted, alignItems: 'center', justifyContent: 'center',
  },
  checkboxActive: { backgroundColor: Colors.electric, borderColor: Colors.electric },
  platformLabel: { ...Fonts.body, fontSize: TypeScale.body, color: Colors.textSecondary },

  /* ── Template Input ── */
  templateInput: {
    backgroundColor: Colors.bgInput, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md, minHeight: 80,
    ...Fonts.body, fontSize: TypeScale.bodySm, color: Colors.textPrimary,
    textAlignVertical: 'top',
  },

  /* ── Request Stats ── */
  requestStatsRow: { flexDirection: 'row', alignItems: 'center' },
  requestStat: { flex: 1, alignItems: 'center' },
  requestStatValue: { ...Fonts.monoBold, fontSize: TypeScale.h2, color: Colors.electric },
  requestStatLabel: {
    ...Fonts.body, fontSize: TypeScale.tiny, color: Colors.textMuted, textAlign: 'center', marginTop: 2,
  },
  requestStatDivider: { width: 1, height: 40, backgroundColor: Colors.border },

  /* ── Reviews Card ── */
  reviewsCard: {
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
  filterPillActive: { backgroundColor: Colors.electricMuted, borderColor: Colors.electricBorder },
  filterPillText: { ...Fonts.bodyMedium, fontSize: TypeScale.caption, color: Colors.textMuted },
  filterPillTextActive: { color: Colors.electric },

  /* ── Single Review ── */
  reviewCard: {
    paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  reviewHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  sourceBadge: {
    paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.full,
  },
  sourceText: { ...Fonts.monoBold, fontSize: TypeScale.tiny, letterSpacing: 0.5 },
  reviewMeta: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: Spacing.sm,
  },
  reviewerName: { ...Fonts.bodySemibold, fontSize: TypeScale.body, color: Colors.textPrimary },
  reviewDate: { ...Fonts.mono, fontSize: TypeScale.caption, color: Colors.textMuted },
  reviewText: {
    ...Fonts.body, fontSize: TypeScale.bodySm, color: Colors.textSecondary,
    lineHeight: 20, marginTop: Spacing.sm,
  },
  readMore: { ...Fonts.bodyMedium, fontSize: TypeScale.caption, color: Colors.electric, marginTop: 2 },

  /* ── Reply ── */
  replyBubble: {
    backgroundColor: Colors.bgElevated, borderRadius: BorderRadius.md,
    padding: Spacing.md, marginTop: Spacing.sm,
    borderLeftWidth: 3, borderLeftColor: Colors.electric,
  },
  replyLabel: {
    ...Fonts.bodyMedium, fontSize: TypeScale.tiny, color: Colors.electric,
    letterSpacing: 0.5, marginBottom: Spacing.xs,
  },
  replyText: { ...Fonts.body, fontSize: TypeScale.bodySm, color: Colors.textSecondary },
  replyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    marginTop: Spacing.sm, alignSelf: 'flex-start',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.full, backgroundColor: Colors.electricMuted,
  },
  replyBtnText: { ...Fonts.bodyMedium, fontSize: TypeScale.caption, color: Colors.electric },
  replyInputWrap: { marginTop: Spacing.sm },
  replyInput: {
    backgroundColor: Colors.bgInput, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md, minHeight: 60,
    ...Fonts.body, fontSize: TypeScale.bodySm, color: Colors.textPrimary,
    textAlignVertical: 'top',
  },
  replyActions: {
    flexDirection: 'row', justifyContent: 'flex-end', gap: Spacing.sm, marginTop: Spacing.sm,
  },
  replyCancelBtn: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.full,
  },
  replyCancelText: { ...Fonts.bodyMedium, fontSize: TypeScale.caption, color: Colors.textMuted },
  replySendBtn: { borderRadius: BorderRadius.full, overflow: 'hidden' },
  replySendGradient: {
    paddingHorizontal: Spacing.base, paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.full,
  },
  replySendText: { ...Fonts.bodySemibold, fontSize: TypeScale.caption, color: '#fff' },

  /* ── AI Suggestion ── */
  aiSuggestion: {
    backgroundColor: 'rgba(14, 165, 233, 0.06)',
    borderRadius: BorderRadius.md, borderWidth: 1,
    borderColor: 'rgba(14, 165, 233, 0.12)',
    padding: Spacing.md, marginTop: Spacing.sm,
  },
  aiSuggestionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginBottom: Spacing.xs,
  },
  aiSuggestionLabel: {
    ...Fonts.bodyMedium, fontSize: TypeScale.tiny, color: Colors.electric, letterSpacing: 0.5,
  },
  aiSuggestionText: {
    ...Fonts.body, fontSize: TypeScale.bodySm, color: Colors.textSecondary, lineHeight: 18,
  },
  aiSuggestionActions: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginTop: Spacing.sm,
  },
  aiUseBtn: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.full, backgroundColor: Colors.electricMuted,
  },
  aiUseBtnText: { ...Fonts.bodyMedium, fontSize: TypeScale.caption, color: Colors.electric },
  aiDismissText: { ...Fonts.body, fontSize: TypeScale.caption, color: Colors.textMuted },

  /* ── Empty State ── */
  emptyWrap: { alignItems: 'center', paddingVertical: Spacing.xl, gap: Spacing.sm },
  emptyText: { ...Fonts.body, fontSize: TypeScale.bodySm, color: Colors.textMuted },

  /* ── Insights Card ── */
  insightsCard: {
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.border, padding: Spacing.base,
    overflow: 'hidden',
  },
  insightsSubtitle: {
    ...Fonts.bodyMedium, fontSize: TypeScale.caption, color: Colors.textMuted,
    letterSpacing: 0.5, marginBottom: Spacing.sm,
  },
  keywordsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.sm },
  positiveChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.successGlow, borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  positiveChipText: { ...Fonts.bodyMedium, fontSize: TypeScale.caption, color: Colors.success },
  negativeChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.dangerGlow, borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  negativeChipText: { ...Fonts.bodyMedium, fontSize: TypeScale.caption, color: Colors.danger },

  /* ── Sentiment Trend ── */
  trendWrap: { marginTop: Spacing.xs },
  trendChart: {
    flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.md,
    alignItems: 'flex-end', height: 90,
  },
  trendCol: { flex: 1, alignItems: 'center' },
  trendBarTrack: {
    width: '100%', justifyContent: 'flex-end', alignItems: 'center',
    borderRadius: BorderRadius.sm, backgroundColor: Colors.bgElevated, overflow: 'hidden',
    height: 80,
  },
  trendBar: { width: '100%', borderRadius: BorderRadius.sm },
  trendLabel: { ...Fonts.mono, fontSize: TypeScale.tiny, color: Colors.textMuted, marginTop: Spacing.xs },
  trendIndicator: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    justifyContent: 'center', marginTop: Spacing.sm,
  },
  trendIndicatorText: { ...Fonts.bodyMedium, fontSize: TypeScale.bodySm, color: Colors.success },
});
