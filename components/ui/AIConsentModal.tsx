import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  Switch,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Fonts, TypeScale } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/layout';

interface AIConsentModalProps {
  visible: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export function AIConsentModal({ visible, onAccept, onDecline }: AIConsentModalProps) {
  const [consentGiven, setConsentGiven] = useState(false);

  const dataItems = [
    {
      icon: 'mic-outline' as const,
      title: 'Voice & Call Audio',
      desc: 'Call audio is processed by Vapi AI to generate real-time transcriptions and responses.',
      who: 'Vapi AI (vapi.ai)',
    },
    {
      icon: 'person-outline' as const,
      title: 'Caller Information',
      desc: "Caller names, phone numbers, and spoken requests are captured to populate your leads dashboard.",
      who: 'Supabase (supabase.com) · Twilio (twilio.com)',
    },
    {
      icon: 'chatbubble-outline' as const,
      title: 'Call Transcripts',
      desc: 'Conversations are transcribed and summarized using AI language models to generate lead summaries.',
      who: 'Vapi AI · OpenAI (openai.com)',
    },
    {
      icon: 'business-outline' as const,
      title: 'Business Configuration',
      desc: 'Your business name, greeting, and settings are sent to Vapi to configure your AI agent.',
      who: 'Vapi AI',
    },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDecline}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <Ionicons name="shield-checkmark" size={28} color={Colors.electric} />
            </View>
            <Text style={styles.title}>Data & Privacy Disclosure</Text>
            <Text style={styles.subtitle}>
              Conduit AI uses third-party AI services to power voice call handling. Before you
              continue, please review what data is shared and with whom.
            </Text>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Data items */}
            {dataItems.map((item, i) => (
              <View key={i} style={styles.dataItem}>
                <View style={styles.dataIconWrap}>
                  <Ionicons name={item.icon} size={20} color={Colors.electric} />
                </View>
                <View style={styles.dataInfo}>
                  <Text style={styles.dataTitle}>{item.title}</Text>
                  <Text style={styles.dataDesc}>{item.desc}</Text>
                  <View style={styles.dataBadge}>
                    <Ionicons name="cube-outline" size={11} color={Colors.textMuted} />
                    <Text style={styles.dataBadgeText}>{item.who}</Text>
                  </View>
                </View>
              </View>
            ))}

            {/* Privacy policy link */}
            <Pressable
              onPress={() => Linking.openURL('https://conduitai.io/privacy')}
              style={styles.privacyLink}
            >
              <Ionicons name="document-text-outline" size={14} color={Colors.electric} />
              <Text style={styles.privacyLinkText}>Read our full Privacy Policy</Text>
              <Ionicons name="open-outline" size={12} color={Colors.electric} />
            </Pressable>

            <View style={styles.noteBox}>
              <Ionicons name="information-circle-outline" size={16} color={Colors.textMuted} />
              <Text style={styles.noteText}>
                All third-party providers are contractually bound to protect your data and may
                not use it for independent training or advertising purposes.
              </Text>
            </View>
          </ScrollView>

          {/* Consent toggle */}
          <View style={styles.consentRow}>
            <View style={styles.consentTextWrap}>
              <Text style={styles.consentLabel}>I consent to data sharing</Text>
              <Text style={styles.consentSub}>
                I understand my data will be processed by Vapi AI, OpenAI, and Twilio to
                provide voice agent services.
              </Text>
            </View>
            <Switch
              value={consentGiven}
              onValueChange={setConsentGiven}
              trackColor={{ false: Colors.bgElevated, true: Colors.electricMuted }}
              thumbColor={consentGiven ? Colors.electric : Colors.textMuted}
            />
          </View>

          {/* Buttons */}
          <View style={styles.buttons}>
            <Pressable
              style={[styles.btn, styles.btnAccept, !consentGiven && styles.btnDisabled]}
              onPress={consentGiven ? onAccept : undefined}
            >
              <Text style={[styles.btnText, styles.btnAcceptText, !consentGiven && styles.btnDisabledText]}>
                Accept & Continue
              </Text>
            </Pressable>
            <Pressable style={[styles.btn, styles.btnDecline]} onPress={onDecline}>
              <Text style={[styles.btnText, styles.btnDeclineText]}>Decline</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.bgCard,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
    borderWidth: 1,
    borderColor: Colors.border,
    borderBottomWidth: 0,
  },
  header: {
    alignItems: 'center',
    padding: Spacing['2xl'],
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderColor: Colors.border,
  },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: Colors.electricMuted,
    borderWidth: 1,
    borderColor: Colors.electricBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    ...Fonts.displayBold,
    fontSize: TypeScale.h2,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Fonts.body,
    fontSize: TypeScale.bodySm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: TypeScale.bodySm * 1.5,
  },
  scroll: { maxHeight: 340 },
  scrollContent: { padding: Spacing.xl, gap: Spacing.base },
  dataItem: {
    flexDirection: 'row',
    gap: Spacing.md,
    backgroundColor: Colors.bgElevated,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dataIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.electricMuted,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  dataInfo: { flex: 1, gap: 3 },
  dataTitle: {
    ...Fonts.bodySemibold,
    fontSize: TypeScale.bodySm,
    color: Colors.textPrimary,
  },
  dataDesc: {
    ...Fonts.body,
    fontSize: TypeScale.caption,
    color: Colors.textSecondary,
    lineHeight: TypeScale.caption * 1.5,
  },
  dataBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  dataBadgeText: {
    ...Fonts.mono,
    fontSize: 10,
    color: Colors.textMuted,
  },
  privacyLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    justifyContent: 'center',
    paddingVertical: Spacing.md,
  },
  privacyLinkText: {
    ...Fonts.bodyMedium,
    fontSize: TypeScale.bodySm,
    color: Colors.electric,
  },
  noteBox: {
    flexDirection: 'row',
    gap: Spacing.sm,
    backgroundColor: Colors.bgElevated,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  noteText: {
    ...Fonts.body,
    fontSize: TypeScale.caption,
    color: Colors.textMuted,
    flex: 1,
    lineHeight: TypeScale.caption * 1.5,
  },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderTopWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgElevated,
  },
  consentTextWrap: { flex: 1 },
  consentLabel: {
    ...Fonts.bodySemibold,
    fontSize: TypeScale.body,
    color: Colors.textPrimary,
  },
  consentSub: {
    ...Fonts.body,
    fontSize: TypeScale.caption,
    color: Colors.textSecondary,
    lineHeight: TypeScale.caption * 1.4,
    marginTop: 2,
  },
  buttons: {
    gap: Spacing.sm,
    padding: Spacing.xl,
    paddingTop: Spacing.md,
  },
  btn: {
    height: 50,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnAccept: {
    backgroundColor: Colors.electric,
  },
  btnDisabled: {
    backgroundColor: Colors.bgElevated,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  btnDecline: {
    backgroundColor: 'transparent',
  },
  btnText: {
    ...Fonts.bodySemibold,
    fontSize: TypeScale.body,
  },
  btnAcceptText: { color: '#fff' },
  btnDisabledText: { color: Colors.textMuted },
  btnDeclineText: { color: Colors.textMuted },
});
