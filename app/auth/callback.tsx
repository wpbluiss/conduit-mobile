import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";
import { usePraxisTheme } from "../../contexts/PraxisThemeContext";
import { Text } from "../../components/praxis/Text";

function isSafeRedirectPath(path: unknown): path is string {
  if (typeof path !== "string") return false;
  // Only allow relative paths — no absolute URLs, no protocol-relative
  return path.startsWith("/") && !path.startsWith("//");
}

export default function AuthCallbackScreen() {
  const t = usePraxisTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ code?: string; next?: string; error_description?: string }>();

  const [status, setStatus] = useState<"loading" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const { code, next, error_description } = params;

    if (error_description) {
      // Supabase may forward an error directly in the callback URL
      const msg = decodeURIComponent(error_description);
      router.replace({
        pathname: "/(auth)/sign-in",
        params: { callbackError: msg },
      } as never);
      return;
    }

    if (!code) {
      router.replace({
        pathname: "/(auth)/sign-in",
        params: { callbackError: "Invalid confirmation link." },
      } as never);
      return;
    }

    supabase.auth
      .exchangeCodeForSession(code)
      .then(({ error }) => {
        if (error) {
          setStatus("error");
          setErrorMsg(error.message);
          router.replace({
            pathname: "/(auth)/sign-in",
            params: { callbackError: error.message },
          } as never);
          return;
        }

        const destination = isSafeRedirectPath(next) ? next : "/(app)";
        router.replace(destination as never);
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : "Confirmation failed.";
        setStatus("error");
        setErrorMsg(msg);
        router.replace({
          pathname: "/(auth)/sign-in",
          params: { callbackError: msg },
        } as never);
      });
    // Run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.bgCanvas }}>
      <View
        style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 16 }}
      >
        {status === "loading" ? (
          <>
            <ActivityIndicator size="large" color={t.colors.indigo500} />
            <Text variant="body" tone="secondary">
              Confirming your email…
            </Text>
          </>
        ) : (
          <Text variant="body" tone="danger">
            {errorMsg ?? "Something went wrong."}
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
}
