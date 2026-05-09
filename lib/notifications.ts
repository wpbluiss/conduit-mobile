import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { supabase } from "./supabase";

// Praxis notification handler — quiet by default; v2 will route conversation
// pings (e.g. Atlas summarising work) through here once the worker fans them
// out via expo-server-sdk.

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export type NotificationCategory = "chat_reply" | "build_status" | "memory_pin";

export interface PraxisNotificationData {
  category: NotificationCategory;
  conversation_id?: string;
  build_id?: string;
  memory_id?: string;
  preview?: string;
}

export async function registerForPushNotifications(userId: string): Promise<string | null> {
  if (!Device.isDevice) return null;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let final = existing;
  if (existing !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    final = status;
  }
  if (final !== "granted") return null;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("praxis", {
      name: "Praxis",
      importance: Notifications.AndroidImportance.HIGH,
      lightColor: "#5B63E8",
      sound: "default",
    });
  }

  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId) {
      console.warn("[Notifications] Missing EAS projectId");
      return null;
    }
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    await saveTokenToSupabase(userId, token, Platform.OS).catch((err) => {
      console.warn("[Notifications] save failed:", err);
    });
    return token;
  } catch (err) {
    console.warn("[Notifications] register failed:", err);
    return null;
  }
}

async function saveTokenToSupabase(userId: string, token: string, platform: string): Promise<void> {
  const { error } = await supabase
    .from("device_tokens")
    .upsert(
      {
        user_id: userId,
        expo_push_token: token,
        platform,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,platform" },
    );
  if (error) throw error;
}

export function parseNotificationData(notification: Notifications.Notification): PraxisNotificationData | null {
  const data = notification.request.content.data as Record<string, unknown> | undefined;
  if (!data?.category) return null;
  return {
    category: data.category as NotificationCategory,
    conversation_id: data.conversation_id as string | undefined,
    build_id: data.build_id as string | undefined,
    memory_id: data.memory_id as string | undefined,
    preview: data.preview as string | undefined,
  };
}

export function getNavigationTarget(data: PraxisNotificationData): string | null {
  if (data.conversation_id) return `/(app)/chat/${data.conversation_id}`;
  if (data.build_id) return `/(app)/builds/${data.build_id}`;
  if (data.memory_id) return `/(app)/settings/memory`;
  return null;
}

export async function clearBadgeCount(): Promise<void> {
  await Notifications.setBadgeCountAsync(0);
}
