import React, { useEffect, useState } from "react";
import { View, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Envelope, Lock, ArrowRight } from "phosphor-react-native";
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
import { trackPageView } from "../../lib/analytics";

export default function SignInScreen() {
  const t = usePraxisTheme();
  const router = useRouter();
  const { signIn } = useAuthStore();

  useEffect(() => {
    trackPageView({ referrer: "signin_screen" });
  }, []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    cardTranslateY.value = withDelay(
      80,
      withSpring(0, t.motion.spring.default),
    );
    fieldsOpacity.value = withDelay(200, withTiming(1, { duration: 280, easing }));
    fieldsTranslateY.value = withDelay(
      200,
      withSpring(0, t.motion.spring.default),
    );
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
      setError("Enter your email and password.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await signIn(email.trim().toLowerCase(), password);
      router.replace("/(app)");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Could not sign in.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.bgCanvas }}>
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
            paddingTop: 48,
            paddingBottom: 32,
          }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo + wordmark */}
          <Animated.View style={[{ marginBottom: 40 }, logoStyle]}>
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
                PRAXIS CONSOLE
              </Text>
            </View>
            <Text variant="displayLg" family="display" weight="semibold">
              Praxis Console
            </Text>
            <Text variant="body" tone="secondary" style={{ marginTop: 8 }}>
              Your institutional workforce, on hand.
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
                autoComplete="current-password"
                value={password}
                onChangeText={setPassword}
                leftAdornment={<Lock size={18} color={t.colors.inkTertiary} />}
                placeholder="••••••••"
                focusColor={t.colors.ember}
                error={error}
              />

              <View style={{ alignItems: "flex-end" }}>
                <Link href="/(auth)/forgot-password" asChild>
                  <Button label="Forgot password?" variant="link" size="sm" hapticOnPress={false} />
                </Link>
              </View>

              <Button
                label={submitting ? "Signing in…" : "Continue"}
                variant="primary"
                size="lg"
                fullWidth
                loading={submitting}
                iconRight={submitting ? undefined : <ArrowRight size={18} color="#FFFFFF" />}
                onPress={onSubmit}
              />
            </Animated.View>
          </Animated.View>

          <View style={{ flex: 1 }} />

          <View style={{ alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 4, marginTop: 32 }}>
            <Text variant="body" tone="tertiary">
              New to Praxis?
            </Text>
            <Link href="/(auth)/sign-up" asChild>
              <Button label="Create an account" variant="link" size="sm" hapticOnPress={false} />
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
