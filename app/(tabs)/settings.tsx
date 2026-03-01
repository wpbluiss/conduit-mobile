import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, Switch, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';
import { useLeadsStore } from '../../store/leadsStore';
import { Colors } from '../../constants/colors';
import { TextStyles, Fonts, TypeScale } from '../../constants/typography';
import { ScreenPadding, Spacing, BorderRadius } from '../../constants/layout';

const APP_VERSION = '1.0.0';
const SUPPORT_EMAIL = 'support@conduitai.io';
const SUPPORT_PHONE = '18005551234';
const TERMS_URL = 'https://www.conduitai.io/terms';
const PRIVACY_URL = 'https://www.conduitai.io/privacy';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

function SectionLabel({ children }: { children: string }) {
  return <Text style={st.sectionLabel}>{children}</Text>;
}

function Row({
  icon,
  iconColor,
  label,
  value,
  onPress,
  rightElement,
  isLast,
  danger,
}: {
  icon: IoniconsName;
  iconColor?: string;
  label: string;
  value?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  isLast?: boolean;
  danger?: boolean;
}) {
  const content = (
    <View style={[st.row, !isLast && st.rowBorder]}>
      <View style={[st.rowIconWrap, { backgroundColor: danger ? Colors.dangerGlow : `${iconColor || Colors.electric}15` }]}>
        <Ionicons name={icon} size={18} color={danger ? Colors.danger : iconColor || Colors.electric} />
      </View>
      <View style={st.rowBody}>
        <Text style={[st.rowLabel, danger && { color: Colors.danger }]}>{label}</Text>
        {value ? <Text style={st.rowValue} numberOfLines={1}>{value}</Text> : null}
      </View>
      {rightElement || (onPress ? <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} /> : null)}
    </View>
  );
  if (onPress) return <Pressable onPress={onPress}>{content}</Pressable>;
  return content;
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { signOut, user } = useAuthStore();
  const { agentStatus } = useLeadsStore();

  const meta = user?.user_metadata;
  const ownerName = meta?.owner_name || meta?.full_name || meta?.name || meta?.display_name || '';
  const email = user?.email || '';
  const businessName = meta?.business_name || '';
  const greetingMessage = meta?.greeting_message || 'Hi, thanks for calling! How can I help you today?';

  const agentActive = agentStatus?.is_active ?? true;
  const [agentToggle, setAgentToggle] = useState(agentActive);
  const [pushEnabled, setPushEnabled] = useState(true);

  const handleAgentToggle = (val: boolean) => {
    if (!val) {
      Alert.alert(
        'Pause AI Agent',
        'Your agent will stop answering calls. Missed calls won\'t be captured.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Pause Agent', style: 'destructive', onPress: () => setAgentToggle(false) },
        ]
      );
    } else {
      setAgentToggle(true);
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  return (
    <ScrollView
      style={[st.container, { paddingTop: insets.top }]}
      contentContainerStyle={st.scroll}
      showsVerticalScrollIndicator={false}
    >
      <Text style={st.title}>Settings</Text>

      {/* Account */}
      <SectionLabel>Account</SectionLabel>
      <View style={st.card}>
        <Row icon="person-outline" label="Name" value={ownerName || 'Not set'} />
        <Row icon="mail-outline" label="Email" value={email || 'Not set'} />
        <Row icon="business-outline" label="Business" value={businessName || 'Not set'} isLast />
      </View>

      {/* AI Agent */}
      <SectionLabel>AI Agent</SectionLabel>
      <View style={st.card}>
        <Row
          icon="flash-outline"
          iconColor={agentToggle ? Colors.success : Colors.textMuted}
          label="Agent Active"
          rightElement={
            <Switch
              value={agentToggle}
              onValueChange={handleAgentToggle}
              trackColor={{ false: Colors.bgElevated, true: Colors.success }}
              thumbColor="#fff"
            />
          }
        />
        <View style={st.greetingRow}>
          <View style={st.greetingLabelRow}>
            <Ionicons name="chatbubble-ellipses-outline" size={14} color={Colors.textMuted} />
            <Text style={st.greetingLabel}>Greeting Preview</Text>
          </View>
          <Text style={st.greetingText}>"{greetingMessage}"</Text>
        </View>
      </View>

      {/* Notifications */}
      <SectionLabel>Notifications</SectionLabel>
      <View style={st.card}>
        <Row
          icon="notifications-outline"
          iconColor={Colors.warning}
          label="Push Notifications"
          rightElement={
            <Switch
              value={pushEnabled}
              onValueChange={setPushEnabled}
              trackColor={{ false: Colors.bgElevated, true: Colors.electric }}
              thumbColor="#fff"
            />
          }
          isLast
        />
      </View>

      {/* Subscription */}
      <SectionLabel>Subscription</SectionLabel>
      <View style={st.card}>
        <Row icon="diamond-outline" iconColor={Colors.cyan} label="Current Plan" value="Pro" />
        <Row
          icon="card-outline"
          iconColor={Colors.cyan}
          label="Manage Billing"
          onPress={() => Linking.openURL('https://www.conduitai.io/billing')}
          isLast
        />
      </View>

      {/* Support */}
      <SectionLabel>Support</SectionLabel>
      <View style={st.card}>
        <Row
          icon="mail-outline"
          iconColor={Colors.warning}
          label="Email Support"
          value={SUPPORT_EMAIL}
          onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}
        />
        <Row
          icon="call-outline"
          iconColor={Colors.warning}
          label="Call Support"
          onPress={() => Linking.openURL(`tel:${SUPPORT_PHONE}`)}
          isLast
        />
      </View>

      {/* App Info */}
      <SectionLabel>App Info</SectionLabel>
      <View style={st.card}>
        <Row icon="information-circle-outline" iconColor={Colors.textSecondary} label="Version" value={APP_VERSION} />
        <Row
          icon="document-text-outline"
          iconColor={Colors.textSecondary}
          label="Terms of Service"
          onPress={() => Linking.openURL(TERMS_URL)}
        />
        <Row
          icon="shield-checkmark-outline"
          iconColor={Colors.textSecondary}
          label="Privacy Policy"
          onPress={() => Linking.openURL(PRIVACY_URL)}
          isLast
        />
      </View>

      {/* Sign Out */}
      <View style={[st.card, { marginTop: Spacing.xl }]}>
        <Row
          icon="log-out-outline"
          label="Sign Out"
          onPress={handleSignOut}
          danger
          isLast
        />
      </View>

      <Text style={st.footer}>Conduit AI v{APP_VERSION}</Text>
      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgPrimary },
  scroll: { paddingHorizontal: ScreenPadding.horizontal },

  title: {
    ...TextStyles.h1,
    color: Colors.textPrimary,
    paddingTop: Spacing.base,
    marginBottom: Spacing.lg,
  },

  // Section label
  sectionLabel: {
    ...Fonts.bodyMedium,
    fontSize: TypeScale.caption,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
  },

  // Card
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },

  // Row
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  rowIconWrap: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: { flex: 1 },
  rowLabel: {
    ...Fonts.bodySemibold,
    fontSize: TypeScale.body,
    color: Colors.textPrimary,
  },
  rowValue: {
    ...Fonts.body,
    fontSize: TypeScale.bodySm,
    color: Colors.textSecondary,
    marginTop: 1,
  },

  // Greeting preview
  greetingRow: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.base,
  },
  greetingLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  greetingLabel: {
    ...Fonts.bodyMedium,
    fontSize: TypeScale.caption,
    color: Colors.textMuted,
  },
  greetingText: {
    ...Fonts.body,
    fontSize: TypeScale.bodySm,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    backgroundColor: Colors.bgInput,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },

  // Footer
  footer: {
    ...Fonts.mono,
    fontSize: TypeScale.tiny,
    color: Colors.textDisabled,
    textAlign: 'center',
    marginTop: Spacing.xl,
  },
});
