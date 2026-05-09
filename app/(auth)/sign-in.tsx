import React, { useState } from "react";
import { View, KeyboardAvoidingView, Platform, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link, useRouter } from "expo-router";
import { Envelope, Lock } from "phosphor-react-native";
import { useAuthStore } from "../../store/authStore";
import { usePraxisTheme } from "../../contexts/PraxisThemeContext";
import { Text, Button, Input } from "../../components/praxis";

export default function SignInScreen() {
  const t = usePraxisTheme();
  const router = useRouter();
  const { signIn } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
          <View style={{ marginBottom: 56 }}>
            <Text variant="caption" tone="indigo" weight="semibold" style={{ marginBottom: 8 }}>
              CONDUIT
            </Text>
            <Text variant="displayXl" family="display" weight="semibold">
              Praxis Console
            </Text>
            <Text variant="bodyLg" tone="secondary" style={{ marginTop: 8 }}>
              Your institutional workforce, on hand.
            </Text>
          </View>

          <View style={{ gap: 16 }}>
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
              onPress={onSubmit}
            />
          </View>

          <View style={{ flex: 1 }} />

          <View style={{ alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 4, marginTop: 32 }}>
            <Text variant="body" tone="tertiary">
              New to Conduit?
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
