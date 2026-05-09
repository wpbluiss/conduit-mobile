import React, { useState } from "react";
import { View, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link, useRouter } from "expo-router";
import { Envelope, ArrowLeft } from "phosphor-react-native";
import { supabase } from "../../lib/supabase";
import { usePraxisTheme } from "../../contexts/PraxisThemeContext";
import { Text, Button, Input } from "../../components/praxis";

export default function ForgotPasswordScreen() {
  const t = usePraxisTheme();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const onSubmit = async () => {
    if (!email.trim()) {
      setError("Enter your email address.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const { error: err } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        { redirectTo: "https://conduitai.io/auth/reset" },
      );
      if (err) throw err;
      setSent(true);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Could not send reset email.";
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
            paddingTop: 16,
            paddingBottom: 32,
          }}
          keyboardShouldPersistTaps="handled"
        >
          <Button
            label="Back"
            variant="ghost"
            size="sm"
            iconLeft={<ArrowLeft size={16} color={t.colors.inkPrimary} />}
            onPress={() => router.back()}
            hapticOnPress={false}
            style={{ alignSelf: "flex-start", marginBottom: 24 }}
          />

          <View style={{ marginBottom: 40 }}>
            <Text variant="caption" tone="indigo" weight="semibold" style={{ marginBottom: 8 }}>
              RESET PASSWORD
            </Text>
            <Text variant="displayLg" family="display" weight="semibold">
              {sent ? "Check your email." : "Forgot your password?"}
            </Text>
            <Text variant="body" tone="secondary" style={{ marginTop: 8 }}>
              {sent
                ? `We sent a reset link to ${email.trim().toLowerCase()}. Open it on this device to finish.`
                : "Enter your email and we'll send you a reset link."}
            </Text>
          </View>

          {!sent ? (
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
                error={error}
              />
              <Button
                label={submitting ? "Sending…" : "Send reset link"}
                variant="primary"
                size="lg"
                fullWidth
                loading={submitting}
                onPress={onSubmit}
              />
            </View>
          ) : (
            <Link href="/(auth)/sign-in" asChild>
              <Button label="Back to sign in" variant="primary" size="lg" fullWidth />
            </Link>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
