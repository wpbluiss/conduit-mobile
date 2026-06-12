import React, { useEffect, useState } from "react";
import { Stack } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { usePraxisTheme } from "../../contexts/PraxisThemeContext";
import { useAuthStore } from "../../store/authStore";
import { getOrCreateAccount } from "../../lib/conduit/account";
import { OnboardingModal } from "../../components/praxis/OnboardingModal";

const SKIP_KEY_PREFIX = "@praxis_onboarding_skipped_";

function onboardingSkipKey(userId: string) {
  return `${SKIP_KEY_PREFIX}${userId}`;
}

export default function AppLayout() {
  const t = usePraxisTheme();
  const { user } = useAuthStore();

  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    let cancelled = false;

    async function checkOnboarding() {
      try {
        const skipped = await AsyncStorage.getItem(onboardingSkipKey(user!.id));
        if (skipped === "1") return;

        const account = await getOrCreateAccount();
        if (!account) return;

        if (!cancelled && !account.business_type && !account.business_description) {
          setShowOnboarding(true);
        }
      } catch (e) {
        console.warn("[Onboarding] Check failed:", e);
      }
    }

    checkOnboarding();
    return () => { cancelled = true; };
  }, [user?.id]);

  const handleSkip = async () => {
    setShowOnboarding(false);
    try {
      await AsyncStorage.setItem(onboardingSkipKey(user!.id), "1");
    } catch (e) {
      console.warn("[Onboarding] Failed to persist skip:", e);
    }
  };

  const handleComplete = () => {
    setShowOnboarding(false);
  };

  return (
    <>
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

      <OnboardingModal
        visible={showOnboarding}
        onSkip={handleSkip}
        onComplete={handleComplete}
      />
    </>
  );
}
