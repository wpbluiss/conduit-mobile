import React, { useEffect, useState } from "react";
import {
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link, useRouter, Stack } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import {
  Envelope,
  Lock,
  User,
  CheckSquare,
  Square,
  ArrowSquareOut,
  ArrowRight,
} from "phosphor-react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  Easing,
} from "react-native-reanimated";
import { useAuthStore } from "../../store/authStore";
import { usePraxisTheme } from "../../contexts/PraxisThemeContext";
import { Text, Button, Input, PraxisLogo } from "../../components/praxis";
import {
  trackPageView,
  trackSignupStarted,
  trackSignupCompleted,
} from "../../lib/analytics";

const PRIVACY_POLICY_URL = "https://conduitai.io/privacy";
const TERMS_URL = "https://conduitai.io/terms";

export default function SignUpScreen() {
  const t = usePraxisTheme();
  const router = useRouter();
  const { signUp } = useAuthStore();

  useEffect(() => {
    trackPageView({ referrer: "signup_screen" });
  }, []);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [aiConsentChecked, setAiConsentChecked] = useState(false);
  const [tosChecked, setTosChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allConsented = aiConsentChecked && tosChecked;

  // ── Entrance animations ───────────────────────────────────────────────────
  const logoOpacity = useSharedValue(0);
  const logoTranslateY = useSharedValue(-12);
  const cardOpacity = useSharedValue(0);
  const cardTranslateY = useSharedValue(24);
  const fieldsOpacity = useSharedValue(0);
  const fieldsTranslateY = useSharedValue(12);

  useEffect(() => {
    const easing = Easing.out(Easing.cubic);
    logoOpacity.value = withTiming(1, { duration: 300, easing });
    logoTranslateY.value = withTiming(0, { duration: 300, easing });
    cardOpacity.value = withDelay(80, withTiming(1, { duration: 350, easing }));
    cardTranslateY.value = withDelay(80, withSpring(0, t.motion.spring.default));
    fieldsOpacity.value = withDelay(200, withTiming(1, { duration: 280, easing }));
    fieldsTranslateY.value = withDelay(200, withSpring(0, t.motion.spring.default));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ translateY: logoTranslateY.value }],
  }));
  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateY: cardTranslateY.value }],
  }));
  const fieldsStyle = useAnimatedStyle(() => ({
    opacity: fieldsOpacity.value,
    transform: [{ translateY: fieldsTranslateY.value }],
  }));

  const onSubmit = async () => {
    if (!email.trim() || !password) {
      setError("Email and password are required.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (!aiConsentChecked) {
      setError("Please agree to AI data processing to continue.");
      return;
    }
    if (!tosChecked) {
      setError("Please agree to the Terms of Service to continue.");
      return;
    }
    setError(null);
    setSubmitting(true);
    trackSignupStarted();
    try {
      await signUp(email.trim().toLowerCase(), password, {
        full_name: name.trim() || null,
        ai_data_consent: true,
        ai_data_consent_date: new Date().toISOString(),
        tos_accepted: true,
        tos_accepted_date: new Date().toISOString(),
      });
      trackSignupCompleted();
      router.replace("/(app)");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Could not create your account.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.bgCanvas }}>
      <Stack.Screen options={{ headerShown: false }} />
      {/* Atmospheric ember-radial backdrop */}
      <LinearGradient
        colors={[
          t.isDark
            ? "rgba(214, 120, 23, 0.09)"
            : "rgba(214, 120, 23, 0.05)",
          "transparent",
        ]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.55 }}
        style={{ position: "absolute", top: 0, left: 0, right: 0, height: 320 }}
      />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: t.layout.screenPaddingX,
            paddingTop: 32,
            paddingBottom: 32,
          }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo + headline */}
          <Animated.View style={[{ marginBottom: 32 }, logoStyle]}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                marginBottom: 12,
              }}
            >
              <PraxisLogo size={28} />
              <Text variant="caption" tone="indigo" weight="semibold">
                CREATE ACCOUNT
              </Text>
            </View>
            <Text variant="displayLg" family="display" weight="semibold">
              Spin up your Praxis.
            </Text>
            <Text variant="body" tone="secondary" style={{ marginTop: 8 }}>
              Nine AI employees, one workspace.
            </Text>
          </Animated.View>

          {/* Elevated form card */}
          <Animated.View
            style={[
              {
                backgroundColor: t.colors.bgSurface,
                borderRadius: t.radii.xl,
                borderWidth: 1,
                borderColor: t.colors.borderSubtle,
                padding: 24,
                shadowColor: t.colors.shadowColor,
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: t.isDark ? 0.4 : 0.10,
                shadowRadius: 24,
                elevation: 8,
              },
              cardStyle,
            ]}
          >
            <Animated.View style={[{ gap: 16 }, fieldsStyle]}>
              <Input
                label="Your name"
                autoCapitalize="words"
                autoComplete="name"
                value={name}
                onChangeText={setName}
                leftAdornment={<User size={18} color={t.colors.inkTertiary} />}
                placeholder="Jane Doe"
                focusColor={t.colors.ember}
              />
              <Input
                label="Email"
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                autoCorrect={false}
                value={email}
                onChangeText={setEmail}
                leftAdornment={<Envelope size={18} color={t.colors.inkTertiary} />}
                placeholder="you@company.com"
                focusColor={t.colors.ember}
              />
              <Input
                label="Password"
                secureTextEntry
                autoCapitalize="none"
                autoComplete="new-password"
                value={password}
                onChangeText={setPassword}
                leftAdornment={<Lock size={18} color={t.colors.inkTertiary} />}
                placeholder="At least 8 characters"
                focusColor={t.colors.ember}
                error={error}
              />

              <View
                style={{
                  padding: 16,
                  borderRadius: t.radii.lg,
                  borderWidth: 1,
                  borderColor: t.colors.borderSubtle,
                  backgroundColor: t.colors.bgElevated,
                }}
              >
                <Text
                  variant="caption"
                  tone="indigo"
                  weight="semibold"
                  style={{ marginBottom: 8 }}
                >
                  AI DATA NOTICE
                </Text>
                <Text
                  variant="bodySm"
                  tone="secondary"
                  style={{ lineHeight: 19 }}
                >
                  Praxis sends your chats and voice prompts to Anthropic, OpenAI,
                  and ElevenLabs to generate AI employee responses. Your workspace
                  data is stored in Supabase and is not used for AI model training.
                </Text>
                <Pressable
                  onPress={() => Linking.openURL(PRIVACY_POLICY_URL)}
                  style={{
                    marginTop: 10,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                  }}
                  hitSlop={8}
                >
                  <Text variant="bodySm" tone="indigo" weight="medium">
                    Read the Privacy Policy
                  </Text>
                  <ArrowSquareOut size={14} color={t.colors.indigo500} />
                </Pressable>
              </View>

              <Pressable
                onPress={() => setAiConsentChecked((c) => !c)}
                style={{
                  flexDirection: "row",
                  alignItems: "flex-start",
                  gap: 12,
                  paddingVertical: 4,
                }}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: aiConsentChecked }}
                accessibilityLabel="I agree to AI data processing as described above"
                hitSlop={8}
              >
                {aiConsentChecked ? (
                  <CheckSquare size={22} color={t.colors.ember} weight="fill" />
                ) : (
                  <Square size={22} color={t.colors.inkTertiary} />
                )}
                <Text
                  variant="bodySm"
                  tone="secondary"
                  style={{ flex: 1, lineHeight: 19, marginTop: 1 }}
                >
                  I agree to AI data processing as described above.
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setTosChecked((c) => !c)}
                style={{
                  flexDirection: "row",
                  alignItems: "flex-start",
                  gap: 12,
                  paddingVertical: 4,
                }}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: tosChecked }}
                accessibilityLabel="I agree to the Terms of Service"
                hitSlop={8}
              >
                {tosChecked ? (
                  <CheckSquare size={22} color={t.colors.ember} weight="fill" />
                ) : (
                  <Square size={22} color={t.colors.inkTertiary} />
                )}
                <View style={{ flex: 1, flexDirection: "row", flexWrap: "wrap", marginTop: 1 }}>
                  <Text variant="bodySm" tone="secondary" style={{ lineHeight: 19 }}>
                    I agree to the{" "}
                  </Text>
                  <Pressable onPress={() => Linking.openURL(TERMS_URL)} hitSlop={4}>
                    <Text variant="bodySm" tone="indigo" weight="medium" style={{ lineHeight: 19 }}>
                      Terms of Service
                    </Text>
                  </Pressable>
                  <Text variant="bodySm" tone="secondary" style={{ lineHeight: 19 }}>
                    .
                  </Text>
                </View>
              </Pressable>

              <Button
                label={submitting ? "Creating…" : "Create account"}
                variant="primary"
                size="lg"
                fullWidth
                loading={submitting}
                iconRight={submitting ? undefined : <ArrowRight size={18} color="#FFFFFF" />}
                disabled={!allConsented}
                onPress={onSubmit}
              />
            </Animated.View>
          </Animated.View>

          <View style={{ flex: 1 }} />

          <View style={{ alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 4, marginTop: 32 }}>
            <Text variant="body" tone="tertiary">
              Already have an account?
            </Text>
            <Link href="/(auth)/sign-in" asChild>
              <Button label="Sign in" variant="link" size="sm" hapticOnPress={false} />
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
