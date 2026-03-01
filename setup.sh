#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# CONDUIT AI MOBILE — Phase 1 Setup Script
# Run from inside ~/Downloads/conduit-mobile
# Usage: bash setup.sh
# ═══════════════════════════════════════════════════════════════
set -e
echo "⚡ Conduit AI Mobile — Phase 1 Setup"
echo "Writing 20 source files..."
echo ""

# ═══════════════════════════════════════════════════════════════
# CONSTANTS
# ═══════════════════════════════════════════════════════════════

cat > constants/colors.ts << 'ENDFILE'
export const Colors = {
  bgVoid: '#030712',
  bgPrimary: '#0a0f1e',
  bgCard: '#111827',
  bgElevated: '#1a2235',
  bgInput: '#0f172a',
  electric: '#0EA5E9',
  electricGlow: '#38BDF8',
  electricMuted: 'rgba(14, 165, 233, 0.15)',
  electricBorder: 'rgba(14, 165, 233, 0.12)',
  cyan: '#06B6D4',
  cyanGlow: 'rgba(6, 182, 212, 0.2)',
  success: '#10B981',
  successGlow: 'rgba(16, 185, 129, 0.15)',
  warning: '#F59E0B',
  warningGlow: 'rgba(245, 158, 11, 0.15)',
  danger: '#EF4444',
  dangerGlow: 'rgba(239, 68, 68, 0.15)',
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#475569',
  textDisabled: '#334155',
  border: 'rgba(148, 163, 184, 0.08)',
  borderLight: 'rgba(148, 163, 184, 0.15)',
  borderElectric: 'rgba(14, 165, 233, 0.25)',
  gradientElectric: ['#0EA5E9', '#06B6D4'] as const,
  gradientElectricDiag: ['#0EA5E9', '#3B82F6'] as const,
  gradientDark: ['#0a0f1e', '#030712'] as const,
  shadowElectric: 'rgba(14, 165, 233, 0.25)',
  shadowDark: 'rgba(0, 0, 0, 0.5)',
  overlay: 'rgba(3, 7, 18, 0.7)',
} as const;

export const StatusColors = {
  new: Colors.electric,
  contacted: Colors.warning,
  booked: Colors.success,
  lost: Colors.danger,
  active: Colors.success,
  inactive: Colors.textMuted,
} as const;

export type StatusType = keyof typeof StatusColors;
ENDFILE
echo "  ✓ constants/colors.ts"

cat > constants/typography.ts << 'ENDFILE'
import { Platform } from 'react-native';
const isIOS = Platform.OS === 'ios';

export const Fonts = {
  display: { fontFamily: isIOS ? 'System' : 'sans-serif', fontWeight: '700' as const },
  displayBold: { fontFamily: isIOS ? 'System' : 'sans-serif', fontWeight: '800' as const },
  body: { fontFamily: isIOS ? 'System' : 'sans-serif', fontWeight: '400' as const },
  bodyMedium: { fontFamily: isIOS ? 'System' : 'sans-serif-medium', fontWeight: '500' as const },
  bodySemibold: { fontFamily: isIOS ? 'System' : 'sans-serif-medium', fontWeight: '600' as const },
  mono: { fontFamily: isIOS ? 'Menlo' : 'monospace', fontWeight: '400' as const },
  monoBold: { fontFamily: isIOS ? 'Menlo' : 'monospace', fontWeight: '700' as const },
};

export const TypeScale = {
  hero: 36, h1: 28, h2: 22, h3: 18, h4: 16,
  bodyLg: 16, body: 14, bodySm: 13, caption: 12, tiny: 10,
  statLg: 32, stat: 24, statSm: 18,
} as const;

export const LineHeight = { tight: 1.1, normal: 1.4, relaxed: 1.6 } as const;
export const LetterSpacing = { tight: -0.5, normal: 0, wide: 0.5, wider: 1.5 } as const;

export const TextStyles = {
  hero: { ...Fonts.displayBold, fontSize: TypeScale.hero, letterSpacing: LetterSpacing.tight, lineHeight: TypeScale.hero * LineHeight.tight },
  h1: { ...Fonts.display, fontSize: TypeScale.h1, letterSpacing: LetterSpacing.tight, lineHeight: TypeScale.h1 * LineHeight.tight },
  h2: { ...Fonts.display, fontSize: TypeScale.h2, lineHeight: TypeScale.h2 * LineHeight.tight },
  h3: { ...Fonts.bodySemibold, fontSize: TypeScale.h3, lineHeight: TypeScale.h3 * LineHeight.normal },
  body: { ...Fonts.body, fontSize: TypeScale.body, lineHeight: TypeScale.body * LineHeight.normal },
  bodySm: { ...Fonts.body, fontSize: TypeScale.bodySm, lineHeight: TypeScale.bodySm * LineHeight.normal },
  caption: { ...Fonts.body, fontSize: TypeScale.caption, lineHeight: TypeScale.caption * LineHeight.normal },
  stat: { ...Fonts.monoBold, fontSize: TypeScale.statLg, letterSpacing: LetterSpacing.tight },
  label: { ...Fonts.bodyMedium, fontSize: TypeScale.caption, letterSpacing: LetterSpacing.wide, textTransform: 'uppercase' as const },
} as const;
ENDFILE
echo "  ✓ constants/typography.ts"

cat > constants/animations.ts << 'ENDFILE'
export const Springs = {
  snappy: { damping: 15, stiffness: 200, mass: 0.5 },
  responsive: { damping: 20, stiffness: 150, mass: 0.8 },
  smooth: { damping: 25, stiffness: 120, mass: 1 },
  bouncy: { damping: 10, stiffness: 180, mass: 0.6 },
  gentle: { damping: 30, stiffness: 80, mass: 1.2 },
  heavy: { damping: 28, stiffness: 100, mass: 1.5 },
} as const;

export const Timing = {
  fast: 150, normal: 250, slow: 400, slower: 600, pulse: 2000, count: 1200,
} as const;

export const Stagger = { fast: 50, normal: 80, slow: 120 } as const;
ENDFILE
echo "  ✓ constants/animations.ts"

cat > constants/layout.ts << 'ENDFILE'
export const Spacing = {
  xs: 4, sm: 8, md: 12, base: 16, lg: 20, xl: 24,
  '2xl': 32, '3xl': 40, '4xl': 48, '5xl': 64,
} as const;

export const BorderRadius = {
  sm: 6, md: 10, lg: 14, xl: 18, '2xl': 24, full: 9999,
} as const;

export const IconSize = { sm: 16, md: 20, lg: 24, xl: 28, '2xl': 32 } as const;
export const TabBar = { height: 65, iconSize: 22, labelSize: 10 } as const;
export const ScreenPadding = { horizontal: 20, vertical: 16 } as const;
ENDFILE
echo "  ✓ constants/layout.ts"

# ═══════════════════════════════════════════════════════════════
# LIB
# ═══════════════════════════════════════════════════════════════

cat > lib/supabase.ts << 'ENDFILE'
import 'react-native-url-polyfill/dist/polyfill';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://YOUR_PROJECT.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_ANON_KEY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export async function getCurrentSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
}
ENDFILE
echo "  ✓ lib/supabase.ts"

cat > lib/api.ts << 'ENDFILE'
import { getCurrentSession } from './supabase';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'https://conduit-backend-production.up.railway.app';

class ApiClient {
  private baseUrl: string;
  constructor(baseUrl: string) { this.baseUrl = baseUrl; }

  private async getHeaders(): Promise<Record<string, string>> {
    const session = await getCurrentSession();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;
    return headers;
  }

  async request<T>(endpoint: string, options: { method?: string; body?: any; params?: Record<string, string> } = {}): Promise<T> {
    const { method = 'GET', body, params } = options;
    const headers = await this.getHeaders();
    let url = `${this.baseUrl}${endpoint}`;
    if (params) url += `?${new URLSearchParams(params).toString()}`;
    const response = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(error.detail || `API Error: ${response.status}`);
    }
    return response.json();
  }

  async getLeads(filters?: { period?: string }) { return this.request<Lead[]>('/api/v1/leads', { params: filters as any }); }
  async getLead(id: string) { return this.request<LeadDetail>(`/api/v1/leads/${id}`); }
  async updateLeadStatus(id: string, status: string) { return this.request(`/api/v1/leads/${id}/status`, { method: 'PATCH', body: { status } }); }
  async getDashboardStats() { return this.request<DashboardStats>('/api/v1/analytics'); }
  async getAgentStatus() { return this.request<AgentStatus>('/api/v1/agent/status'); }
  async registerPushToken(token: string, platform: string) { return this.request('/api/v1/notifications/register', { method: 'POST', body: { push_token: token, platform } }); }
}

export interface Lead {
  id: string; caller_name: string; caller_phone: string; summary: string;
  status: 'new' | 'contacted' | 'booked' | 'lost'; created_at: string; business_id: string;
}
export interface LeadDetail extends Lead {
  transcript: string; recording_url?: string; caller_email?: string; notes?: string;
}
export interface DashboardStats {
  leads_today: number; leads_this_week: number; leads_this_month: number;
  revenue_saved: number; capture_rate: number;
}
export interface AgentStatus {
  is_active: boolean; agent_name: string; phone_number: string;
  last_call_at?: string; total_calls_handled: number;
}

export const api = new ApiClient(BACKEND_URL);
ENDFILE
echo "  ✓ lib/api.ts"

# ═══════════════════════════════════════════════════════════════
# STORES
# ═══════════════════════════════════════════════════════════════

cat > store/authStore.ts << 'ENDFILE'
import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, metadata?: Record<string, unknown>) => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  isLoading: true,
  isAuthenticated: false,

  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        set({ user: session.user, session, isAuthenticated: true, isLoading: false });
      } else {
        set({ isLoading: false });
      }
      supabase.auth.onAuthStateChange((_event, session) => {
        set({ user: session?.user ?? null, session, isAuthenticated: !!session });
      });
    } catch (error) {
      console.error('Auth init error:', error);
      set({ isLoading: false });
    }
  },

  signIn: async (email, password) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      set({ user: data.user, session: data.session, isAuthenticated: true, isLoading: false });
    } catch (error) { set({ isLoading: false }); throw error; }
  },

  signUp: async (email, password, metadata) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase.auth.signUp({ email, password, options: { data: metadata } });
      if (error) throw error;
      set({ user: data.user, session: data.session, isAuthenticated: !!data.session, isLoading: false });
    } catch (error) { set({ isLoading: false }); throw error; }
  },

  signOut: async () => {
    set({ isLoading: true });
    try {
      await supabase.auth.signOut();
      set({ user: null, session: null, isAuthenticated: false, isLoading: false });
    } catch (error) { set({ isLoading: false }); throw error; }
  },
}));
ENDFILE
echo "  ✓ store/authStore.ts"

cat > store/leadsStore.ts << 'ENDFILE'
import { create } from 'zustand';
import { api, Lead, DashboardStats, AgentStatus } from '../lib/api';
import { supabase } from '../lib/supabase';

interface LeadsState {
  leads: Lead[];
  dashboardStats: DashboardStats | null;
  agentStatus: AgentStatus | null;
  isLoading: boolean;
  isRefreshing: boolean;
  filter: string;
  fetchLeads: (filter?: string) => Promise<void>;
  fetchDashboard: () => Promise<void>;
  fetchAgentStatus: () => Promise<void>;
  updateLeadStatus: (id: string, status: string) => Promise<void>;
  setFilter: (f: string) => void;
  refresh: () => Promise<void>;
  subscribeToRealtime: (businessId: string) => () => void;
}

export const useLeadsStore = create<LeadsState>((set, get) => ({
  leads: [],
  dashboardStats: null,
  agentStatus: null,
  isLoading: false,
  isRefreshing: false,
  filter: 'all',

  fetchLeads: async (filter) => {
    try {
      set({ isLoading: true });
      const period = filter || get().filter;
      const leads = await api.getLeads(period !== 'all' ? { period } : undefined);
      set({ leads, isLoading: false });
    } catch { set({ isLoading: false }); }
  },

  fetchDashboard: async () => {
    try { const stats = await api.getDashboardStats(); set({ dashboardStats: stats }); } catch {}
  },

  fetchAgentStatus: async () => {
    try { const status = await api.getAgentStatus(); set({ agentStatus: status }); } catch {}
  },

  updateLeadStatus: async (id, status) => {
    try {
      await api.updateLeadStatus(id, status);
      set((s) => ({ leads: s.leads.map((l) => l.id === id ? { ...l, status: status as Lead['status'] } : l) }));
    } catch {}
  },

  setFilter: (filter) => { set({ filter }); get().fetchLeads(filter); },

  refresh: async () => {
    set({ isRefreshing: true });
    await Promise.all([get().fetchLeads(), get().fetchDashboard(), get().fetchAgentStatus()]);
    set({ isRefreshing: false });
  },

  subscribeToRealtime: (businessId) => {
    const channel = supabase
      .channel('leads-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'leads', filter: `business_id=eq.${businessId}` },
        (payload) => {
          const newLead = payload.new as Lead;
          set((s) => ({
            leads: [newLead, ...s.leads],
            dashboardStats: s.dashboardStats ? { ...s.dashboardStats, leads_today: s.dashboardStats.leads_today + 1 } : null,
          }));
        })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  },
}));
ENDFILE
echo "  ✓ store/leadsStore.ts"

# ═══════════════════════════════════════════════════════════════
# COMPONENTS/UI
# ═══════════════════════════════════════════════════════════════

cat > components/ui/GlowCard.tsx << 'ENDFILE'
import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming, withDelay, interpolate } from 'react-native-reanimated';
import { Colors } from '../../constants/colors';
import { BorderRadius, Spacing } from '../../constants/layout';

interface GlowCardProps { children: React.ReactNode; style?: ViewStyle; glowColor?: string; glowIntensity?: 'subtle' | 'medium' | 'strong'; animated?: boolean; delay?: number; }

export function GlowCard({ children, style, glowColor = Colors.electric, glowIntensity = 'subtle', animated = true, delay = 0 }: GlowCardProps) {
  const glow = useSharedValue(0);
  React.useEffect(() => {
    if (animated) glow.value = withDelay(delay, withRepeat(withTiming(1, { duration: 2000 }), -1, true));
  }, [animated, delay]);

  const intensityMap = { subtle: { min: 0.06, max: 0.15 }, medium: { min: 0.12, max: 0.3 }, strong: { min: 0.2, max: 0.5 } };
  const { min, max } = intensityMap[glowIntensity];

  const borderStyle = useAnimatedStyle(() => ({
    borderColor: `rgba(14, 165, 233, ${interpolate(glow.value, [0, 1], [min, max])})`,
  }));

  return <Animated.View style={[styles.card, borderStyle, style]}>{children}</Animated.View>;
}

const styles = StyleSheet.create({
  card: { backgroundColor: Colors.bgCard, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.electricBorder, padding: Spacing.base },
});
ENDFILE
echo "  ✓ components/ui/GlowCard.tsx"

cat > components/ui/AnimatedNumber.tsx << 'ENDFILE'
import React, { useEffect } from 'react';
import { Text, TextStyle } from 'react-native';
import Animated, { useSharedValue, withTiming, withDelay, Easing, useAnimatedReaction, runOnJS } from 'react-native-reanimated';
import { Colors } from '../../constants/colors';
import { Fonts, TypeScale } from '../../constants/typography';

interface AnimatedNumberProps { value: number; prefix?: string; suffix?: string; duration?: number; delay?: number; decimals?: number; style?: TextStyle; color?: string; size?: 'lg' | 'md' | 'sm'; }

export function AnimatedNumber({ value, prefix = '', suffix = '', duration = 1200, delay: d = 0, decimals = 0, style, color = Colors.textPrimary, size = 'lg' }: AnimatedNumberProps) {
  const av = useSharedValue(0);
  const [text, setText] = React.useState(`${prefix}0${suffix}`);
  const sizeStyles = { lg: { fontSize: TypeScale.statLg, ...Fonts.monoBold }, md: { fontSize: TypeScale.stat, ...Fonts.monoBold }, sm: { fontSize: TypeScale.statSm, ...Fonts.mono } };

  const fmt = React.useCallback((n: number) => {
    const parts = n.toFixed(decimals).split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return `${prefix}${parts.join('.')}${suffix}`;
  }, [prefix, suffix, decimals]);

  useEffect(() => { av.value = withDelay(d, withTiming(value, { duration, easing: Easing.out(Easing.cubic) })); }, [value, d, duration]);
  useAnimatedReaction(() => av.value, (cur) => { runOnJS(setText)(fmt(cur)); }, [fmt]);

  return <Text style={[sizeStyles[size], { color, letterSpacing: -0.5 }, style]}>{text}</Text>;
}
ENDFILE
echo "  ✓ components/ui/AnimatedNumber.tsx"

cat > components/ui/Button.tsx << 'ENDFILE'
import React from 'react';
import { Text, StyleSheet, Pressable, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Colors } from '../../constants/colors';
import { Fonts, TypeScale } from '../../constants/typography';
import { BorderRadius, Spacing } from '../../constants/layout';
import { Springs } from '../../constants/animations';

const AP = Animated.createAnimatedComponent(Pressable);
type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps { title: string; onPress: () => void; variant?: Variant; size?: 'sm' | 'md' | 'lg'; loading?: boolean; disabled?: boolean; icon?: React.ReactNode; style?: ViewStyle; textStyle?: TextStyle; fullWidth?: boolean; }

export function Button({ title, onPress, variant = 'primary', size = 'md', loading = false, disabled = false, icon, style, textStyle, fullWidth = false }: ButtonProps) {
  const scale = useSharedValue(1);
  const aStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const pressIn = () => { scale.value = withSpring(0.96, Springs.snappy); };
  const pressOut = () => { scale.value = withSpring(1, Springs.snappy); };
  const press = () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress(); };

  const sizes = { sm: { h: 36, px: 12, fs: TypeScale.bodySm }, md: { h: 46, px: 20, fs: TypeScale.body }, lg: { h: 54, px: 24, fs: TypeScale.bodyLg } };
  const { h, px, fs } = sizes[size];
  const off = disabled || loading;

  const content = loading
    ? <ActivityIndicator size="small" color={variant === 'primary' ? '#fff' : Colors.electric} />
    : <>{icon}<Text style={[s.txt, { fontSize: fs }, variant === 'primary' && { color: '#fff' }, variant === 'secondary' && { color: Colors.electric }, variant === 'ghost' && { color: Colors.textSecondary }, variant === 'danger' && { color: Colors.danger }, off && { color: Colors.textDisabled }, textStyle]}>{title}</Text></>;

  return (
    <AP onPressIn={pressIn} onPressOut={pressOut} onPress={press} disabled={off} style={[aStyle, fullWidth && { width: '100%' }]}>
      {variant === 'primary' ? (
        <LinearGradient colors={off ? ['#1e3a5f', '#1a2e4a'] : ['#0EA5E9', '#0284C7']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={[s.base, { height: h, paddingHorizontal: px }, !off && s.shadow, style]}>{content}</LinearGradient>
      ) : (
        <Animated.View style={[s.base, { height: h, paddingHorizontal: px }, variant === 'secondary' && s.sec, variant === 'ghost' && s.ghost, off && { opacity: 0.4 }, style]}>{content}</Animated.View>
      )}
    </AP>
  );
}

const s = StyleSheet.create({
  base: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: BorderRadius.lg, gap: Spacing.sm },
  shadow: { shadowColor: Colors.electric, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
  sec: { borderWidth: 1, borderColor: Colors.borderElectric, backgroundColor: 'transparent' },
  ghost: { backgroundColor: 'transparent' },
  txt: { ...Fonts.bodySemibold, letterSpacing: 0.2 },
});
ENDFILE
echo "  ✓ components/ui/Button.tsx"

cat > components/ui/Input.tsx << 'ENDFILE'
import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TextInputProps, Pressable } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, interpolateColor } from 'react-native-reanimated';
import { Colors } from '../../constants/colors';
import { Fonts, TypeScale } from '../../constants/typography';
import { BorderRadius, Spacing } from '../../constants/layout';

interface InputProps extends TextInputProps { label?: string; error?: string; icon?: React.ReactNode; rightIcon?: React.ReactNode; onRightIconPress?: () => void; }

export function Input({ label, error, icon, rightIcon, onRightIconPress, style, ...props }: InputProps) {
  const fp = useSharedValue(0);
  const focus = () => { fp.value = withTiming(1, { duration: 150 }); };
  const blur = () => { fp.value = withTiming(0, { duration: 150 }); };
  const bc = error ? Colors.danger : Colors.electric;
  const cs = useAnimatedStyle(() => ({ borderColor: interpolateColor(fp.value, [0, 1], [Colors.border as string, bc]) }));

  return (
    <View style={st.wrap}>
      {label && <Text style={st.label}>{label}</Text>}
      <Animated.View style={[st.container, cs]}>
        {icon && <View style={st.iconL}>{icon}</View>}
        <TextInput {...props} style={[st.input, icon && { paddingLeft: 0 }, style]} placeholderTextColor={Colors.textMuted} onFocus={focus} onBlur={blur} selectionColor={Colors.electric} />
        {rightIcon && <Pressable onPress={onRightIconPress} style={st.iconR}>{rightIcon}</Pressable>}
      </Animated.View>
      {error && <Text style={st.error}>{error}</Text>}
    </View>
  );
}

const st = StyleSheet.create({
  wrap: { gap: Spacing.sm },
  label: { ...Fonts.bodyMedium, fontSize: TypeScale.bodySm, color: Colors.textSecondary, marginLeft: 2 },
  container: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bgInput, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Spacing.base, height: 50 },
  input: { flex: 1, ...Fonts.body, fontSize: TypeScale.body, color: Colors.textPrimary, paddingVertical: 0, height: '100%' },
  iconL: { marginRight: Spacing.md, width: 20, alignItems: 'center' },
  iconR: { marginLeft: Spacing.md, width: 24, alignItems: 'center', justifyContent: 'center', padding: Spacing.xs },
  error: { ...Fonts.body, fontSize: TypeScale.caption, color: Colors.danger, marginLeft: 2 },
});
ENDFILE
echo "  ✓ components/ui/Input.tsx"

cat > components/ui/StatCard.tsx << 'ENDFILE'
import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import Animated, { FadeInUp, useAnimatedStyle, useSharedValue, withRepeat, withTiming, interpolate } from 'react-native-reanimated';
import { Colors } from '../../constants/colors';
import { Fonts, TypeScale } from '../../constants/typography';
import { BorderRadius, Spacing } from '../../constants/layout';
import { Stagger } from '../../constants/animations';
import { AnimatedNumber } from './AnimatedNumber';

interface StatCardProps { label: string; value: number; prefix?: string; suffix?: string; decimals?: number; icon?: React.ReactNode; trend?: { value: number; direction: 'up' | 'down' }; accentColor?: string; index?: number; style?: ViewStyle; }

export function StatCard({ label, value, prefix = '', suffix = '', decimals = 0, icon, trend, accentColor = Colors.electric, index = 0, style }: StatCardProps) {
  const enterDelay = index * Stagger.fast;
  return (
    <Animated.View entering={FadeInUp.delay(enterDelay).springify().damping(18).stiffness(140)} style={[st.card, style]}>
      <View style={[st.accent, { backgroundColor: accentColor }]} />
      <View style={st.header}>
        {icon && <View style={st.iconWrap}>{icon}</View>}
        <Text style={st.label}>{label}</Text>
      </View>
      <View style={st.valueRow}>
        <AnimatedNumber value={value} prefix={prefix} suffix={suffix} decimals={decimals} delay={enterDelay + 200} size="md" color={Colors.textPrimary} />
        {trend && (
          <View style={[st.trendBadge, { backgroundColor: trend.direction === 'up' ? Colors.successGlow : Colors.dangerGlow }]}>
            <Text style={[st.trendText, { color: trend.direction === 'up' ? Colors.success : Colors.danger }]}>{trend.direction === 'up' ? '↑' : '↓'} {Math.abs(trend.value)}%</Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

const st = StyleSheet.create({
  card: { flex: 1, backgroundColor: Colors.bgCard, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.electricBorder, padding: Spacing.md, minHeight: 100, justifyContent: 'space-between', overflow: 'hidden' },
  accent: { position: 'absolute', top: 0, left: 0, right: 0, height: 2, borderTopLeftRadius: BorderRadius.lg, borderTopRightRadius: BorderRadius.lg },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginBottom: Spacing.sm },
  iconWrap: { width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
  label: { ...Fonts.bodyMedium, fontSize: TypeScale.caption, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  valueRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  trendBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.sm },
  trendText: { ...Fonts.mono, fontSize: TypeScale.tiny, fontWeight: '600' },
});
ENDFILE
echo "  ✓ components/ui/StatCard.tsx"

cat > components/ui/Badge.tsx << 'ENDFILE'
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, StatusColors, StatusType } from '../../constants/colors';
import { Fonts, TypeScale } from '../../constants/typography';
import { BorderRadius, Spacing } from '../../constants/layout';

const labels: Record<StatusType, string> = { new: 'New', contacted: 'Contacted', booked: 'Booked', lost: 'Lost', active: 'Active', inactive: 'Inactive' };

export function Badge({ status, label, size = 'sm' }: { status: StatusType; label?: string; size?: 'sm' | 'md' }) {
  const color = StatusColors[status];
  const sm = size === 'sm';
  return (
    <View style={[st.badge, { backgroundColor: `${color}15`, paddingHorizontal: sm ? Spacing.sm : Spacing.md, paddingVertical: sm ? 2 : 4 }]}>
      <View style={[st.dot, { backgroundColor: color, width: sm ? 6 : 8, height: sm ? 6 : 8 }]} />
      <Text style={[st.label, { color, fontSize: sm ? TypeScale.tiny : TypeScale.caption }]}>{label || labels[status]}</Text>
    </View>
  );
}

const st = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, borderRadius: BorderRadius.full },
  dot: { borderRadius: BorderRadius.full },
  label: { ...Fonts.bodyMedium, letterSpacing: 0.3 },
});
ENDFILE
echo "  ✓ components/ui/Badge.tsx"

# ═══════════════════════════════════════════════════════════════
# APP LAYOUTS
# ═══════════════════════════════════════════════════════════════

cat > app/_layout.tsx << 'ENDFILE'
import { useEffect } from 'react';
import { View, StatusBar } from 'react-native';
import { Slot, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useAuthStore } from '../store/authStore';
import { Colors } from '../constants/colors';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { initialize, isLoading, isAuthenticated } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => { initialize(); }, []);
  useEffect(() => { if (!isLoading) SplashScreen.hideAsync(); }, [isLoading]);
  useEffect(() => {
    if (isLoading) return;
    const inAuth = segments[0] === '(auth)';
    if (!isAuthenticated && !inAuth) router.replace('/(auth)/login');
    else if (isAuthenticated && inAuth) router.replace('/(tabs)');
  }, [isAuthenticated, isLoading, segments]);

  if (isLoading) return null;
  return (
    <View style={{ flex: 1, backgroundColor: Colors.bgVoid }}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bgVoid} />
      <Slot />
    </View>
  );
}
ENDFILE
echo "  ✓ app/_layout.tsx"

cat > 'app/(auth)/_layout.tsx' << 'ENDFILE'
import { Stack } from 'expo-router';
import { Colors } from '../../constants/colors';

export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.bgVoid }, animation: 'fade' }} />;
}
ENDFILE
echo "  ✓ app/(auth)/_layout.tsx"

cat > 'app/(auth)/login.tsx' << 'ENDFILE'
import { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, Pressable, Alert, Dimensions } from 'react-native';
import Animated, { FadeInDown, FadeInUp, useAnimatedStyle, useSharedValue, withRepeat, withTiming, interpolate } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Colors } from '../../constants/colors';
import { Fonts, TypeScale, TextStyles } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/layout';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, isLoading } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const glowP = useSharedValue(0);
  useState(() => { glowP.value = withRepeat(withTiming(1, { duration: 3000 }), -1, true); });
  const glowS = useAnimatedStyle(() => ({ opacity: interpolate(glowP.value, [0, 1], [0.3, 0.7]), transform: [{ scale: interpolate(glowP.value, [0, 1], [1, 1.1]) }] }));

  const validate = () => {
    const e: typeof errors = {};
    if (!email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Enter a valid email';
    if (!password) e.password = 'Password is required';
    else if (password.length < 6) e.password = 'Must be at least 6 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    try { await signIn(email.trim().toLowerCase(), password); }
    catch (err: any) { Alert.alert('Sign In Failed', err.message || 'Check your credentials.'); }
  };

  return (
    <KeyboardAvoidingView style={st.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <Animated.View style={[st.ambientGlow, glowS]}>
        <LinearGradient colors={['transparent', 'rgba(14, 165, 233, 0.06)', 'transparent']} style={StyleSheet.absoluteFill} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} />
      </Animated.View>
      <View style={st.content}>
        <Animated.View entering={FadeInDown.delay(100).springify().damping(20)} style={st.logoSection}>
          <View style={st.logoIcon}><Ionicons name="flash" size={32} color={Colors.electric} /></View>
          <Text style={st.logoText}>Conduit AI</Text>
          <Text style={st.tagline}>Your AI-powered command center</Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(300).springify().damping(18)} style={st.formSection}>
          <Input label="Email" placeholder="you@business.com" value={email} onChangeText={setEmail} error={errors.email} keyboardType="email-address" autoCapitalize="none" icon={<Ionicons name="mail-outline" size={18} color={Colors.textMuted} />} />
          <View style={{ height: Spacing.base }} />
          <Input label="Password" placeholder="Enter your password" value={password} onChangeText={setPassword} error={errors.password} secureTextEntry={!showPw} autoCapitalize="none"
            icon={<Ionicons name="lock-closed-outline" size={18} color={Colors.textMuted} />}
            rightIcon={<Ionicons name={showPw ? 'eye-off-outline' : 'eye-outline'} size={18} color={Colors.textMuted} />}
            onRightIconPress={() => setShowPw(!showPw)} />
          <Pressable onPress={() => {}} style={st.forgot}><Text style={st.forgotTxt}>Forgot password?</Text></Pressable>
          <Button title="Sign In" onPress={handleLogin} loading={isLoading} fullWidth size="lg" style={{ marginTop: Spacing.lg }} />
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(500).springify().damping(18)} style={st.bottom}>
          <View style={st.divider}><View style={st.divLine} /><Text style={st.divTxt}>or</Text><View style={st.divLine} /></View>
          <Button title="Start Free Trial" onPress={() => {}} variant="secondary" fullWidth size="lg" />
          <Text style={st.trialNote}>14 days free · No commitment · Cancel anytime</Text>
        </Animated.View>
      </View>
    </KeyboardAvoidingView>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgVoid },
  ambientGlow: { position: 'absolute', top: -height * 0.2, left: -width * 0.3, right: -width * 0.3, height: height * 0.6, borderRadius: width },
  content: { flex: 1, paddingHorizontal: Spacing.xl, justifyContent: 'center' },
  logoSection: { alignItems: 'center', marginBottom: Spacing['3xl'] },
  logoIcon: { width: 64, height: 64, borderRadius: 20, backgroundColor: Colors.electricMuted, borderWidth: 1, borderColor: Colors.electricBorder, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.base },
  logoText: { ...TextStyles.h1, color: Colors.textPrimary, letterSpacing: -1 },
  tagline: { ...Fonts.body, fontSize: TypeScale.bodySm, color: Colors.textMuted, marginTop: Spacing.xs },
  formSection: { marginBottom: Spacing.xl },
  forgot: { alignSelf: 'flex-end', marginTop: Spacing.md, padding: Spacing.xs },
  forgotTxt: { ...Fonts.bodyMedium, fontSize: TypeScale.bodySm, color: Colors.electric },
  bottom: { gap: Spacing.base },
  divider: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  divLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  divTxt: { ...Fonts.body, fontSize: TypeScale.caption, color: Colors.textMuted },
  trialNote: { ...Fonts.body, fontSize: TypeScale.caption, color: Colors.textMuted, textAlign: 'center' },
});
ENDFILE
echo "  ✓ app/(auth)/login.tsx"

# ═══════════════════════════════════════════════════════════════
# TAB SCREENS
# ═══════════════════════════════════════════════════════════════

cat > 'app/(tabs)/_layout.tsx' << 'ENDFILE'
import { Tabs } from 'expo-router';
import { View, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Colors } from '../../constants/colors';
import { Fonts } from '../../constants/typography';
import { TabBar as TB } from '../../constants/layout';
import { Springs } from '../../constants/animations';

function TabIcon({ name, focused, color }: { name: keyof typeof Ionicons.glyphMap; focused: boolean; color: string }) {
  const scale = useSharedValue(focused ? 1.05 : 0.9);
  scale.value = withSpring(focused ? 1.05 : 0.9, Springs.snappy);
  const as = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={[st.iconC, as]}>
      {focused && <View style={st.glow} />}
      <Ionicons name={name} size={TB.iconSize} color={color} />
    </Animated.View>
  );
}

export default function TabLayout() {
  return (
    <Tabs screenOptions={{
      headerShown: false, tabBarActiveTintColor: Colors.electric, tabBarInactiveTintColor: Colors.textMuted,
      tabBarLabelStyle: { ...Fonts.bodyMedium, fontSize: TB.labelSize, marginTop: -2 },
      tabBarStyle: { backgroundColor: Platform.OS === 'ios' ? 'rgba(10, 15, 30, 0.92)' : Colors.bgPrimary, borderTopColor: Colors.border, borderTopWidth: 1, height: TB.height + (Platform.OS === 'ios' ? 20 : 0), paddingTop: 8, paddingBottom: Platform.OS === 'ios' ? 24 : 8 },
    }} screenListeners={{ tabPress: () => { Haptics.selectionAsync(); } }}>
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ focused, color }) => <TabIcon name={focused ? 'home' : 'home-outline'} focused={focused} color={color} /> }} />
      <Tabs.Screen name="calls" options={{ title: 'Leads', tabBarIcon: ({ focused, color }) => <TabIcon name={focused ? 'call' : 'call-outline'} focused={focused} color={color} /> }} />
      <Tabs.Screen name="analytics" options={{ title: 'Analytics', tabBarIcon: ({ focused, color }) => <TabIcon name={focused ? 'stats-chart' : 'stats-chart-outline'} focused={focused} color={color} /> }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings', tabBarIcon: ({ focused, color }) => <TabIcon name={focused ? 'settings' : 'settings-outline'} focused={focused} color={color} /> }} />
    </Tabs>
  );
}

const st = StyleSheet.create({
  iconC: { alignItems: 'center', justifyContent: 'center', width: 40, height: 28 },
  glow: { position: 'absolute', width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.electricMuted },
});
ENDFILE
echo "  ✓ app/(tabs)/_layout.tsx"

cat > 'app/(tabs)/index.tsx' << 'ENDFILE'
import { useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Pressable, Dimensions } from 'react-native';
import Animated, { FadeInDown, FadeInRight, useAnimatedStyle, useSharedValue, withRepeat, withTiming, withDelay, interpolate, withSequence } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLeadsStore } from '../../store/leadsStore';
import { useAuthStore } from '../../store/authStore';
import { GlowCard } from '../../components/ui/GlowCard';
import { StatCard } from '../../components/ui/StatCard';
import { Badge } from '../../components/ui/Badge';
import { Colors } from '../../constants/colors';
import { Fonts, TypeScale, TextStyles } from '../../constants/typography';
import { Spacing, BorderRadius, ScreenPadding } from '../../constants/layout';
import { Stagger } from '../../constants/animations';

function getGreeting() { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'; }
function getTimeAgo(d: string) { const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000); if (m < 1) return 'Just now'; if (m < 60) return `${m}m ago`; const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`; return `${Math.floor(h / 24)}d ago`; }

function WaveBar({ index, active }: { index: number; active: boolean }) {
  const h = useSharedValue(4);
  useEffect(() => {
    if (active) h.value = withDelay(index * 100, withRepeat(withSequence(withTiming(8 + Math.random() * 16, { duration: 400 + Math.random() * 200 }), withTiming(4 + Math.random() * 8, { duration: 300 + Math.random() * 200 })), -1, false));
    else h.value = withTiming(4, { duration: 300 });
  }, [active, index]);
  const bs = useAnimatedStyle(() => ({ height: h.value }));
  return <Animated.View style={[st.waveBar, bs, { backgroundColor: active ? Colors.success : Colors.textMuted }]} />;
}

export default function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { leads, dashboardStats, agentStatus, isRefreshing, fetchLeads, fetchDashboard, fetchAgentStatus, refresh, subscribeToRealtime } = useLeadsStore();

  const agentPulse = useSharedValue(0);
  const agentGlow = useSharedValue(0);

  useEffect(() => {
    fetchDashboard(); fetchLeads('today'); fetchAgentStatus();
    agentPulse.value = withRepeat(withTiming(1, { duration: 2000 }), -1, true);
    agentGlow.value = withRepeat(withSequence(withTiming(1, { duration: 1500 }), withTiming(0, { duration: 1500 })), -1, false);
    const bid = user?.user_metadata?.business_id;
    if (bid) { const unsub = subscribeToRealtime(bid); return unsub; }
  }, []);

  const onRefresh = useCallback(async () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); await refresh(); }, []);
  const dotS = useAnimatedStyle(() => ({ transform: [{ scale: interpolate(agentPulse.value, [0, 1], [1, 1.3]) }], opacity: interpolate(agentPulse.value, [0, 1], [1, 0.6]) }));
  const glowS = useAnimatedStyle(() => ({ opacity: interpolate(agentGlow.value, [0, 1], [0, 0.4]), transform: [{ scale: interpolate(agentGlow.value, [0, 1], [1, 2]) }] }));

  const stats = dashboardStats || { leads_today: 12, revenue_saved: 4200, capture_rate: 89 };
  const recentLeads = leads.length > 0 ? leads.slice(0, 5) : [
    { id: '1', caller_name: 'Maria Gonzalez', caller_phone: '(561) 555-0134', summary: 'Needs haircut, Saturday 2pm', status: 'new' as const, created_at: new Date(Date.now() - 2 * 60000).toISOString() },
    { id: '2', caller_name: 'James Wilson', caller_phone: '(561) 555-0891', summary: 'Beard trim, this week', status: 'new' as const, created_at: new Date(Date.now() - 18 * 60000).toISOString() },
    { id: '3', caller_name: 'Sofia Reyes', caller_phone: '(561) 555-0567', summary: 'Color appointment inquiry', status: 'contacted' as const, created_at: new Date(Date.now() - 60 * 60000).toISOString() },
  ];

  const name = user?.user_metadata?.owner_name || 'there';
  const biz = user?.user_metadata?.business_name || '';
  const active = agentStatus?.is_active ?? true;

  return (
    <ScrollView style={[st.container, { paddingTop: insets.top }]} contentContainerStyle={st.scroll} showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={Colors.electric} />}>

      <Animated.View entering={FadeInDown.delay(0).springify().damping(20)} style={st.header}>
        <View style={st.headerL}>
          <Text style={st.greeting}>{getGreeting()}, {name} 👋</Text>
          {biz ? <Text style={st.bizName}>{biz}</Text> : null}
        </View>
        <Pressable onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)} style={st.notifBtn}>
          <Ionicons name="notifications-outline" size={22} color={Colors.textSecondary} />
          <View style={st.notifDot} />
        </Pressable>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(100).springify().damping(18)}>
        <GlowCard style={st.agentCard} glowColor={active ? Colors.success : Colors.danger} glowIntensity="medium">
          <View style={st.agentRow}>
            <View style={st.agentL}>
              <View style={st.agentDotC}>
                <Animated.View style={[st.agentDotGlow, glowS, { backgroundColor: active ? Colors.success : Colors.danger }]} />
                <Animated.View style={[st.agentDot, dotS, { backgroundColor: active ? Colors.success : Colors.danger }]} />
              </View>
              <View>
                <Text style={st.agentTitle}>AI Agent: {active ? 'Active' : 'Inactive'}</Text>
                <Text style={st.agentSub}>{active ? 'Answering calls 24/7' : 'Agent is paused'}</Text>
              </View>
            </View>
            <View style={st.waveform}>{[...Array(5)].map((_, i) => <WaveBar key={i} index={i} active={active} />)}</View>
          </View>
        </GlowCard>
      </Animated.View>

      <View style={st.statsRow}>
        <StatCard label="Leads" value={stats.leads_today} icon={<Ionicons name="call" size={14} color={Colors.electric} />} accentColor={Colors.electric} index={0} trend={{ value: 18, direction: 'up' }} />
        <StatCard label="Revenue" value={stats.revenue_saved} prefix="$" icon={<Ionicons name="trending-up" size={14} color={Colors.success} />} accentColor={Colors.success} index={1} />
        <StatCard label="Capture" value={stats.capture_rate} suffix="%" icon={<Ionicons name="checkmark-circle" size={14} color={Colors.cyan} />} accentColor={Colors.cyan} index={2} />
      </View>

      <Animated.View entering={FadeInDown.delay(400).springify().damping(18)} style={st.secHeader}>
        <Text style={st.secTitle}>Recent Activity</Text>
        <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/(tabs)/calls'); }}>
          <Text style={st.viewAll}>View All</Text>
        </Pressable>
      </Animated.View>

      {recentLeads.map((lead, i) => (
        <Animated.View key={lead.id} entering={FadeInRight.delay(500 + i * Stagger.normal).springify().damping(18)}>
          <Pressable onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}>
            <GlowCard style={st.leadCard} animated={false}>
              <View style={st.leadRow}>
                <LinearGradient colors={Colors.gradientElectric} style={st.leadAvatar}>
                  <Text style={st.leadAvatarTxt}>{lead.caller_name.charAt(0)}</Text>
                </LinearGradient>
                <View style={st.leadInfo}>
                  <View style={st.leadNameRow}>
                    <Text style={st.leadName} numberOfLines={1}>{lead.caller_name}</Text>
                    <Text style={st.leadTime}>{getTimeAgo(lead.created_at)}</Text>
                  </View>
                  <Text style={st.leadSummary} numberOfLines={1}>{lead.summary}</Text>
                  <View style={st.leadBottom}>
                    <Text style={st.leadPhone}>{lead.caller_phone}</Text>
                    <Badge status={lead.status} size="sm" />
                  </View>
                </View>
              </View>
            </GlowCard>
          </Pressable>
        </Animated.View>
      ))}
      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgPrimary },
  scroll: { paddingHorizontal: ScreenPadding.horizontal, gap: Spacing.base },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingTop: Spacing.base, marginBottom: Spacing.sm },
  headerL: { flex: 1 },
  greeting: { ...TextStyles.h2, color: Colors.textPrimary },
  bizName: { ...Fonts.body, fontSize: TypeScale.bodySm, color: Colors.textMuted, marginTop: 2 },
  notifBtn: { width: 40, height: 40, borderRadius: BorderRadius.lg, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  notifDot: { position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.electric, borderWidth: 2, borderColor: Colors.bgCard },
  agentCard: { paddingVertical: Spacing.lg },
  agentRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  agentL: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  agentDotC: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  agentDot: { width: 10, height: 10, borderRadius: 5 },
  agentDotGlow: { position: 'absolute', width: 24, height: 24, borderRadius: 12 },
  agentTitle: { ...Fonts.bodySemibold, fontSize: TypeScale.body, color: Colors.textPrimary },
  agentSub: { ...Fonts.body, fontSize: TypeScale.caption, color: Colors.textMuted, marginTop: 1 },
  waveform: { flexDirection: 'row', alignItems: 'center', gap: 3, height: 28 },
  waveBar: { width: 3, borderRadius: 2, minHeight: 4 },
  statsRow: { flexDirection: 'row', gap: Spacing.md },
  secHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.sm },
  secTitle: { ...Fonts.bodySemibold, fontSize: TypeScale.h4, color: Colors.textPrimary },
  viewAll: { ...Fonts.bodyMedium, fontSize: TypeScale.bodySm, color: Colors.electric },
  leadCard: { padding: Spacing.md },
  leadRow: { flexDirection: 'row', gap: Spacing.md },
  leadAvatar: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  leadAvatarTxt: { ...Fonts.displayBold, fontSize: TypeScale.h3, color: '#fff' },
  leadInfo: { flex: 1, gap: 3 },
  leadNameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  leadName: { ...Fonts.bodySemibold, fontSize: TypeScale.body, color: Colors.textPrimary, flex: 1 },
  leadTime: { ...Fonts.mono, fontSize: TypeScale.tiny, color: Colors.textMuted, marginLeft: Spacing.sm },
  leadSummary: { ...Fonts.body, fontSize: TypeScale.bodySm, color: Colors.textSecondary },
  leadBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 },
  leadPhone: { ...Fonts.mono, fontSize: TypeScale.caption, color: Colors.textMuted },
});
ENDFILE
echo "  ✓ app/(tabs)/index.tsx — DASHBOARD"

cat > 'app/(tabs)/calls.tsx' << 'ENDFILE'
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { TextStyles } from '../../constants/typography';
import { ScreenPadding, Spacing } from '../../constants/layout';

export default function CallsScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[st.c, { paddingTop: insets.top + Spacing.base }]}>
      <Text style={st.t}>Your Leads</Text>
      <Text style={st.s}>Full lead list with filtering — building next</Text>
    </View>
  );
}
const st = StyleSheet.create({ c: { flex: 1, backgroundColor: Colors.bgPrimary, paddingHorizontal: ScreenPadding.horizontal }, t: { ...TextStyles.h1, color: Colors.textPrimary }, s: { ...TextStyles.body, color: Colors.textMuted, marginTop: Spacing.sm } });
ENDFILE
echo "  ✓ app/(tabs)/calls.tsx"

cat > 'app/(tabs)/analytics.tsx' << 'ENDFILE'
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { TextStyles } from '../../constants/typography';
import { ScreenPadding, Spacing } from '../../constants/layout';

export default function AnalyticsScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[st.c, { paddingTop: insets.top + Spacing.base }]}>
      <Text style={st.t}>Analytics</Text>
      <Text style={st.s}>Revenue impact, charts, insights — building next</Text>
    </View>
  );
}
const st = StyleSheet.create({ c: { flex: 1, backgroundColor: Colors.bgPrimary, paddingHorizontal: ScreenPadding.horizontal }, t: { ...TextStyles.h1, color: Colors.textPrimary }, s: { ...TextStyles.body, color: Colors.textMuted, marginTop: Spacing.sm } });
ENDFILE
echo "  ✓ app/(tabs)/analytics.tsx"

cat > 'app/(tabs)/settings.tsx' << 'ENDFILE'
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { Colors } from '../../constants/colors';
import { TextStyles, Fonts, TypeScale } from '../../constants/typography';
import { ScreenPadding, Spacing, BorderRadius } from '../../constants/layout';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { signOut, user } = useAuthStore();
  const handleSignOut = () => { Alert.alert('Sign Out', 'Are you sure?', [{ text: 'Cancel', style: 'cancel' }, { text: 'Sign Out', style: 'destructive', onPress: () => signOut() }]); };

  return (
    <View style={[st.c, { paddingTop: insets.top + Spacing.base }]}>
      <Text style={st.t}>Settings</Text>
      <View style={st.sec}><Text style={st.secL}>Account</Text><View style={st.card}><Text style={st.email}>{user?.email || 'user@email.com'}</Text></View></View>
      <Pressable onPress={handleSignOut} style={st.so}><Ionicons name="log-out-outline" size={20} color={Colors.danger} /><Text style={st.soTxt}>Sign Out</Text></Pressable>
    </View>
  );
}
const st = StyleSheet.create({
  c: { flex: 1, backgroundColor: Colors.bgPrimary, paddingHorizontal: ScreenPadding.horizontal },
  t: { ...TextStyles.h1, color: Colors.textPrimary, marginBottom: Spacing.xl },
  sec: { gap: Spacing.sm, marginBottom: Spacing.xl },
  secL: { ...Fonts.bodyMedium, fontSize: TypeScale.caption, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  card: { backgroundColor: Colors.bgCard, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border, padding: Spacing.base },
  email: { ...Fonts.body, fontSize: TypeScale.body, color: Colors.textPrimary },
  so: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.md },
  soTxt: { ...Fonts.bodyMedium, fontSize: TypeScale.body, color: Colors.danger },
});
ENDFILE
echo "  ✓ app/(tabs)/settings.tsx"

# ═══════════════════════════════════════════════════════════════
echo ""
echo "⚡ Done! 20 files written."
echo ""
echo "Next: run 'npx expo start' to launch the app"
echo "═══════════════════════════════════════════════════════════════"
