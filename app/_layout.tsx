import { useEffect, useState, useRef, useCallback } from 'react';
import { View, StatusBar, AppState } from 'react-native';
import { Slot, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts, Outfit_400Regular, Outfit_500Medium, Outfit_600SemiBold, Outfit_700Bold, Outfit_800ExtraBold } from '@expo-google-fonts/outfit';
import { JetBrainsMono_400Regular, JetBrainsMono_500Medium, JetBrainsMono_700Bold } from '@expo-google-fonts/jetbrains-mono';
import { useAuthStore } from '../store/authStore';
import { Colors } from '../constants/colors';
import { registerForPushNotifications, parseNotificationData, getNavigationTarget, clearBadgeCount, subscribeToNewCalls } from '../lib/notifications';
import { NotificationBanner, type BannerData } from '../components/ui/NotificationBanner';
import { useLeadsStore } from '../store/leadsStore';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { initialize, isLoading, isAuthenticated, isGuestMode, user } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  const [fontsLoaded] = useFonts({
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
    Outfit_800ExtraBold,
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
    JetBrainsMono_700Bold,
  });

  const [hasSeenWelcome, setHasSeenWelcome] = useState<boolean | null>(null);
  const [bannerData, setBannerData] = useState<BannerData | null>(null);
  const notificationRegistered = useRef(false);
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  const onboardingComplete = user?.user_metadata?.onboarding_complete === true;

  useEffect(() => {
    initialize();
    AsyncStorage.getItem('has_seen_welcome').then((val) => {
      setHasSeenWelcome(val === 'true');
    });
  }, []);

  useEffect(() => {
    if (!isLoading && hasSeenWelcome !== null && fontsLoaded) SplashScreen.hideAsync();
  }, [isLoading, hasSeenWelcome, fontsLoaded]);

  // ── Push notification registration after auth (skip in guest mode) ──
  useEffect(() => {
    if (isAuthenticated && !isGuestMode && user?.id && !notificationRegistered.current) {
      notificationRegistered.current = true;
      registerForPushNotifications(user.id).catch((err) => {
        console.error('[Layout] Push notification registration failed:', err);
      });
    }
  }, [isAuthenticated, isGuestMode, user?.id]);

  // ── Notification listeners ──
  useEffect(() => {
    // Foreground: show in-app banner
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      const parsed = parseNotificationData(notification);
      if (parsed) {
        setBannerData({
          category: parsed.category,
          lead_id: parsed.lead_id,
          caller_name: parsed.caller_name,
          caller_phone: parsed.caller_phone,
          summary: parsed.summary,
          duration: parsed.duration,
          outcome: parsed.outcome,
        });
      }
    });

    // Tap response: navigate to lead detail
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const parsed = parseNotificationData(response.notification);
      if (parsed) {
        const target = getNavigationTarget(parsed);
        if (target) {
          router.push(target as any);
        }
      }
    });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [router]);

  // ── Realtime subscription for new calls → in-app banner + local notification ──
  useEffect(() => {
    if (!isAuthenticated || isGuestMode) return;

    const unsubscribe = subscribeToNewCalls((call: any) => {
      // Show in-app banner with real call data
      const callerName = call.caller_name || 'Unknown Caller';
      const service = call.service_needed || call.transcript_summary || call.notes || '';
      const phone = call.caller_phone || '';

      setBannerData({
        category: 'new_lead',
        lead_id: call.id,
        caller_name: callerName,
        caller_phone: phone,
        summary: service,
      });

      // Also refresh the leads store so lists update
      useLeadsStore.getState().refresh();
    });

    return unsubscribe;
  }, [isAuthenticated, isGuestMode]);

  // ── Clear badge when app comes to foreground ──
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') clearBadgeCount();
    });
    return () => sub.remove();
  }, []);

  // ── Check for notification that launched the app ──
  useEffect(() => {
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        const parsed = parseNotificationData(response.notification);
        if (parsed) {
          const target = getNavigationTarget(parsed);
          if (target) {
            // Small delay to ensure router is ready
            setTimeout(() => router.push(target as any), 500);
          }
        }
      }
    });
  }, []);

  const handleBannerPress = useCallback((leadId: string) => {
    router.push(`/lead/${leadId}` as any);
  }, [router]);

  const handleBannerDismiss = useCallback(() => {
    setBannerData(null);
  }, []);

  useEffect(() => {
    if (isLoading || hasSeenWelcome === null || !fontsLoaded) return;

    const inAuth = segments[0] === '(auth)';
    const inWelcome = segments[1] === 'welcome';
    const inOnboarding = segments[1] === 'onboarding';
    const inTabs = segments[0] === '(tabs)';

    console.log('[Router] isAuthenticated:', isAuthenticated, 'isGuestMode:', isGuestMode, 'hasSeenWelcome:', hasSeenWelcome, 'onboardingComplete:', onboardingComplete, 'segments:', segments);

    try {
      // Guest mode: allow tabs, redirect to tabs if stuck in auth
      if (isGuestMode && !isAuthenticated) {
        if (inAuth) {
          console.log('[Router] Guest mode → tabs');
          router.replace('/(tabs)');
        }
        // Already in tabs or other screens, do nothing
        return;
      }

      if (!isAuthenticated && !hasSeenWelcome && !inWelcome) {
        console.log('[Router] Navigating to welcome');
        router.replace('/(auth)/welcome');
      }
      else if (!isAuthenticated && hasSeenWelcome && !inAuth) {
        console.log('[Router] Navigating to login');
        router.replace('/(auth)/login');
      }
      else if (isAuthenticated && !onboardingComplete && !inOnboarding) {
        console.log('[Router] Navigating to onboarding');
        router.replace('/(auth)/onboarding');
      }
      else if (isAuthenticated && onboardingComplete && inAuth) {
        console.log('[Router] Navigating to tabs');
        router.replace('/(tabs)');
      }
    } catch (e) {
      console.error('[Router] Navigation error:', e);
    }
  }, [isAuthenticated, isGuestMode, isLoading, segments, onboardingComplete, hasSeenWelcome]);

  if (isLoading || hasSeenWelcome === null || !fontsLoaded) return null;

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bgVoid }}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bgVoid} />
      <Slot />
      <NotificationBanner
        data={bannerData}
        onPress={handleBannerPress}
        onDismiss={handleBannerDismiss}
      />
    </View>
  );
}
