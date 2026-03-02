import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Alert,
  Dimensions,
  Animated,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../../components/ui/Button';
import { Colors } from '../../constants/colors';
import { Fonts, TypeScale, TextStyles } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/layout';

const { width: W, height: H } = Dimensions.get('window');

// ── Floating Particles ────────────────────────────────────────

const PARTICLE_COUNT = 10;

function useParticles() {
  const particles = useRef(
    Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      x: Math.random() * W,
      size: 2 + Math.random() * 3,
      duration: 6000 + Math.random() * 6000,
      delay: i * 400,
      progress: new Animated.Value(0),
    }))
  ).current;

  useEffect(() => {
    particles.forEach((p) => {
      const loop = () => {
        p.progress.setValue(0);
        Animated.timing(p.progress, {
          toValue: 1,
          duration: p.duration,
          useNativeDriver: true,
          delay: p.delay,
        }).start(({ finished }) => {
          if (finished) {
            p.delay = 0;
            loop();
          }
        });
      };
      loop();
    });
  }, []);

  return particles;
}

function Particles() {
  const particles = useParticles();

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map((p, i) => {
        const translateY = p.progress.interpolate({
          inputRange: [0, 1],
          outputRange: [H + 20, -20],
        });
        const opacity = p.progress.interpolate({
          inputRange: [0, 0.1, 0.4, 0.7, 1],
          outputRange: [0, 0.6, 0.4, 0.2, 0],
        });
        return (
          <Animated.View
            key={i}
            style={{
              position: 'absolute',
              left: p.x,
              width: p.size,
              height: p.size,
              borderRadius: p.size / 2,
              backgroundColor: Colors.electric,
              opacity,
              transform: [{ translateY }],
            }}
          />
        );
      })}
    </View>
  );
}

// ── Animated Gradient Background ──────────────────────────────

function AnimatedBackground() {
  const phase = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(phase, {
        toValue: 1,
        duration: 8000,
        useNativeDriver: false,
      })
    ).start();
  }, []);

  const layer1Opacity = phase.interpolate({
    inputRange: [0, 0.33, 0.66, 1],
    outputRange: [0.5, 0.9, 0.3, 0.5],
  });
  const layer2Opacity = phase.interpolate({
    inputRange: [0, 0.33, 0.66, 1],
    outputRange: [0.2, 0.4, 0.8, 0.2],
  });

  return (
    <View style={StyleSheet.absoluteFill}>
      {/* Deep navy layer */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: layer1Opacity }]}>
        <LinearGradient
          colors={['rgba(14, 165, 233, 0.06)', 'rgba(30, 58, 95, 0.08)', 'transparent']}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.8, y: 0.7 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      {/* Deep purple layer */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: layer2Opacity }]}>
        <LinearGradient
          colors={['transparent', 'rgba(88, 28, 135, 0.05)', 'rgba(14, 165, 233, 0.04)']}
          start={{ x: 0.8, y: 0.2 }}
          end={{ x: 0.2, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
}

// ── Pulsing Logo ──────────────────────────────────────────────

function AnimatedLogo({ fadeIn }: { fadeIn: Animated.Value }) {
  const glowPulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(glowPulse, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const glowScale = glowPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.35],
  });
  const glowOpacity = glowPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.15, 0.5],
  });

  const logoScale = fadeIn.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 1],
  });

  return (
    <Animated.View
      style={[
        st.logoSection,
        { opacity: fadeIn, transform: [{ scale: logoScale }] },
      ]}
    >
      <View style={st.logoContainer}>
        {/* Glow ring */}
        <Animated.View
          style={[
            st.glowRing,
            { opacity: glowOpacity, transform: [{ scale: glowScale }] },
          ]}
        />
        <LinearGradient
          colors={['#0EA5E9', '#0284C7']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={st.logoIcon}
        >
          <Ionicons name="flash" size={42} color="#fff" />
        </LinearGradient>
      </View>
      <Text style={st.logoText}>Conduit AI</Text>
    </Animated.View>
  );
}

// ── Tagline with delayed fade ─────────────────────────────────

function AnimatedTagline({ delay }: { delay: number }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 700,
      delay,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.Text
      style={[
        st.tagline,
        {
          opacity: anim,
          transform: [
            {
              translateY: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [12, 0],
              }),
            },
          ],
        },
      ]}
    >
      Your AI-powered command center
    </Animated.Text>
  );
}

// ── Glow Input ────────────────────────────────────────────────

function GlowInput({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
  icon,
  rightIcon,
  onRightIconPress,
  fadeAnim,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (t: string) => void;
  error?: string;
  secureTextEntry?: boolean;
  keyboardType?: any;
  autoCapitalize?: any;
  icon: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
  fadeAnim: Animated.Value;
}) {
  const [focused, setFocused] = useState(false);
  const glowAnim = useRef(new Animated.Value(0)).current;
  const focusBorder = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (focused) {
      Animated.timing(focusBorder, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }).start();
      // Subtle pulsing glow when focused
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1, duration: 1500, useNativeDriver: false }),
          Animated.timing(glowAnim, { toValue: 0, duration: 1500, useNativeDriver: false }),
        ])
      ).start();
    } else {
      glowAnim.stopAnimation();
      glowAnim.setValue(0);
      Animated.timing(focusBorder, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
  }, [focused]);

  const borderColor = error
    ? Colors.danger
    : focusBorder.interpolate({
        inputRange: [0, 1],
        outputRange: [Colors.border as string, Colors.electric],
      });

  const shadowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.3],
  });

  const slideUp = fadeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [20, 0],
  });

  return (
    <Animated.View
      style={[st.glowFieldWrap, { opacity: fadeAnim, transform: [{ translateY: slideUp }] }]}
    >
      <Text style={st.glowLabel}>{label}</Text>
      <Animated.View
        style={[
          st.glowInputWrap,
          {
            borderColor,
            shadowColor: Colors.electric,
            shadowOpacity,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 0 },
          },
        ]}
      >
        <View style={st.glowIconL}>{icon}</View>
        <TextInput
          style={st.glowInput}
          placeholder={placeholder}
          placeholderTextColor={Colors.textMuted}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          selectionColor={Colors.electric}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {rightIcon && (
          <Pressable onPress={onRightIconPress} style={st.glowIconR}>
            {rightIcon}
          </Pressable>
        )}
      </Animated.View>
      {error ? <Text style={st.glowError}>{error}</Text> : null}
    </Animated.View>
  );
}

// ── Animated Sign In Button ───────────────────────────────────

function SignInButton({
  onPress,
  loading,
  fadeAnim,
}: {
  onPress: () => void;
  loading: boolean;
  fadeAnim: Animated.Value;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const sweep = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(sweep, { toValue: 1, duration: 2500, useNativeDriver: true }),
        Animated.timing(sweep, { toValue: 0, duration: 0, useNativeDriver: true }),
        Animated.delay(4000),
      ])
    ).start();
  }, []);

  const pressIn = () =>
    Animated.spring(scale, { toValue: 0.95, useNativeDriver: true, friction: 8 }).start();
  const pressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 8 }).start();

  const sweepTranslate = sweep.interpolate({
    inputRange: [0, 1],
    outputRange: [-W, W],
  });

  const slideUp = fadeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [20, 0],
  });

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideUp }],
        marginTop: Spacing.lg,
      }}
    >
      <Pressable onPressIn={pressIn} onPressOut={pressOut} onPress={onPress} disabled={loading}>
        <Animated.View style={{ transform: [{ scale }] }}>
          <LinearGradient
            colors={loading ? ['#1e3a5f', '#1a2e4a'] : ['#0EA5E9', '#0284C7']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={st.signInBtn}
          >
            {/* Sweep highlight */}
            {!loading && (
              <Animated.View
                style={[st.sweepOverlay, { transform: [{ translateX: sweepTranslate }] }]}
              >
                <LinearGradient
                  colors={[
                    'transparent',
                    'rgba(255,255,255,0.08)',
                    'rgba(255,255,255,0.15)',
                    'rgba(255,255,255,0.08)',
                    'transparent',
                  ]}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={StyleSheet.absoluteFill}
                />
              </Animated.View>
            )}
            <Text style={st.signInText}>{loading ? 'Signing In...' : 'Sign In'}</Text>
          </LinearGradient>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

// ── Main Screen ───────────────────────────────────────────────

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, isLoading } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  // Staggered entrance animations
  const logoFade = useRef(new Animated.Value(0)).current;
  const formFade = useRef(new Animated.Value(0)).current;
  const bottomFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(250, [
      Animated.timing(logoFade, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(formFade, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(bottomFade, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  const validate = () => {
    const e: typeof errors = {};
    if (!email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Enter a valid email';
    if (!password) e.password = 'Password is required';
    else if (password.length < 6) e.password = 'Must be at least 6 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    try {
      await signIn(email.trim().toLowerCase(), password);
    } catch (err: any) {
      Alert.alert('Sign In Failed', err.message || 'Check your credentials.');
    }
  };

  const bottomSlide = bottomFade.interpolate({
    inputRange: [0, 1],
    outputRange: [20, 0],
  });

  return (
    <KeyboardAvoidingView
      style={st.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <AnimatedBackground />
      <Particles />

      <View style={st.content}>
        {/* Logo + Tagline */}
        <View style={st.logoTaglineWrap}>
          <AnimatedLogo fadeIn={logoFade} />
          <AnimatedTagline delay={600} />
        </View>

        {/* Form */}
        <View style={st.formSection}>
          <GlowInput
            label="Email"
            placeholder="you@business.com"
            value={email}
            onChangeText={setEmail}
            error={errors.email}
            keyboardType="email-address"
            autoCapitalize="none"
            icon={<Ionicons name="mail-outline" size={18} color={Colors.textMuted} />}
            fadeAnim={formFade}
          />
          <View style={{ height: Spacing.base }} />
          <GlowInput
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            error={errors.password}
            secureTextEntry={!showPw}
            autoCapitalize="none"
            icon={<Ionicons name="lock-closed-outline" size={18} color={Colors.textMuted} />}
            rightIcon={
              <Ionicons
                name={showPw ? 'eye-off-outline' : 'eye-outline'}
                size={18}
                color={Colors.textMuted}
              />
            }
            onRightIconPress={() => setShowPw(!showPw)}
            fadeAnim={formFade}
          />
          <Animated.View style={{ opacity: formFade }}>
            <Pressable onPress={() => {}} style={st.forgot}>
              <Text style={st.forgotTxt}>Forgot password?</Text>
            </Pressable>
          </Animated.View>

          <SignInButton onPress={handleLogin} loading={isLoading} fadeAnim={formFade} />
        </View>

        {/* Bottom */}
        <Animated.View
          style={[st.bottom, { opacity: bottomFade, transform: [{ translateY: bottomSlide }] }]}
        >
          <View style={st.divider}>
            <View style={st.divLine} />
            <Text style={st.divTxt}>or</Text>
            <View style={st.divLine} />
          </View>
          <Button
            title="Start Free Trial"
            onPress={() => router.push('/(auth)/signup')}
            variant="secondary"
            fullWidth
            size="lg"
          />
          <Text style={st.trialNote}>14 days free · No commitment · Cancel anytime</Text>
        </Animated.View>
      </View>
    </KeyboardAvoidingView>
  );
}

// ── Styles ────────────────────────────────────────────────────

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgVoid },
  content: { flex: 1, paddingHorizontal: Spacing.xl, justifyContent: 'center' },

  /* Logo */
  logoTaglineWrap: { alignItems: 'center', marginBottom: Spacing['3xl'] },
  logoSection: { alignItems: 'center' },
  logoContainer: { alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.lg },
  glowRing: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 36,
    backgroundColor: 'rgba(14, 165, 233, 0.15)',
  },
  logoIcon: {
    width: 80,
    height: 80,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.electric,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },
  logoText: {
    ...Fonts.displayBold,
    fontSize: 30,
    color: Colors.textPrimary,
    letterSpacing: -1,
  },
  tagline: {
    ...Fonts.body,
    fontSize: TypeScale.bodySm,
    color: Colors.textMuted,
    marginTop: Spacing.sm,
  },

  /* Form */
  formSection: { marginBottom: Spacing.xl },

  /* Glow Input */
  glowFieldWrap: { gap: Spacing.sm },
  glowLabel: {
    ...Fonts.bodyMedium,
    fontSize: TypeScale.bodySm,
    color: Colors.textSecondary,
    marginLeft: 2,
  },
  glowInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgInput,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    paddingHorizontal: Spacing.base,
    height: 52,
    elevation: 0,
  },
  glowIconL: { marginRight: Spacing.md, width: 20, alignItems: 'center' },
  glowInput: {
    flex: 1,
    ...Fonts.body,
    fontSize: TypeScale.body,
    color: Colors.textPrimary,
    paddingVertical: 0,
    height: '100%',
  },
  glowIconR: {
    marginLeft: Spacing.md,
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xs,
  },
  glowError: {
    ...Fonts.body,
    fontSize: TypeScale.caption,
    color: Colors.danger,
    marginLeft: 2,
  },

  /* Sign In Button */
  signInBtn: {
    height: 54,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: Colors.electric,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  signInText: {
    ...Fonts.bodySemibold,
    fontSize: TypeScale.bodyLg,
    color: '#fff',
    letterSpacing: 0.2,
  },
  sweepOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: W * 0.5,
  },

  forgot: { alignSelf: 'flex-end', marginTop: Spacing.md, padding: Spacing.xs },
  forgotTxt: { ...Fonts.bodyMedium, fontSize: TypeScale.bodySm, color: Colors.electric },

  /* Bottom */
  bottom: { gap: Spacing.base },
  divider: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  divLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: Colors.borderLight },
  divTxt: { ...Fonts.body, fontSize: TypeScale.caption, color: Colors.textMuted },
  trialNote: {
    ...Fonts.body,
    fontSize: TypeScale.caption,
    color: Colors.textMuted,
    textAlign: 'center',
  },
});
