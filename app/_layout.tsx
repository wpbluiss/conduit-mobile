import { useEffect } from 'react';
import { View, StatusBar } from 'react-native';
import { Slot, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useAuthStore } from '../store/authStore';
import { Colors } from '../constants/colors';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { initialize, isLoading, isAuthenticated, user } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  const onboardingComplete = user?.user_metadata?.onboarding_complete === true;

  useEffect(() => { initialize(); }, []);
  useEffect(() => { if (!isLoading) SplashScreen.hideAsync(); }, [isLoading]);
  useEffect(() => {
    if (isLoading) return;
    const inAuth = segments[0] === '(auth)';
    const inOnboarding = segments[1] === 'onboarding';
    console.log('[Auth Redirect] isAuthenticated:', isAuthenticated, 'inAuth:', inAuth, 'onboardingComplete:', onboardingComplete, 'segments:', segments);
    try {
      if (!isAuthenticated && !inAuth) {
        console.log('[Auth Redirect] Navigating to login');
        router.replace('/(auth)/login');
      } else if (isAuthenticated && !onboardingComplete && !inOnboarding) {
        console.log('[Auth Redirect] Navigating to onboarding');
        router.replace('/(auth)/onboarding');
      } else if (isAuthenticated && onboardingComplete && inAuth) {
        console.log('[Auth Redirect] Navigating to tabs');
        router.replace('/(tabs)');
      }
    } catch (e) {
      console.error('[Auth Redirect] Navigation error:', e);
    }
  }, [isAuthenticated, isLoading, segments, onboardingComplete]);

  if (isLoading) return null;
  return (
    <View style={{ flex: 1, backgroundColor: Colors.bgVoid }}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bgVoid} />
      <Slot />
    </View>
  );
}
