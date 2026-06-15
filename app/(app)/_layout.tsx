import React, { useEffect, useRef } from "react";
import { Alert } from "react-native";
import { Stack } from "expo-router";
import { useURL, parse as parseLinkingURL } from "expo-linking";
import { usePraxisTheme } from "../../contexts/PraxisThemeContext";

const BILLING_MESSAGES: Record<string, { title: string; message: string }> = {
  "checkout:success": {
    title: "Payment received",
    message: "We've received your payment and will update your plan shortly.",
  },
  "checkout:canceled": {
    title: "Checkout canceled",
    message: "No charges were made. You can upgrade any time from Settings.",
  },
  "topup:success": {
    title: "Credits added",
    message: "Your credits have been added to your account.",
  },
};

function useBillingReturnFeedback() {
  const url = useURL();
  const handledRef = useRef<string | null>(null);

  useEffect(() => {
    if (!url || url === handledRef.current) return;

    const { queryParams } = parseLinkingURL(url);
    const checkout = queryParams?.checkout as string | undefined;
    const topup = queryParams?.topup as string | undefined;

    let key: string | null = null;
    if (checkout === "success") key = "checkout:success";
    else if (checkout === "canceled") key = "checkout:canceled";
    else if (topup === "success") key = "topup:success";

    if (key && BILLING_MESSAGES[key]) {
      handledRef.current = url;
      const { title, message } = BILLING_MESSAGES[key];
      Alert.alert(title, message, [{ text: "OK" }]);
    }
  }, [url]);
}

export default function AppLayout() {
  const t = usePraxisTheme();
  useBillingReturnFeedback();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: t.colors.bgCanvas },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="chat" />
      <Stack.Screen name="builds" />
      <Stack.Screen name="team" />
      <Stack.Screen name="settings" />
      <Stack.Screen
        name="voice"
        options={{
          presentation: "modal",
          animation: "slide_from_bottom",
          contentStyle: { backgroundColor: "#08070C" },
        }}
      />
    </Stack>
  );
}
