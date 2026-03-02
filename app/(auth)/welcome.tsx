import { useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  Pressable,
  Animated,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../components/ui/Button';
import { Colors } from '../../constants/colors';
import { Fonts, TypeScale, TextStyles } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/layout';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const TOTAL_SLIDES = 5;

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const gradientAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;
  const cardFloat = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(gradientAnim, { toValue: 1, duration: 4000, useNativeDriver: false })
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 1200, useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(waveAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(waveAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(cardFloat, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(cardFloat, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const markSeen = useCallback(async () => {
    await AsyncStorage.setItem('has_seen_welcome', 'true');
  }, []);

  const handleSkip = useCallback(async () => {
    await markSeen();
    router.replace('/(auth)/login');
  }, []);

  const handleGetStarted = useCallback(async () => {
    await markSeen();
    router.replace('/(auth)/signup');
  }, []);

  const handleSignIn = useCallback(async () => {
    await markSeen();
    router.replace('/(auth)/login');
  }, []);

  const goToSlide = (index: number) => {
    scrollRef.current?.scrollTo({ x: index * SCREEN_W, animated: true });
  };

  const onScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { useNativeDriver: false }
  );

  return (
    <View style={st.container}>
      {/* Animated gradient background */}
      <Animated.View
        style={[
          st.gradientBg,
          {
            opacity: gradientAnim.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [0.4, 0.8, 0.4],
            }),
          },
        ]}
      >
        <LinearGradient
          colors={['rgba(14, 165, 233, 0.08)', 'rgba(59, 130, 246, 0.04)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {/* Skip button */}
      <Pressable
        onPress={handleSkip}
        style={[st.skipBtn, { top: insets.top + Spacing.md }]}
        hitSlop={12}
      >
        <Text style={st.skipText}>Skip</Text>
      </Pressable>

      {/* Slides */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        bounces={false}
      >
        {/* ──── Slide 1: Never Miss Another Lead ──── */}
        <View style={st.slide}>
          <View style={st.slideContent}>
            <View style={st.logoWrap}>
              <LinearGradient
                colors={['#0EA5E9', '#3B82F6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={st.logoBg}
              >
                <Ionicons name="flash" size={40} color="#fff" />
              </LinearGradient>
            </View>
            <Text style={st.heroTitle}>Never Miss{'\n'}Another Lead</Text>
            <Text style={st.heroSub}>
              AI-powered call handling that captures every opportunity for your business
            </Text>

            {/* Phone mockup */}
            <View style={st.phoneMock}>
              <LinearGradient
                colors={[Colors.bgCard, Colors.bgElevated]}
                style={st.phoneFrame}
              >
                <View style={st.phoneNotch} />
                <View style={st.phoneCallUI}>
                  <Animated.View
                    style={[
                      st.callerAvatar,
                      {
                        transform: [
                          {
                            scale: pulseAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [1, 1.08],
                            }),
                          },
                        ],
                      },
                    ]}
                  >
                    <LinearGradient
                      colors={['#0EA5E9', '#06B6D4']}
                      style={st.callerAvatarGrad}
                    >
                      <Ionicons name="person" size={24} color="#fff" />
                    </LinearGradient>
                  </Animated.View>
                  <Text style={st.callerName}>Incoming Call</Text>
                  <Text style={st.callerPhone}>(561) 555-0134</Text>
                  <View style={st.agentAnswering}>
                    <Animated.View
                      style={[
                        st.agentDotSmall,
                        {
                          opacity: pulseAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.4, 1],
                          }),
                        },
                      ]}
                    />
                    <Text style={st.agentAnsweringText}>AI Agent Answering...</Text>
                  </View>
                </View>
              </LinearGradient>
            </View>
          </View>
        </View>

        {/* ──── Slide 2: Your AI Answers 24/7 ──── */}
        <View style={st.slide}>
          <View style={st.slideContent}>
            <View style={st.slide2Visual}>
              {/* Agent status card */}
              <View style={st.agentStatusCard}>
                <View style={st.agentStatusRow}>
                  <Animated.View
                    style={[
                      st.pulseDot,
                      {
                        opacity: pulseAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.5, 1],
                        }),
                        transform: [
                          {
                            scale: pulseAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [1, 1.3],
                            }),
                          },
                        ],
                      },
                    ]}
                  />
                  <View style={st.pulseDotCore} />
                  <Text style={st.agentStatusText}>Agent Active</Text>
                  <View style={st.livePill}>
                    <Text style={st.liveText}>LIVE</Text>
                  </View>
                </View>

                {/* Waveform bars */}
                <View style={st.waveformRow}>
                  {[0.4, 0.7, 1, 0.6, 0.9, 0.5, 0.8, 1, 0.3, 0.7, 0.5, 0.9].map((h, i) => (
                    <Animated.View
                      key={i}
                      style={[
                        st.waveBar,
                        {
                          height: 24 * h,
                          opacity: 0.6 + h * 0.4,
                          transform: [
                            {
                              scaleY: waveAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [
                                  i % 2 === 0 ? 0.6 : 1,
                                  i % 2 === 0 ? 1 : 0.6,
                                ],
                              }),
                            },
                          ],
                        },
                      ]}
                    />
                  ))}
                </View>
                <Text style={st.waveLabel}>Listening & responding naturally</Text>
              </View>

              {/* Stats row */}
              <View style={st.miniStatsRow}>
                <View style={st.miniStat}>
                  <Text style={st.miniStatVal}>243</Text>
                  <Text style={st.miniStatLabel}>Calls Handled</Text>
                </View>
                <View style={[st.miniStat, st.miniStatBorder]}>
                  <Text style={st.miniStatVal}>24/7</Text>
                  <Text style={st.miniStatLabel}>Availability</Text>
                </View>
                <View style={st.miniStat}>
                  <Text style={st.miniStatVal}>98%</Text>
                  <Text style={st.miniStatLabel}>Accuracy</Text>
                </View>
              </View>
            </View>

            <Text style={st.slideTitle}>Your AI Answers 24/7</Text>
            <Text style={st.slideSub}>
              While you're busy working, your AI agent answers every call, captures lead info, and books appointments.
            </Text>
          </View>
        </View>

        {/* ──── Slide 3: Capture Every Lead ──── */}
        <View style={st.slide}>
          <View style={st.slideContent}>
            <View style={st.leadStack}>
              {[
                { name: 'Maria Gonzalez', phone: '(561) 555-0134', summary: 'Haircut, Saturday 2pm', status: 'new', offset: 0 },
                { name: 'James Wilson', phone: '(561) 555-0891', summary: 'Beard trim, this week', status: 'new', offset: 1 },
                { name: 'Sofia Reyes', phone: '(561) 555-0567', summary: 'Color appointment inquiry', status: 'contacted', offset: 2 },
              ].map((lead, i) => (
                <Animated.View
                  key={i}
                  style={[
                    st.leadPreviewCard,
                    {
                      top: i * 8,
                      transform: [
                        { scale: 1 - i * 0.03 },
                        {
                          translateY: cardFloat.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, i === 0 ? -6 : i === 1 ? -3 : 0],
                          }),
                        },
                      ],
                      zIndex: 3 - i,
                      opacity: 1 - i * 0.15,
                    },
                  ]}
                >
                  <View style={st.leadPreviewRow}>
                    <LinearGradient
                      colors={['#0EA5E9', '#06B6D4']}
                      style={st.leadPreviewAvatar}
                    >
                      <Text style={st.leadPreviewInit}>{lead.name[0]}</Text>
                    </LinearGradient>
                    <View style={st.leadPreviewInfo}>
                      <Text style={st.leadPreviewName}>{lead.name}</Text>
                      <Text style={st.leadPreviewSummary}>{lead.summary}</Text>
                      <View style={st.leadPreviewBottom}>
                        <Text style={st.leadPreviewPhone}>{lead.phone}</Text>
                        <View
                          style={[
                            st.leadPreviewBadge,
                            {
                              backgroundColor:
                                lead.status === 'new' ? Colors.electricMuted : Colors.warningGlow,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              st.leadPreviewBadgeText,
                              {
                                color:
                                  lead.status === 'new' ? Colors.electric : Colors.warning,
                              },
                            ]}
                          >
                            {lead.status === 'new' ? 'NEW' : 'CONTACTED'}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </Animated.View>
              ))}
            </View>

            <Text style={st.slideTitle}>Capture Every Lead</Text>
            <Text style={st.slideSub}>
              Every caller's info captured instantly. Name, number, what they need — all in your pocket.
            </Text>
          </View>
        </View>

        {/* ──── Slide 4: Real-Time Analytics ──── */}
        <View style={st.slide}>
          <View style={st.slideContent}>
            <View style={st.analyticsPreview}>
              {/* Mini stat cards */}
              <View style={st.analyticsStatsRow}>
                <View style={[st.analyticsStat, { borderColor: 'rgba(14, 165, 233, 0.15)' }]}>
                  <Text style={[st.analyticsStatVal, { color: Colors.electric }]}>47</Text>
                  <Text style={st.analyticsStatLabel}>LEADS</Text>
                </View>
                <View style={[st.analyticsStat, { borderColor: 'rgba(16, 185, 129, 0.15)' }]}>
                  <Text style={[st.analyticsStatVal, { color: Colors.success }]}>$4.2k</Text>
                  <Text style={st.analyticsStatLabel}>SAVED</Text>
                </View>
                <View style={[st.analyticsStat, { borderColor: 'rgba(6, 182, 212, 0.15)' }]}>
                  <Text style={[st.analyticsStatVal, { color: Colors.cyan }]}>89%</Text>
                  <Text style={st.analyticsStatLabel}>CAPTURE</Text>
                </View>
              </View>

              {/* Bar chart mockup */}
              <View style={st.chartWrap}>
                <View style={st.chartBars}>
                  {[0.3, 0.55, 0.45, 0.8, 0.65, 1, 0.7].map((h, i) => (
                    <Animated.View
                      key={i}
                      style={[
                        st.chartBar,
                        {
                          height: `${h * 100}%`,
                          transform: [
                            {
                              scaleY: cardFloat.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0.9, 1],
                              }),
                            },
                          ],
                        },
                      ]}
                    >
                      <LinearGradient
                        colors={['#0EA5E9', 'rgba(14, 165, 233, 0.3)']}
                        start={{ x: 0.5, y: 0 }}
                        end={{ x: 0.5, y: 1 }}
                        style={StyleSheet.absoluteFill}
                      />
                    </Animated.View>
                  ))}
                </View>
                <View style={st.chartLabels}>
                  {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                    <Text key={i} style={st.chartLabel}>{d}</Text>
                  ))}
                </View>
              </View>
            </View>

            <Text style={st.slideTitle}>Real-Time Analytics</Text>
            <Text style={st.slideSub}>
              Track your leads, revenue saved, and conversion rates in real-time.
            </Text>
          </View>
        </View>

        {/* ──── Slide 5: CTA ──── */}
        <View style={st.slide}>
          <View style={[st.slideContent, st.ctaSlide]}>
            <View style={st.ctaLogoWrap}>
              <LinearGradient
                colors={['#0EA5E9', '#3B82F6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={st.ctaLogoBg}
              >
                <Ionicons name="flash" size={36} color="#fff" />
              </LinearGradient>
            </View>
            <Text style={st.ctaTitle}>Ready to 10x{'\n'}Your Business?</Text>
            <Text style={st.ctaSub}>
              Join thousands of businesses using Conduit AI to capture more leads and grow revenue.
            </Text>

            <View style={st.ctaButtons}>
              <Button
                title="Create Account"
                onPress={handleGetStarted}
                fullWidth
                size="lg"
              />
              <View style={{ height: Spacing.md }} />
              <Button
                title="Already have an account? Sign In"
                onPress={handleSignIn}
                variant="ghost"
                fullWidth
                size="lg"
                textStyle={{ fontSize: TypeScale.bodySm, color: Colors.textSecondary }}
              />
            </View>

            <Text style={st.ctaNote}>14 days free · No credit card required</Text>
          </View>
        </View>
      </ScrollView>

      {/* Dot indicators */}
      <View style={[st.dotsRow, { bottom: insets.bottom + Spacing['2xl'] }]}>
        {Array.from({ length: TOTAL_SLIDES }).map((_, i) => {
          const inputRange = [(i - 1) * SCREEN_W, i * SCREEN_W, (i + 1) * SCREEN_W];
          const dotWidth = scrollX.interpolate({
            inputRange,
            outputRange: [8, 24, 8],
            extrapolate: 'clamp',
          });
          const dotOpacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.3, 1, 0.3],
            extrapolate: 'clamp',
          });
          return (
            <Pressable key={i} onPress={() => goToSlide(i)}>
              <Animated.View
                style={[
                  st.dot,
                  { width: dotWidth, opacity: dotOpacity },
                ]}
              />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/* ─── Styles ─── */
const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgVoid },

  gradientBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  skipBtn: {
    position: 'absolute',
    right: Spacing.xl,
    zIndex: 10,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
  },
  skipText: {
    ...Fonts.bodyMedium,
    fontSize: TypeScale.body,
    color: Colors.textMuted,
  },

  /* Slide base */
  slide: { width: SCREEN_W, height: SCREEN_H },
  slideContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing['2xl'],
    paddingBottom: 80,
  },

  /* Slide titles */
  heroTitle: {
    ...Fonts.displayBold,
    fontSize: 34,
    color: Colors.textPrimary,
    textAlign: 'center',
    letterSpacing: -1,
    lineHeight: 40,
    marginBottom: Spacing.md,
  },
  heroSub: {
    ...Fonts.body,
    fontSize: TypeScale.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: TypeScale.body * 1.6,
    marginBottom: Spacing['2xl'],
  },
  slideTitle: {
    ...Fonts.displayBold,
    fontSize: TypeScale.h1,
    color: Colors.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.5,
    marginTop: Spacing['2xl'],
    marginBottom: Spacing.sm,
  },
  slideSub: {
    ...Fonts.body,
    fontSize: TypeScale.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: TypeScale.body * 1.6,
    paddingHorizontal: Spacing.base,
  },

  /* ── Slide 1: Logo + Phone ── */
  logoWrap: { marginBottom: Spacing.xl },
  logoBg: {
    width: 80,
    height: 80,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneMock: { width: 220, alignItems: 'center' },
  phoneFrame: {
    width: 220,
    borderRadius: BorderRadius['2xl'],
    borderWidth: 1,
    borderColor: Colors.borderLight,
    paddingTop: Spacing.base,
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
  },
  phoneNotch: {
    width: 80,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.bgVoid,
    marginBottom: Spacing.xl,
  },
  phoneCallUI: { alignItems: 'center', gap: Spacing.sm },
  callerAvatar: { marginBottom: Spacing.sm },
  callerAvatarGrad: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  callerName: {
    ...Fonts.bodySemibold,
    fontSize: TypeScale.h3,
    color: Colors.textPrimary,
  },
  callerPhone: {
    ...Fonts.mono,
    fontSize: TypeScale.bodySm,
    color: Colors.textSecondary,
  },
  agentAnswering: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    backgroundColor: Colors.successGlow,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.full,
  },
  agentDotSmall: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.success,
  },
  agentAnsweringText: {
    ...Fonts.bodyMedium,
    fontSize: TypeScale.caption,
    color: Colors.success,
  },

  /* ── Slide 2: Agent Status ── */
  slide2Visual: { width: '100%', gap: Spacing.base },
  agentStatusCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
  },
  agentStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  pulseDot: {
    position: 'absolute',
    left: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.3)',
  },
  pulseDotCore: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.success,
    marginRight: Spacing.md,
  },
  agentStatusText: {
    ...Fonts.bodySemibold,
    fontSize: TypeScale.h4,
    color: Colors.textPrimary,
    flex: 1,
  },
  livePill: {
    backgroundColor: Colors.successGlow,
    paddingHorizontal: Spacing.md,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  liveText: {
    ...Fonts.monoBold,
    fontSize: TypeScale.tiny,
    color: Colors.success,
    letterSpacing: 1,
  },
  waveformRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: 28,
    marginBottom: Spacing.md,
  },
  waveBar: {
    width: 4,
    borderRadius: 2,
    backgroundColor: Colors.electric,
  },
  waveLabel: {
    ...Fonts.body,
    fontSize: TypeScale.caption,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  miniStatsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  miniStat: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.base,
  },
  miniStatBorder: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: Colors.border,
  },
  miniStatVal: {
    ...Fonts.monoBold,
    fontSize: TypeScale.h3,
    color: Colors.textPrimary,
  },
  miniStatLabel: {
    ...Fonts.body,
    fontSize: TypeScale.tiny,
    color: Colors.textMuted,
    marginTop: 2,
  },

  /* ── Slide 3: Lead Cards ── */
  leadStack: {
    width: '100%',
    height: 220,
    position: 'relative',
    marginBottom: Spacing.sm,
  },
  leadPreviewCard: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
  },
  leadPreviewRow: { flexDirection: 'row', gap: Spacing.md },
  leadPreviewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leadPreviewInit: { ...Fonts.displayBold, fontSize: TypeScale.h4, color: '#fff' },
  leadPreviewInfo: { flex: 1, gap: 3 },
  leadPreviewName: { ...Fonts.bodySemibold, fontSize: TypeScale.body, color: Colors.textPrimary },
  leadPreviewSummary: { ...Fonts.body, fontSize: TypeScale.bodySm, color: Colors.textSecondary },
  leadPreviewBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 3,
  },
  leadPreviewPhone: { ...Fonts.mono, fontSize: TypeScale.caption, color: Colors.textMuted },
  leadPreviewBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  leadPreviewBadgeText: { ...Fonts.monoBold, fontSize: 9, letterSpacing: 0.5 },

  /* ── Slide 4: Analytics ── */
  analyticsPreview: { width: '100%', gap: Spacing.base },
  analyticsStatsRow: { flexDirection: 'row', gap: Spacing.sm },
  analyticsStat: {
    flex: 1,
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    alignItems: 'center',
  },
  analyticsStatVal: {
    ...Fonts.monoBold,
    fontSize: TypeScale.h2,
    letterSpacing: -0.5,
  },
  analyticsStatLabel: {
    ...Fonts.bodyMedium,
    fontSize: TypeScale.tiny,
    color: Colors.textMuted,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  chartWrap: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.base,
  },
  chartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 100,
    gap: Spacing.sm,
    paddingHorizontal: Spacing.sm,
  },
  chartBar: {
    flex: 1,
    borderRadius: 3,
    overflow: 'hidden',
  },
  chartLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.sm,
    marginTop: Spacing.sm,
  },
  chartLabel: {
    ...Fonts.body,
    fontSize: TypeScale.tiny,
    color: Colors.textMuted,
    flex: 1,
    textAlign: 'center',
  },

  /* ── Slide 5: CTA ── */
  ctaSlide: { justifyContent: 'center' },
  ctaLogoWrap: { marginBottom: Spacing['2xl'] },
  ctaLogoBg: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaTitle: {
    ...Fonts.displayBold,
    fontSize: 32,
    color: Colors.textPrimary,
    textAlign: 'center',
    letterSpacing: -1,
    lineHeight: 38,
    marginBottom: Spacing.md,
  },
  ctaSub: {
    ...Fonts.body,
    fontSize: TypeScale.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: TypeScale.body * 1.6,
    marginBottom: Spacing['3xl'],
    paddingHorizontal: Spacing.base,
  },
  ctaButtons: { width: '100%' },
  ctaNote: {
    ...Fonts.body,
    fontSize: TypeScale.caption,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.lg,
  },

  /* ── Dots ── */
  dotsRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.electric,
  },
});
