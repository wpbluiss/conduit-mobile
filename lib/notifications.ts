import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { supabase } from './supabase';
import { getClientId } from './api';

// ── Configuration ────────────────────────────────────────────

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: false,
    shouldShowList: false,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// ── Notification Categories ──────────────────────────────────

export type NotificationCategory = 'new_lead' | 'call_completed';

export interface NotificationData {
  category: NotificationCategory;
  lead_id?: string;
  caller_name?: string;
  caller_phone?: string;
  summary?: string;
  service_needed?: string;
  duration?: string;
  outcome?: string;
}

// ── Permission & Token Registration ──────────────────────────

export async function registerForPushNotifications(userId: string): Promise<string | null> {
  if (!Device.isDevice) {
    console.log('[Notifications] Push notifications require a physical device');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('[Notifications] Permission not granted');
    return null;
  }

  // Android notification channels
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('leads', {
      name: 'New Leads',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#0EA5E9',
      sound: 'default',
    });

    await Notifications.setNotificationChannelAsync('calls', {
      name: 'Call Updates',
      importance: Notifications.AndroidImportance.DEFAULT,
      lightColor: '#0EA5E9',
      sound: 'default',
    });
  }

  // Set up notification categories with actions
  await Notifications.setNotificationCategoryAsync('new_lead', [
    { identifier: 'view', buttonTitle: 'View Lead', options: { opensAppToForeground: true } },
  ]);

  await Notifications.setNotificationCategoryAsync('call_completed', [
    { identifier: 'view', buttonTitle: 'View Details', options: { opensAppToForeground: true } },
  ]);

  // Get Expo push token
  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId || projectId === 'YOUR_EAS_PROJECT_ID') {
      console.warn('[Notifications] No EAS project ID configured — push token unavailable. Run: npx eas-cli login && npx eas-cli init');
      return null;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    const token = tokenData.data;

    // Save token to Supabase (upsert: update if user+platform already exists)
    await saveTokenToSupabase(userId, token, Platform.OS).catch((err) => {
      console.error('[Notifications] Failed to save token to Supabase:', err);
    });

    console.log('[Notifications] Push token registered:', token);
    return token;
  } catch (error) {
    console.error('[Notifications] Failed to get push token:', error);
    return null;
  }
}

/** Save or update the device push token in Supabase */
async function saveTokenToSupabase(userId: string, token: string, platform: string): Promise<void> {
  const { error } = await supabase
    .from('device_tokens')
    .upsert(
      {
        user_id: userId,
        expo_push_token: token,
        platform,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,platform' }
    );
  if (error) throw error;
  console.log('[Notifications] Token saved to Supabase');
}

// ── Local Notification Trigger ───────────────────────────────

/** Fire a local notification for a new call/lead from realtime */
export async function triggerLocalLeadNotification(call: {
  id: string;
  caller_name?: string;
  caller_phone?: string;
  service_needed?: string;
  transcript_summary?: string;
}): Promise<void> {
  const callerName = call.caller_name || 'Unknown Caller';
  const service = call.service_needed || call.transcript_summary || 'New incoming call';
  const phone = call.caller_phone || '';

  await Notifications.scheduleNotificationAsync({
    content: {
      title: `New Lead: ${callerName}`,
      body: [service, phone].filter(Boolean).join(' — '),
      data: {
        category: 'new_lead',
        lead_id: call.id,
        caller_name: callerName,
        caller_phone: phone,
        summary: service,
        service_needed: call.service_needed,
      } satisfies NotificationData,
      sound: 'default',
      categoryIdentifier: 'new_lead',
    },
    trigger: null, // fire immediately
  });
}

// ── Realtime Subscription for Calls ──────────────────────────

/** Subscribe to new calls for the current user and trigger notifications.
 *  Returns cleanup function. Call onNewCall for in-app banner display. */
export function subscribeToNewCalls(
  onNewCall?: (call: any) => void,
): () => void {
  let channel: ReturnType<typeof supabase.channel> | null = null;
  let cancelled = false;

  (async () => {
    const clientId = await getClientId();
    if (!clientId || cancelled) return;

    channel = supabase
      .channel('new-calls-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'calls',
          filter: `client_id=eq.${clientId}`,
        },
        async (payload) => {
          const call = payload.new as any;
          console.log('[Notifications] New call received via realtime:', call.id);

          // Trigger local push notification (shows when app is backgrounded)
          triggerLocalLeadNotification(call).catch((err) => {
            console.error('[Notifications] Failed to trigger local notification:', err);
          });

          // Fire callback for in-app banner
          onNewCall?.(call);
        },
      )
      .subscribe((status) => {
        console.log('[Notifications] Realtime subscription status:', status);
      });
  })();

  return () => {
    cancelled = true;
    if (channel) supabase.removeChannel(channel);
  };
}

// ── Notification Parsing ─────────────────────────────────────

export function parseNotificationData(notification: Notifications.Notification): NotificationData | null {
  const data = notification.request.content.data as Record<string, unknown> | undefined;
  if (!data) return null;

  return {
    category: (data.category as NotificationCategory) || 'new_lead',
    lead_id: data.lead_id as string | undefined,
    caller_name: data.caller_name as string | undefined,
    caller_phone: data.caller_phone as string | undefined,
    summary: data.summary as string | undefined,
    service_needed: data.service_needed as string | undefined,
    duration: data.duration as string | undefined,
    outcome: data.outcome as string | undefined,
  };
}

export function getNavigationTarget(data: NotificationData): string | null {
  if (data.lead_id) {
    return `/lead/${data.lead_id}`;
  }
  return null;
}

// ── Badge Management ─────────────────────────────────────────

export async function clearBadgeCount() {
  await Notifications.setBadgeCountAsync(0);
}
