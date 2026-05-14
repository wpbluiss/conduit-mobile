import { useEffect, useRef } from "react";
import { View, StatusBar } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Slot, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import { setAudioModeAsync } from "expo-audio";
import {
  Fraunces_500Medium,
  Fraunces_600SemiBold,
  Fraunces_700Bold,
  Fraunces_500Medium_Italic,
} from "@expo-google-fonts/fraunces";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_500Medium,
} from "@expo-google-fonts/jetbrains-mono";
import { useAuthStore } from "../store/authStore";
import { PraxisThemeProvider, usePraxisTheme } from "../contexts/PraxisThemeContext";
import { registerForPushNotifications } from "../lib/notifications";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <PraxisThemeProvider>
        <RootLayoutInner />
      </PraxisThemeProvider>
    </SafeAreaProvider>
  );
}

function RootLayoutInner() {
  const { initialize, isBootstrapping, isAuthenticated, user } = useAuthStore();
  const theme = usePraxisTheme();
  const segments = useSegments();
  const router = useRouter();

  const [fontsLoaded] = useFonts({
    Fraunces_500Medium,
    Fraunces_600SemiBold,
    Fraunces_700Bold,
    Fraunces_500Medium_Italic,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
  });

  const navigationLockRef = useRef(false);
  const pushRegisteredRef = useRef(false);

  useEffect(() => {
    initialize();
  }, [initialize]);

  // iOS defaults the AVAudioSession category to Ambient, which mutes playback
  // when the physical silent switch is on. Voice replies and previews need
  // Playback, so flip playsInSilentMode + duck other audio. One-time call.
  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: false,
      interruptionMode: "duckOthers",
      allowsRecording: false,
    }).catch((err) => {
      console.warn("[Layout] setAudioModeAsync failed:", err);
    });
  }, []);

  useEffect(() => {
    if (!isBootstrapping && fontsLoaded) SplashScreen.hideAsync();
  }, [isBootstrapping, fontsLoaded]);

  useEffect(() => {
    if (isAuthenticated && user?.id && !pushRegisteredRef.current) {
      pushRegisteredRef.current = true;
      registerForPushNotifications(user.id).catch((err) => {
        console.error("[Layout] Push registration failed:", err);
      });
    }
  }, [isAuthenticated, user?.id]);

  useEffect(() => {
    if (isBootstrapping || !fontsLoaded) return;
    if (navigationLockRef.current) return;

    const inAuth = segments[0] === "(auth)";
    const inApp = segments[0] === "(app)";

    const navigate = (route: string) => {
      navigationLockRef.current = true;
      router.replace(route as never);
      setTimeout(() => {
        navigationLockRef.current = false;
      }, 500);
    };

    if (!isAuthenticated && !inAuth) {
      navigate("/(auth)/sign-in");
    } else if (isAuthenticated && !inApp) {
      navigate("/(app)");
    }
  }, [isAuthenticated, isBootstrapping, fontsLoaded, segments, router]);

  if (isBootstrapping || !fontsLoaded) return null;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bgCanvas }}>
      <StatusBar
        barStyle={theme.isDark ? "light-content" : "dark-content"}
        backgroundColor={theme.colors.bgCanvas}
      />
      <Slot />
    </View>
  );
}
