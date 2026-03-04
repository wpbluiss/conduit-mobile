import { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { View, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../contexts/ThemeContext';
import { Fonts } from '../../constants/typography';
import { TabBar as TB } from '../../constants/layout';
import { Springs } from '../../constants/animations';
import type { ThemeColors } from '../../constants/colors';

function TabIcon({ name, focused, color, colors }: { name: keyof typeof Ionicons.glyphMap; focused: boolean; color: string; colors: ThemeColors }) {
  const scale = useSharedValue(focused ? 1.05 : 0.9);
  useEffect(() => {
    scale.value = withSpring(focused ? 1.05 : 0.9, Springs.snappy);
  }, [focused]);
  const as = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={[st.iconC, as]}>
      {focused && <View style={[st.glow, { backgroundColor: colors.electricMuted }]} />}
      <Ionicons name={name} size={TB.iconSize} color={color} />
    </Animated.View>
  );
}

export default function TabLayout() {
  const { colors, isDark } = useTheme();
  return (
    <Tabs screenOptions={{
      headerShown: false, tabBarActiveTintColor: colors.electric, tabBarInactiveTintColor: colors.textMuted,
      tabBarLabelStyle: { ...Fonts.bodyMedium, fontSize: TB.labelSize, marginTop: -2 },
      tabBarStyle: { backgroundColor: Platform.OS === 'ios' ? (isDark ? 'rgba(10, 15, 30, 0.92)' : 'rgba(255, 255, 255, 0.95)') : colors.bgPrimary, borderTopColor: colors.border, borderTopWidth: 1, height: TB.height + (Platform.OS === 'ios' ? 20 : 0), paddingTop: 8, paddingBottom: Platform.OS === 'ios' ? 24 : 8 },
    }} screenListeners={{ tabPress: () => { Haptics.selectionAsync(); } }}>
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ focused, color }) => <TabIcon name={focused ? 'home' : 'home-outline'} focused={focused} color={color} colors={colors} /> }} />
      <Tabs.Screen name="agent" options={{ title: 'AI Agent', tabBarIcon: ({ focused, color }) => <TabIcon name={focused ? 'hardware-chip' : 'hardware-chip-outline'} focused={focused} color={color} colors={colors} /> }} />
      <Tabs.Screen name="calls" options={{ title: 'Leads', tabBarIcon: ({ focused, color }) => <TabIcon name={focused ? 'call' : 'call-outline'} focused={focused} color={color} colors={colors} /> }} />
      <Tabs.Screen name="messages" options={{ title: 'Messages', tabBarIcon: ({ focused, color }) => <TabIcon name={focused ? 'chatbubbles' : 'chatbubbles-outline'} focused={focused} color={color} colors={colors} /> }} />
      <Tabs.Screen name="analytics" options={{ title: 'Analytics', tabBarIcon: ({ focused, color }) => <TabIcon name={focused ? 'stats-chart' : 'stats-chart-outline'} focused={focused} color={color} colors={colors} /> }} />
      <Tabs.Screen name="affiliates" options={{ title: 'Referrals', tabBarIcon: ({ focused, color }) => <TabIcon name={focused ? 'people' : 'people-outline'} focused={focused} color={color} colors={colors} /> }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings', tabBarIcon: ({ focused, color }) => <TabIcon name={focused ? 'settings' : 'settings-outline'} focused={focused} color={color} colors={colors} /> }} />
    </Tabs>
  );
}

const st = StyleSheet.create({
  iconC: { alignItems: 'center', justifyContent: 'center', width: 40, height: 28 },
  glow: { position: 'absolute', width: 32, height: 32, borderRadius: 16 },
});
