import { useRef, useEffect, useCallback, useState } from 'react';
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
import * as Haptics from 'expo-haptics';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../store/authStore';
import { Colors } from '../../constants/colors';
import { Fonts, TypeScale, TextStyles } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/layout';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const TOTAL_SLIDES = 5;

/* ─── Floating particles background ─── */
function Particles() {
  const particles = useRef(
    Array.from({ length: 15 }, () => ({
      left: Math.random() * SCREEN_W,
      size: 3 + Math.random() * 3,
      opacity: 0.1 + Math.random() * 0.2,
      duration: 8000 + Math.random() * 7000,
      anim: new Animated.Value(0),
    }))
  ).current;

  useEffect(() => {
    particles.forEach((p) => {
      Animated.loop(
        Animated.timing(p.anim, {
          toValue: 1,
          duration: p.duration,
          useNativeDriver: true,
        })
      ).start();
    });
  }, []);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map((p, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            left: p.left,
            bottom: -10,
            width: p.size,
            height: p.size,
            borderRadius: p.size / 2,
            backgroundColor: Colors.electric,
            opacity: p.opacity,
            transform: [
              {
                translateY: p.anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -(SCREEN_H + 20)],
                }),
              },
            ],
          }}
        />
      ))}
    </View>
  );
}

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const gradientAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;
  const cardFloat = useRef(new Animated.Value(0)).current;
  const [activeSlide, setActiveSlide] = useState(0);
  const lastPage = useRef(0);

  // Entrance animations per slide: title, subtitle, visual
  const entranceAnims = useRef(
    Array.from({ length: TOTAL_SLIDES }, () => ({
      title: new Animated.Value(0),
      sub: new Animated.Value(0),
      visual: new Animated.Value(0),
    }))
  ).current;

  const triggerEntrance = (index: number) => {
    const anim = entranceAnims[index];
    anim.title.setValue(0);
    anim.sub.setValue(0);
    anim.visual.setValue(0);
    Animated.stagger(100, [
      Animated.timing(anim.title, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(anim.sub, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(anim.visual, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  };

  const entranceStyle = (slideIndex: number, type: 'title' | 'sub' | 'visual') => {
    const anim = entranceAnims[slideIndex][type];
    return {
      opacity: anim,
      transform: [
        {
          translateY: anim.interpolate({
            inputRange: [0, 1],
            outputRange: [20, 0],
          }),
        },
      ],
    };
  };

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

    triggerEntrance(0);
  }, []);

  const markSeen = useCallback(async () => {
    await AsyncStorage.setItem('has_seen_welcome', 'true');
  }, []);

  const handleSkip = useCallback(async () => {
    await markSeen();
    router.replace('/(auth)/login');
  }, []);

  const handleGetStarted = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await markSeen();
    router.replace('/(auth)/signup');
  }, []);

  const handleSignIn = useCallback(async () => {
    await markSeen();
    router.replace('/(auth)/login');
  }, []);

  const handleExplore = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await markSeen();
    useAuthStore.getState().setGuestMode(true);
    router.replace('/(tabs)');
  }, []);

  const goToSlide = (index: number) => {
    scrollRef.current?.scrollTo({ x: index * SCREEN_W, animated: true });
  };

  const goToNextSlide = () => {
    if (activeSlide < TOTAL_SLIDES - 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      goToSlide(activeSlide + 1);
    }
  };

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = event.nativeEvent.contentOffset.x;
    scrollX.setValue(x);
    const page = Math.round(x / SCREEN_W);
    if (page !== lastPage.current && page >= 0 && page < TOTAL_SLIDES) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      lastPage.current = page;
      setActiveSlide(page);
      triggerEntrance(page);
    }
  };

  // Next arrow fades out on last slide
  const nextArrowOpacity = scrollX.interpolate({
    inputRange: [(TOTAL_SLIDES - 2) * SCREEN_W, (TOTAL_SLIDES - 1) * SCREEN_W],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

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

      {/* Floating particles */}
      <Particles />

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
            <Animated.View style={entranceStyle(0, 'title')}>
              <Text style={st.heroTitle}>Never Miss{'\n'}Another Lead</Text>
            </Animated.View>
            <Animated.View style={entranceStyle(0, 'sub')}>
              <Text style={st.heroSub}>
                AI-powered call handling that captures every opportunity for your business
              </Text>
            </Animated.View>

            {/* Phone mockup */}
            <Animated.View style={entranceStyle(0, 'visual')}>
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
            </Animated.View>
          </View>
        </View>

        {/* ──── Slide 2: Your AI Answers 24/7 ──── */}
        <View style={st.slide}>
          <View style={st.slideContent}>
            <Animated.View style={entranceStyle(1, 'visual')}>
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
            </Animated.View>

            <Animated.View style={entranceStyle(1, 'title')}>
              <Text style={st.slideTitle}>Your AI Answers 24/7</Text>
            </Animated.View>
            <Animated.View style={entranceStyle(1, 'sub')}>
              <Text style={st.slideSub}>
                While you're busy working, your AI agent answers every call, captures lead info, and books appointments.
              </Text>
            </Animated.View>
          </View>
        </View>

        {/* ──── Slide 3: Capture Every Lead ──── */}
        <View style={st.slide}>
          <View style={st.slideContent}>
            <Animated.View style={entranceStyle(2, 'visual')}>
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
            </Animated.View>

            <Animated.View style={entranceStyle(2, 'title')}>
              <Text style={st.slideTitle}>Capture Every Lead</Text>
            </Animated.View>
            <Animated.View style={entranceStyle(2, 'sub')}>
              <Text style={st.slideSub}>
                Every caller's info captured instantly. Name, number, what they need — all in your pocket.
              </Text>
            </Animated.View>
          </View>
        </View>

        {/* ──── Slide 4: Real-Time Analytics ──── */}
        <View style={st.slide}>
          <View style={st.slideContent}>
            <Animated.View style={entranceStyle(3, 'visual')}>
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
            </Animated.View>

            <Animated.View style={entranceStyle(3, 'title')}>
              <Text style={st.slideTitle}>Real-Time Analytics</Text>
            </Animated.View>
            <Animated.View style={entranceStyle(3, 'sub')}>
              <Text style={st.slideSub}>
                Track your leads, revenue saved, and conversion rates in real-time.
              </Text>
            </Animated.View>
          </View>
        </View>

        {/* ──── Slide 5: CTA ──── */}
        <View style={st.slide}>
          <View style={[st.slideContent, st.ctaSlide]}>
            <Animated.View style={entranceStyle(4, 'visual')}>
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
            </Animated.View>
            <Animated.View style={entranceStyle(4, 'title')}>
              <Text style={st.ctaTitle}>Ready to 10x{'\n'}Your Business?</Text>
            </Animated.View>
            <Animated.View style={entranceStyle(4, 'sub')}>
              <Text style={st.ctaSub}>
                Join businesses saving thousands
              </Text>
            </Animated.View>

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
              <Pressable onPress={handleExplore} style={st.exploreBtn} hitSlop={8}>
                <Text style={st.exploreText}>Explore the App First</Text>
                <Ionicons name="arrow-forward" size={14} color={Colors.electric} />
              </Pressable>
            </View>

            <View style={st.ctaPill}>
              <Text style={st.ctaPillText}>Starting at $39/mo · Solo Operator Plan</Text>
            </View>

            <Text style={st.ctaNote}>14 days free · No credit card required</Text>
          </View>
        </View>
      </ScrollView>

      {/* Next arrow button */}
      <Animated.View
        style={[
          st.nextArrowWrap,
          { bottom: insets.bottom + Spacing['2xl'] + 40, opacity: nextArrowOpacity },
        ]}
        pointerEvents={activeSlide < TOTAL_SLIDES - 1 ? 'auto' : 'none'}
      >
        <Pressable onPress={goToNextSlide} style={st.nextArrowBtn}>
          <Ionicons name="arrow-forward" size={22} color="#fff" />
        </Pressable>
      </Animated.View>

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
          const glowOpacity = scrollX.interpolate({
            inputRange,
            outputRange: [0, 0.4, 0],
            extrapolate: 'clamp',
          });
          const glowScale = scrollX.interpolate({
            inputRange,
            outputRange: [0.5, 1, 0.5],
            extrapolate: 'clamp',
          });
          return (
            <Pressable key={i} onPress={() => goToSlide(i)}>
              <View style={st.dotContainer}>
                <Animated.View
                  style={[
                    st.dotGlow,
                    { opacity: glowOpacity, transform: [{ scale: glowScale }] },
                  ]}
                />
                <Animated.View
                  style={[
                    st.dot,
                    { width: dotWidth, opacity: dotOpacity },
                  ]}
                />
              </View>
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
  ctaPill: {
    marginTop: Spacing.lg,
    backgroundColor: Colors.electricMuted,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  ctaPillText: {
    ...Fonts.bodyMedium,
    fontSize: TypeScale.caption,
    color: Colors.electric,
    textAlign: 'center',
  },
  ctaNote: {
    ...Fonts.body,
    fontSize: TypeScale.caption,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.md,
  },
  exploreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    marginTop: Spacing.xs,
  },
  exploreText: {
    ...Fonts.bodyMedium,
    fontSize: TypeScale.bodySm,
    color: Colors.electric,
  },

  /* ── Next arrow ── */
  nextArrowWrap: {
    position: 'absolute',
    right: Spacing.xl,
    zIndex: 10,
  },
  nextArrowBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.electric,
    alignItems: 'center',
    justifyContent: 'center',
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
  dotContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 16,
  },
  dotGlow: {
    position: 'absolute',
    width: 20,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.electric,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.electric,
  },
});
