import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Linking,
  Alert,
  ActivityIndicator,
  Animated,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Button } from '../../components/ui/Button';
import { Colors } from '../../constants/colors';
import { Fonts, TypeScale, TextStyles } from '../../constants/typography';
import { Spacing, BorderRadius, ScreenPadding } from '../../constants/layout';
import { api } from '../../lib/api';
import type { CallDetails, TranscriptMessage } from '../../lib/api';

const { width: SCREEN_W } = Dimensions.get('window');

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

// ── Helpers ──────────────────────────────────────────────────

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTime(d: string) {
  return new Date(d).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ── Mock Data ────────────────────────────────────────────────

const MOCK_CALL: CallDetails = {
  id: '1',
  caller_name: 'Maria Gonzalez',
  caller_phone: '(561) 555-0134',
  service_requested: 'Haircut and color appointment',
  status: 'captured',
  created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  duration: 132,
  audio_url: 'https://storage.conduitai.io/recordings/mock-001.mp3',
  lead_id: '1',
  transcript: [
    { speaker: 'ai', text: "Hi, thank you for calling! How can I help you today?", timestamp: 0 },
    { speaker: 'caller', text: "Hi, I'd like to book a haircut and color appointment for this weekend.", timestamp: 8 },
    { speaker: 'ai', text: "I'd be happy to help you with that! Can I get your name, please?", timestamp: 18 },
    { speaker: 'caller', text: "Sure, it's Maria Gonzalez.", timestamp: 28 },
    { speaker: 'ai', text: "Thank you, Maria! Do you have a preferred date and time?", timestamp: 38 },
    { speaker: 'caller', text: "Saturday afternoon, around 2 PM if possible.", timestamp: 50 },
    { speaker: 'ai', text: "We have a 2 PM slot available this Saturday. Shall I book that for you?", timestamp: 65 },
    { speaker: 'caller', text: "That's perfect, yes please!", timestamp: 80 },
    { speaker: 'ai', text: "You're all set! Haircut and color at 2 PM Saturday. We'll send a confirmation text. Anything else I can help with?", timestamp: 90 },
    { speaker: 'caller', text: "No, that's everything. Thank you so much!", timestamp: 110 },
    { speaker: 'ai', text: "You're welcome, Maria! We look forward to seeing you Saturday. Have a great day!", timestamp: 118 },
  ],
  ai_performance: {
    response_time: 1.2,
    sentiment: 'positive',
    lead_quality: 87,
    captured_fields: ['Name', 'Phone', 'Service', 'Preferred Time'],
  },
};

// ── Shimmer Overlay ──────────────────────────────────────────

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

// ── Section Label ────────────────────────────────────────────

function SectionLabel({ children }: { children: string }) {
  return (
    <View style={st.sectionLabelRow}>
      <View style={st.sectionDot} />
      <Text style={st.sectionLabel}>{children}</Text>
    </View>
  );
}

// ── Fade In Section ──────────────────────────────────────────

function FadeInSection({ delay, children }: { delay: number; children: React.ReactNode }) {
  const fadeIn = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeIn, { toValue: 1, duration: 500, delay, useNativeDriver: true }).start();
  }, []);
  return (
    <Animated.View
      style={{
        opacity: fadeIn,
        transform: [{ translateY: fadeIn.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
      }}
    >
      {children}
    </Animated.View>
  );
}

// ── Status Badge ─────────────────────────────────────────────

function StatusBadge({ status }: { status: CallDetails['status'] }) {
  const config = {
    captured: { label: 'Captured', color: Colors.success, icon: 'checkmark-circle' as IoniconsName },
    missed: { label: 'Missed', color: Colors.danger, icon: 'close-circle' as IoniconsName },
    in_progress: { label: 'In Progress', color: Colors.warning, icon: 'time' as IoniconsName },
  }[status];

  return (
    <View style={[st.statusBadge, { backgroundColor: `${config.color}15` }]}>
      <Ionicons name={config.icon} size={14} color={config.color} />
      <Text style={[st.statusBadgeText, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

// ── Action Button ────────────────────────────────────────────

function ActionButton({
  icon,
  label,
  colors,
  onPress,
}: {
  icon: IoniconsName;
  label: string;
  colors: readonly [string, string];
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Pressable
      onPressIn={() => Animated.spring(scale, { toValue: 0.9, useNativeDriver: true, friction: 8 }).start()}
      onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 8 }).start()}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={st.actionBtn}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <LinearGradient
          colors={colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={st.actionCircle}
        >
          <Ionicons name={icon} size={22} color="#fff" />
        </LinearGradient>
      </Animated.View>
      <Text style={st.actionLabel}>{label}</Text>
    </Pressable>
  );
}

// ── Waveform Player ──────────────────────────────────────────

const WAVEFORM_BARS = Array.from({ length: 40 }, () => 0.15 + Math.random() * 0.85);

function WaveformPlayer({
  duration,
  currentTime,
  isPlaying,
  speed,
  onPlayPause,
  onSkip,
  onSpeedChange,
}: {
  duration: number;
  currentTime: number;
  isPlaying: boolean;
  speed: number;
  onPlayPause: () => void;
  onSkip: (seconds: number) => void;
  onSpeedChange: (s: number) => void;
}) {
  const waveAnim = useRef(new Animated.Value(0)).current;
  const playScale = useRef(new Animated.Value(1)).current;
  const progress = duration > 0 ? currentTime / duration : 0;

  useEffect(() => {
    if (isPlaying) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(waveAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
          Animated.timing(waveAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    } else {
      waveAnim.stopAnimation();
      waveAnim.setValue(0);
    }
  }, [isPlaying]);

  return (
    <View>
      {/* Waveform bars */}
      <View style={st.waveformContainer}>
        {WAVEFORM_BARS.map((h, i) => {
          const barProgress = i / WAVEFORM_BARS.length;
          const isActive = barProgress <= progress;
          return (
            <Animated.View
              key={i}
              style={[
                st.waveBar,
                {
                  height: `${h * 100}%`,
                  backgroundColor: isActive ? Colors.electric : Colors.bgElevated,
                  opacity: isActive ? 1 : 0.5,
                  transform: isPlaying
                    ? [
                        {
                          scaleY: waveAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [i % 3 === 0 ? 0.8 : 1, i % 3 === 0 ? 1 : 0.8],
                          }),
                        },
                      ]
                    : [],
                },
              ]}
            />
          );
        })}
      </View>

      {/* Time display */}
      <View style={st.timeRow}>
        <Text style={st.timeText}>{formatDuration(currentTime)}</Text>
        <Text style={st.timeText}>{formatDuration(duration)}</Text>
      </View>

      {/* Controls */}
      <View style={st.controlsRow}>
        <Pressable
          onPress={() => {
            Haptics.selectionAsync();
            onSkip(-15);
          }}
          hitSlop={12}
          style={st.skipBtn}
        >
          <Ionicons name="play-back" size={22} color={Colors.textSecondary} />
          <Text style={st.skipText}>15</Text>
        </Pressable>

        <Pressable
          onPressIn={() => Animated.spring(playScale, { toValue: 0.9, useNativeDriver: true, friction: 8 }).start()}
          onPressOut={() => Animated.spring(playScale, { toValue: 1, useNativeDriver: true, friction: 8 }).start()}
          onPress={onPlayPause}
        >
          <Animated.View style={{ transform: [{ scale: playScale }] }}>
            <LinearGradient
              colors={Colors.gradientElectric}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={st.playButton}
            >
              <Ionicons
                name={isPlaying ? 'pause' : 'play'}
                size={30}
                color="#fff"
                style={!isPlaying ? { marginLeft: 3 } : undefined}
              />
            </LinearGradient>
          </Animated.View>
        </Pressable>

        <Pressable
          onPress={() => {
            Haptics.selectionAsync();
            onSkip(15);
          }}
          hitSlop={12}
          style={st.skipBtn}
        >
          <Text style={st.skipText}>15</Text>
          <Ionicons name="play-forward" size={22} color={Colors.textSecondary} />
        </Pressable>
      </View>

      {/* Speed toggle */}
      <View style={st.speedRow}>
        {[0.5, 1, 1.5, 2].map((s) => (
          <Pressable
            key={s}
            onPress={() => {
              Haptics.selectionAsync();
              onSpeedChange(s);
            }}
            style={[st.speedPill, speed === s && st.speedPillActive]}
          >
            <Text style={[st.speedPillText, speed === s && st.speedPillTextActive]}>
              {s}x
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

// ── Transcript Bubble ────────────────────────────────────────

function TranscriptBubble({
  message,
  index,
  isHighlighted,
}: {
  message: TranscriptMessage;
  index: number;
  isHighlighted: boolean;
}) {
  const fadeIn = useRef(new Animated.Value(0)).current;
  const isAI = message.speaker === 'ai';

  useEffect(() => {
    Animated.timing(fadeIn, { toValue: 1, duration: 400, delay: index * 60, useNativeDriver: true }).start();
  }, []);

  return (
    <Animated.View
      style={[
        st.bubbleRow,
        isAI ? st.bubbleRowLeft : st.bubbleRowRight,
        {
          opacity: fadeIn,
          transform: [{ translateY: fadeIn.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
        },
      ]}
    >
      <View
        style={[
          st.bubble,
          isAI ? st.bubbleAI : st.bubbleCaller,
          isHighlighted && st.bubbleHighlighted,
        ]}
      >
        <Text style={[st.bubbleSender, { color: isAI ? Colors.electric : Colors.warning }]}>
          {isAI ? 'AI Agent' : 'Caller'}
        </Text>
        <Text style={st.bubbleText}>{message.text}</Text>
        <Text style={st.bubbleTimestamp}>{formatDuration(message.timestamp)}</Text>
      </View>
    </Animated.View>
  );
}

// ── Circular Score ───────────────────────────────────────────

function CircularScore({ score }: { score: number }) {
  const size = 88;
  const sw = 5;
  const r = size / 2;
  const pct = Math.min(score, 100) / 100;
  const deg = pct * 360;

  const pulseAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 2000, useNativeDriver: false }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 2000, useNativeDriver: false }),
      ])
    ).start();
  }, []);

  const shadowOp = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.15, 0.4] });

  return (
    <Animated.View
      style={[
        st.scoreOuter,
        {
          shadowColor: Colors.electric,
          shadowOpacity: shadowOp as any,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 0 },
        },
      ]}
    >
      <View style={{ width: size, height: size }}>
        {/* Background ring */}
        <View
          style={{
            ...StyleSheet.absoluteFillObject,
            borderRadius: r,
            borderWidth: sw,
            borderColor: Colors.bgElevated,
          }}
        />

        {/* Right half progress */}
        <View
          style={{
            position: 'absolute',
            width: r,
            height: size,
            left: r,
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              width: size,
              height: size,
              borderRadius: r,
              borderWidth: sw,
              borderColor: 'transparent',
              borderTopColor: Colors.electric,
              borderRightColor: Colors.electric,
              left: -r,
              transform: [{ rotateZ: `${Math.min(deg, 180)}deg` }],
            }}
          />
        </View>

        {/* Left half progress */}
        {deg > 180 && (
          <View
            style={{
              position: 'absolute',
              width: r,
              height: size,
              overflow: 'hidden',
            }}
          >
            <View
              style={{
                width: size,
                height: size,
                borderRadius: r,
                borderWidth: sw,
                borderColor: 'transparent',
                borderBottomColor: Colors.cyan,
                borderLeftColor: Colors.cyan,
                transform: [{ rotateZ: `${deg - 180}deg` }],
              }}
            />
          </View>
        )}

        {/* Center text */}
        <View style={st.scoreCenter}>
          <Text style={st.scoreNum}>{score}</Text>
          <Text style={st.scoreMax}>/100</Text>
        </View>
      </View>
    </Animated.View>
  );
}

// ── Main Screen ──────────────────────────────────────────────

export default function CallDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);

  const [call, setCall] = useState<CallDetails | null>(null);
  const [loading, setLoading] = useState(true);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [speed, setSpeed] = useState(1);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Header animation
  const headerFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await api.getCallDetails(id!);
        if (mounted) setCall(data);
      } catch {
        if (mounted) setCall({ ...MOCK_CALL, id: id! });
      } finally {
        if (mounted) {
          setLoading(false);
          Animated.timing(headerFade, { toValue: 1, duration: 500, useNativeDriver: true }).start();
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  // Playback timer
  useEffect(() => {
    if (isPlaying && call) {
      timerRef.current = setInterval(() => {
        setCurrentTime((prev) => {
          const next = prev + 0.1 * speed;
          if (next >= call.duration) {
            setIsPlaying(false);
            return 0;
          }
          return next;
        });
      }, 100);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, speed, call]);

  const handlePlayPause = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsPlaying((prev) => !prev);
  }, []);

  const handleSkip = useCallback(
    (seconds: number) => {
      if (!call) return;
      setCurrentTime((prev) => Math.max(0, Math.min(call.duration, prev + seconds)));
    },
    [call]
  );

  const handleCall = useCallback(() => {
    if (call?.caller_phone) Linking.openURL(`tel:${call.caller_phone.replace(/\D/g, '')}`);
  }, [call]);

  const handleSMS = useCallback(() => {
    if (call?.caller_phone) Linking.openURL(`sms:${call.caller_phone.replace(/\D/g, '')}`);
  }, [call]);

  const handleViewLead = useCallback(() => {
    if (call?.lead_id) router.push(`/lead/${call.lead_id}` as any);
  }, [call, router]);

  const handleMarkContacted = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert('Status Updated', 'This lead has been marked as contacted.');
  }, []);

  const handleArchive = useCallback(() => {
    Alert.alert('Archive Call', 'Are you sure you want to archive this call?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Archive',
        style: 'destructive',
        onPress: () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          router.back();
        },
      },
    ]);
  }, [router]);

  // Find current transcript message
  const currentMsgIndex = call
    ? call.transcript.findIndex((m, i) => {
        const next = call.transcript[i + 1];
        return currentTime >= m.timestamp && (!next || currentTime < next.timestamp);
      })
    : -1;

  // ── Loading ──
  if (loading || !call) {
    return (
      <View style={[st.loadingWrap, { paddingTop: insets.top }]}>
        <LinearGradient
          colors={[Colors.bgPrimary, Colors.bgPrimary, 'rgba(14, 165, 233, 0.03)']}
          locations={[0, 0.7, 1]}
          style={StyleSheet.absoluteFill}
        />
        <Pressable onPress={() => router.back()} style={st.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </Pressable>
        <View style={st.loadingCenter}>
          {loading ? (
            <ActivityIndicator size="large" color={Colors.electric} />
          ) : (
            <>
              <Ionicons name="alert-circle-outline" size={48} color={Colors.textMuted} />
              <Text style={st.loadingText}>Call not found</Text>
            </>
          )}
        </View>
      </View>
    );
  }

  const sentimentConfig = {
    positive: { color: Colors.success, label: 'Positive', icon: 'happy-outline' as IoniconsName },
    neutral: { color: Colors.warning, label: 'Neutral', icon: 'remove-circle-outline' as IoniconsName },
    negative: { color: Colors.danger, label: 'Negative', icon: 'sad-outline' as IoniconsName },
  }[call.ai_performance.sentiment];

  return (
    <View style={st.screen}>
      <LinearGradient
        colors={[Colors.bgPrimary, Colors.bgPrimary, 'rgba(14, 165, 233, 0.03)']}
        locations={[0, 0.7, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={{ paddingTop: insets.top }}>
        {/* Header */}
        <View style={st.header}>
          <Pressable onPress={() => router.back()} style={st.backBtn} hitSlop={8}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </Pressable>
          <View style={st.headerCenter}>
            <Text style={st.headerTitle}>Call Details</Text>
            <Text style={st.headerSubtitle}>
              {formatDate(call.created_at)} at {formatTime(call.created_at)}
            </Text>
          </View>
          <StatusBadge status={call.status} />
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        style={st.scrollView}
        contentContainerStyle={st.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Caller Info Card ── */}
        <FadeInSection delay={0}>
          <View style={st.card}>
            <ShimmerOverlay />
            <View style={st.callerInfoContent}>
              <LinearGradient
                colors={Colors.gradientElectric}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={st.callerAvatar}
              >
                <Text style={st.callerAvatarText}>{call.caller_name.charAt(0)}</Text>
              </LinearGradient>

              <Text style={st.callerName}>{call.caller_name}</Text>

              <Pressable
                onPress={handleCall}
                style={st.phoneRow}
                hitSlop={8}
              >
                <Ionicons name="call-outline" size={14} color={Colors.electric} />
                <Text style={st.phoneText}>{call.caller_phone}</Text>
              </Pressable>

              <View style={st.serviceRow}>
                <Ionicons name="briefcase-outline" size={14} color={Colors.textMuted} />
                <Text style={st.serviceText}>{call.service_requested}</Text>
              </View>
            </View>

            {/* Action buttons */}
            <View style={st.actionsRow}>
              <ActionButton
                icon="call"
                label="Call Back"
                colors={[Colors.success, '#059669'] as const}
                onPress={handleCall}
              />
              <ActionButton
                icon="chatbubble"
                label="Send SMS"
                colors={Colors.gradientElectric}
                onPress={handleSMS}
              />
              {call.lead_id && (
                <ActionButton
                  icon="person"
                  label="View Lead"
                  colors={[Colors.warning, '#D97706'] as const}
                  onPress={handleViewLead}
                />
              )}
            </View>
          </View>
        </FadeInSection>

        {/* ── Audio Playback ── */}
        <FadeInSection delay={100}>
          <SectionLabel>Audio Playback</SectionLabel>
          <View style={st.card}>
            <ShimmerOverlay />
            <WaveformPlayer
              duration={call.duration}
              currentTime={currentTime}
              isPlaying={isPlaying}
              speed={speed}
              onPlayPause={handlePlayPause}
              onSkip={handleSkip}
              onSpeedChange={setSpeed}
            />
          </View>
        </FadeInSection>

        {/* ── Transcript ── */}
        <FadeInSection delay={200}>
          <SectionLabel>Transcript</SectionLabel>
          <View style={st.card}>
            <ShimmerOverlay />
            {call.transcript.map((msg, i) => (
              <TranscriptBubble
                key={i}
                message={msg}
                index={i}
                isHighlighted={i === currentMsgIndex}
              />
            ))}
          </View>
        </FadeInSection>

        {/* ── AI Performance ── */}
        <FadeInSection delay={300}>
          <SectionLabel>Call Analysis</SectionLabel>
          <View style={st.card}>
            <ShimmerOverlay />

            {/* Metrics row */}
            <View style={st.metricsRow}>
              <View style={st.metricItem}>
                <Ionicons name="time-outline" size={18} color={Colors.electric} />
                <Text style={st.metricValue}>{formatDuration(call.duration)}</Text>
                <Text style={st.metricLabel}>Duration</Text>
              </View>
              <View style={st.metricDivider} />
              <View style={st.metricItem}>
                <Ionicons name="flash-outline" size={18} color={Colors.cyan} />
                <Text style={st.metricValue}>{call.ai_performance.response_time}s</Text>
                <Text style={st.metricLabel}>Response</Text>
              </View>
              <View style={st.metricDivider} />
              <View style={st.metricItem}>
                <Ionicons name={sentimentConfig.icon} size={18} color={sentimentConfig.color} />
                <Text style={[st.metricValue, { color: sentimentConfig.color }]}>
                  {sentimentConfig.label}
                </Text>
                <Text style={st.metricLabel}>Sentiment</Text>
              </View>
            </View>

            {/* Captured fields */}
            <View style={st.capturedSection}>
              <Text style={st.capturedTitle}>Information Captured</Text>
              <View style={st.chipRow}>
                {call.ai_performance.captured_fields.map((field) => (
                  <View key={field} style={st.chip}>
                    <Ionicons name="checkmark-circle" size={12} color={Colors.success} />
                    <Text style={st.chipText}>{field}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Lead Quality Score */}
            <View style={st.qualitySection}>
              <View style={st.qualityLeft}>
                <Text style={st.qualityTitle}>Lead Quality</Text>
                <Text style={st.qualityDesc}>
                  Based on captured information, caller intent, and engagement level.
                </Text>
              </View>
              <CircularScore score={call.ai_performance.lead_quality} />
            </View>
          </View>
        </FadeInSection>

        {/* ── Actions Footer ── */}
        <FadeInSection delay={400}>
          <View style={st.footerActions}>
            <Button
              title="Mark as Contacted"
              onPress={handleMarkContacted}
              size="lg"
              fullWidth
            />
            <Pressable onPress={handleArchive} style={st.archiveBtn}>
              <Text style={st.archiveText}>Archive Call</Text>
            </Pressable>
          </View>
        </FadeInSection>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────

const st = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bgPrimary },
  shimmer: { position: 'absolute', top: 0, bottom: 0, width: SCREEN_W * 0.6, zIndex: 1 },

  /* Loading */
  loadingWrap: { flex: 1, backgroundColor: Colors.bgPrimary, paddingHorizontal: ScreenPadding.horizontal },
  loadingCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  loadingText: { ...TextStyles.body, color: Colors.textMuted },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ScreenPadding.horizontal,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: { flex: 1 },
  headerTitle: { ...Fonts.bodySemibold, fontSize: TypeScale.h4, color: Colors.textPrimary },
  headerSubtitle: { ...Fonts.mono, fontSize: TypeScale.caption, color: Colors.textMuted, marginTop: 2 },

  /* Status Badge */
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.full,
  },
  statusBadgeText: {
    ...Fonts.bodySemibold,
    fontSize: TypeScale.tiny,
    letterSpacing: 0.3,
  },

  /* Scroll */
  scrollView: { flex: 1 },
  scroll: { paddingHorizontal: ScreenPadding.horizontal },

  /* Card */
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.base,
    overflow: 'hidden',
  },

  /* Section Label */
  sectionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  sectionDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.electric },
  sectionLabel: {
    ...Fonts.bodyMedium,
    fontSize: TypeScale.caption,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  /* Caller Info */
  callerInfoContent: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  callerAvatar: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  callerAvatarText: { ...Fonts.displayBold, fontSize: TypeScale.h1, color: '#fff' },
  callerName: { ...TextStyles.h2, color: Colors.textPrimary },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  phoneText: {
    ...Fonts.mono,
    fontSize: TypeScale.bodySm,
    color: Colors.electric,
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  serviceText: {
    ...Fonts.body,
    fontSize: TypeScale.bodySm,
    color: Colors.textSecondary,
  },

  /* Actions */
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing['2xl'],
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  actionBtn: { alignItems: 'center', gap: Spacing.sm },
  actionCircle: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: { ...Fonts.bodyMedium, fontSize: TypeScale.caption, color: Colors.textSecondary },

  /* Waveform */
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 64,
    gap: 2,
    marginBottom: Spacing.md,
  },
  waveBar: {
    flex: 1,
    borderRadius: 2,
    minHeight: 4,
  },

  /* Time */
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  timeText: {
    ...Fonts.mono,
    fontSize: TypeScale.caption,
    color: Colors.textMuted,
  },

  /* Controls */
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing['2xl'],
    marginBottom: Spacing.lg,
  },
  skipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  skipText: {
    ...Fonts.monoBold,
    fontSize: TypeScale.tiny,
    color: Colors.textSecondary,
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.electric,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },

  /* Speed */
  speedRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  speedPill: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.bgInput,
  },
  speedPillActive: {
    backgroundColor: Colors.electric,
  },
  speedPillText: {
    ...Fonts.monoBold,
    fontSize: TypeScale.caption,
    color: Colors.textMuted,
  },
  speedPillTextActive: {
    color: '#fff',
  },

  /* Transcript Bubbles */
  bubbleRow: {
    marginBottom: Spacing.sm,
  },
  bubbleRowLeft: { alignItems: 'flex-start' },
  bubbleRowRight: { alignItems: 'flex-end' },
  bubble: {
    maxWidth: '85%',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  bubbleAI: {
    backgroundColor: Colors.bgElevated,
    borderWidth: 1,
    borderColor: Colors.borderElectric,
    borderBottomLeftRadius: BorderRadius.sm,
  },
  bubbleCaller: {
    backgroundColor: Colors.bgInput,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderBottomRightRadius: BorderRadius.sm,
  },
  bubbleHighlighted: {
    borderColor: Colors.electric,
    backgroundColor: `${Colors.electric}10`,
  },
  bubbleSender: {
    ...Fonts.bodySemibold,
    fontSize: TypeScale.tiny,
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  bubbleText: {
    ...Fonts.body,
    fontSize: TypeScale.bodySm,
    color: Colors.textSecondary,
    lineHeight: TypeScale.bodySm * 1.5,
  },
  bubbleTimestamp: {
    ...Fonts.mono,
    fontSize: 9,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
    textAlign: 'right',
  },

  /* Metrics */
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  metricValue: {
    ...Fonts.monoBold,
    fontSize: TypeScale.h4,
    color: Colors.textPrimary,
  },
  metricLabel: {
    ...Fonts.body,
    fontSize: TypeScale.tiny,
    color: Colors.textMuted,
  },
  metricDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.border,
  },

  /* Captured Fields */
  capturedSection: {
    paddingVertical: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  capturedTitle: {
    ...Fonts.bodyMedium,
    fontSize: TypeScale.caption,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.successGlow,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.full,
  },
  chipText: {
    ...Fonts.bodyMedium,
    fontSize: TypeScale.caption,
    color: Colors.success,
  },

  /* Quality Score */
  qualitySection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Spacing.base,
    gap: Spacing.lg,
  },
  qualityLeft: {
    flex: 1,
  },
  qualityTitle: {
    ...Fonts.bodySemibold,
    fontSize: TypeScale.body,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  qualityDesc: {
    ...Fonts.body,
    fontSize: TypeScale.caption,
    color: Colors.textMuted,
    lineHeight: TypeScale.caption * 1.5,
  },
  scoreOuter: {
    elevation: 8,
  },
  scoreCenter: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreNum: {
    ...Fonts.monoBold,
    fontSize: TypeScale.h1,
    color: Colors.textPrimary,
  },
  scoreMax: {
    ...Fonts.mono,
    fontSize: TypeScale.tiny,
    color: Colors.textMuted,
    marginTop: -2,
  },

  /* Footer */
  footerActions: {
    marginTop: Spacing['2xl'],
    gap: Spacing.md,
    alignItems: 'center',
  },
  archiveBtn: {
    paddingVertical: Spacing.md,
  },
  archiveText: {
    ...Fonts.bodyMedium,
    fontSize: TypeScale.body,
    color: Colors.textMuted,
  },
});
