import React, { useState } from "react";
import { View, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link, useRouter, Stack } from "expo-router";
import { Envelope, Lock, User } from "phosphor-react-native";
import { useAuthStore } from "../../store/authStore";
import { usePraxisTheme } from "../../contexts/PraxisThemeContext";
import { Text, Button, Input } from "../../components/praxis";

export default function SignUpScreen() {
  const t = usePraxisTheme();
  const router = useRouter();
  const { signUp } = useAuthStore();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    if (!email.trim() || !password) {
      setError("Email and password are required.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await signUp(email.trim().toLowerCase(), password, {
        full_name: name.trim() || null,
      });
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
          <View style={{ marginBottom: 40 }}>
            <Text variant="caption" tone="indigo" weight="semibold" style={{ marginBottom: 8 }}>
              CREATE ACCOUNT
            </Text>
            <Text variant="displayLg" family="display" weight="semibold">
              Spin up your Praxis.
            </Text>
            <Text variant="body" tone="secondary" style={{ marginTop: 8 }}>
              Nine AI employees, one workspace.
            </Text>
          </View>

          <View style={{ gap: 16 }}>
            <Input
              label="Your name"
              autoCapitalize="words"
              autoComplete="name"
              value={name}
              onChangeText={setName}
              leftAdornment={<User size={18} color={t.colors.inkTertiary} />}
              placeholder="Jane Doe"
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
              error={error}
            />

            <Button
              label={submitting ? "Creating…" : "Create account"}
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
