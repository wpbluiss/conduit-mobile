import { useEffect, useState } from 'react';
import { View, StatusBar } from 'react-native';
import { Slot, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../store/authStore';
import { Colors } from '../constants/colors';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { initialize, isLoading, isAuthenticated, user } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  const [hasSeenWelcome, setHasSeenWelcome] = useState<boolean | null>(null);

  const onboardingComplete = user?.user_metadata?.onboarding_complete === true;

  useEffect(() => {
    initialize();
    AsyncStorage.getItem('has_seen_welcome').then((val) => {
      setHasSeenWelcome(val === 'true');
    });
  }, []);

  useEffect(() => {
    if (!isLoading && hasSeenWelcome !== null) SplashScreen.hideAsync();
  }, [isLoading, hasSeenWelcome]);

  useEffect(() => {
    if (isLoading || hasSeenWelcome === null) return;

    const inAuth = segments[0] === '(auth)';
    const inWelcome = segments[1] === 'welcome';
    const inOnboarding = segments[1] === 'onboarding';

    console.log('[Router] isAuthenticated:', isAuthenticated, 'hasSeenWelcome:', hasSeenWelcome, 'onboardingComplete:', onboardingComplete, 'segments:', segments);

    try {
      // First-time user: show welcome walkthrough
      if (!isAuthenticated && !hasSeenWelcome && !inWelcome) {
        console.log('[Router] Navigating to welcome');
        router.replace('/(auth)/welcome');
      }
      // Returning unauthenticated user: show login (but not if on welcome, signup, etc.)
      else if (!isAuthenticated && hasSeenWelcome && !inAuth) {
        console.log('[Router] Navigating to login');
        router.replace('/(auth)/login');
      }
      // Authenticated but onboarding incomplete
      else if (isAuthenticated && !onboardingComplete && !inOnboarding) {
        console.log('[Router] Navigating to onboarding');
        router.replace('/(auth)/onboarding');
      }
      // Authenticated, onboarding done, still in auth group
      else if (isAuthenticated && onboardingComplete && inAuth) {
        console.log('[Router] Navigating to tabs');
        router.replace('/(tabs)');
      }
    } catch (e) {
      console.error('[Router] Navigation error:', e);
    }
  }, [isAuthenticated, isLoading, segments, onboardingComplete, hasSeenWelcome]);

  if (isLoading || hasSeenWelcome === null) return null;

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bgVoid }}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bgVoid} />
      <Slot />
    </View>
  );
}
