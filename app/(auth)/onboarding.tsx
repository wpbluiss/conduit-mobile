import { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Animated,
  Dimensions,
  ScrollView,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../../components/ui/Button';
import { Colors } from '../../constants/colors';
import { Fonts, TypeScale, TextStyles } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/layout';

const { width } = Dimensions.get('window');
const TOTAL_STEPS = 4;

export default function OnboardingScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [step, setStep] = useState(0);
  const [greeting, setGreeting] = useState(
    `Hi, thanks for calling ${user?.user_metadata?.business_name || 'us'}! How can I help you today?`
  );

  const progressAnim = useRef(new Animated.Value(0)).current;

  const animateProgress = useCallback(
    (toStep: number) => {
      Animated.timing(progressAnim, {
        toValue: toStep,
        duration: 300,
        useNativeDriver: false,
      }).start();
    },
    [progressAnim]
  );

  const nextStep = () => {
    if (step < TOTAL_STEPS - 1) {
      const next = step + 1;
      setStep(next);
      animateProgress(next);
    }
  };

  const prevStep = () => {
    if (step > 0) {
      const prev = step - 1;
      setStep(prev);
      animateProgress(prev);
    }
  };

  const completeOnboarding = async () => {
    try {
      await supabase.auth.updateUser({
        data: {
          onboarding_complete: true,
          agent_greeting: greeting,
        },
      });
      router.replace('/(tabs)');
    } catch (err) {
      router.replace('/(tabs)');
    }
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, TOTAL_STEPS - 1],
    outputRange: ['0%', '100%'],
  });

  const assignedNumber = '(555) 012-3456';

  return (
    <View style={st.container}>
      {/* Progress Bar */}
      <View style={st.progressWrap}>
        <View style={st.progressTrack}>
          <Animated.View style={[st.progressFill, { width: progressWidth }]}>
            <LinearGradient
              colors={['#0EA5E9', '#06B6D4']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        </View>
        <Text style={st.progressLabel}>
          Step {step + 1} of {TOTAL_STEPS}
        </Text>
      </View>

      {/* Step Content */}
      <ScrollView
        style={st.scrollView}
        contentContainerStyle={st.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {step === 0 && <StepWelcome user={user} />}
        {step === 1 && (
          <StepAgent greeting={greeting} onGreetingChange={setGreeting} />
        )}
        {step === 2 && <StepForwarding assignedNumber={assignedNumber} />}
        {step === 3 && <StepComplete />}
      </ScrollView>

      {/* Navigation */}
      <View style={st.nav}>
        {step > 0 && step < TOTAL_STEPS - 1 && (
          <Button title="Back" onPress={prevStep} variant="ghost" size="lg" style={st.navBack} />
        )}
        {step < TOTAL_STEPS - 1 ? (
          <Button
            title={step === 0 ? "Let's Go" : 'Continue'}
            onPress={nextStep}
            fullWidth={step === 0}
            size="lg"
            style={step > 0 ? st.navNext : undefined}
          />
        ) : (
          <Button
            title="Go to Dashboard"
            onPress={completeOnboarding}
            fullWidth
            size="lg"
          />
        )}
      </View>
    </View>
  );
}

/* ─── Step 1: Welcome ─── */
function StepWelcome({ user }: { user: any }) {
  const name = user?.user_metadata?.owner_name?.split(' ')[0] || 'there';

  return (
    <View style={st.stepCenter}>
      <Image
        source={require('../../assets/images/icon.png')}
        style={st.heroIcon}
      />
      <Text style={st.heroTitle}>Welcome, {name}!</Text>
      <Text style={st.heroSubtitle}>
        Conduit AI is your intelligent call handling assistant. We'll answer your
        business calls, qualify leads, and book appointments — so you never miss
        an opportunity.
      </Text>
      <View style={st.featureList}>
        <FeatureItem icon="call" text="AI answers calls 24/7" />
        <FeatureItem icon="people" text="Qualifies & captures every lead" />
        <FeatureItem icon="calendar" text="Books appointments automatically" />
        <FeatureItem icon="analytics" text="Real-time analytics dashboard" />
      </View>
    </View>
  );
}

function FeatureItem({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={st.featureRow}>
      <View style={st.featureDot}>
        <Ionicons name={icon as any} size={18} color={Colors.electric} />
      </View>
      <Text style={st.featureText}>{text}</Text>
    </View>
  );
}

/* ─── Step 2: AI Agent Setup ─── */
function StepAgent({
  greeting,
  onGreetingChange,
}: {
  greeting: string;
  onGreetingChange: (text: string) => void;
}) {
  return (
    <View style={st.stepTop}>
      <View style={st.stepIconWrap}>
        <Ionicons name="chatbubble-ellipses" size={36} color={Colors.electric} />
      </View>
      <Text style={st.stepTitle}>Set up your AI Agent</Text>
      <Text style={st.stepDesc}>
        Customize the greeting your AI agent uses when answering calls. Make it
        sound natural and on-brand for your business.
      </Text>

      <View style={st.greetingWrap}>
        <Text style={st.greetingLabel}>Agent Greeting</Text>
        <View style={st.greetingInputWrap}>
          <TextInput
            style={st.greetingInput}
            value={greeting}
            onChangeText={onGreetingChange}
            multiline
            placeholderTextColor={Colors.textMuted}
            placeholder="Enter a greeting message..."
            selectionColor={Colors.electric}
            textAlignVertical="top"
          />
        </View>
        <Text style={st.greetingHint}>
          Tip: Keep it friendly and under 2 sentences for the best caller experience.
        </Text>
      </View>

      <View style={st.previewWrap}>
        <Text style={st.previewLabel}>Preview</Text>
        <View style={st.previewBubble}>
          <Ionicons name="volume-high" size={16} color={Colors.electric} style={{ marginRight: Spacing.sm }} />
          <Text style={st.previewText}>{greeting || 'Your greeting will appear here...'}</Text>
        </View>
      </View>
    </View>
  );
}

/* ─── Step 3: Call Forwarding ─── */
function StepForwarding({ assignedNumber }: { assignedNumber: string }) {
  return (
    <View style={st.stepTop}>
      <View style={st.stepIconWrap}>
        <Ionicons name="swap-horizontal" size={36} color={Colors.electric} />
      </View>
      <Text style={st.stepTitle}>Forward your calls</Text>
      <Text style={st.stepDesc}>
        Set up call forwarding so Conduit AI can answer when you're busy or
        after hours.
      </Text>

      <View style={st.numberCard}>
        <Text style={st.numberLabel}>Your Conduit number</Text>
        <Text style={st.numberValue}>{assignedNumber}</Text>
        <Text style={st.numberHint}>Forward your business line to this number</Text>
      </View>

      <View style={st.instructionsWrap}>
        <Text style={st.instructionsTitle}>How to set up forwarding</Text>

        <InstructionStep
          num="1"
          title="iPhone"
          desc='Go to Settings → Phone → Call Forwarding → Enter the number above'
        />
        <InstructionStep
          num="2"
          title="Android"
          desc="Go to Phone app → Settings → Call Forwarding → Forward to the number above"
        />
        <InstructionStep
          num="3"
          title="Business Line"
          desc="Contact your carrier to set up conditional forwarding (busy/no answer) to the number above"
        />
      </View>

      <View style={st.skipNote}>
        <Ionicons name="information-circle-outline" size={16} color={Colors.textMuted} />
        <Text style={st.skipNoteText}>
          You can set this up later from Settings. Tap Continue to proceed.
        </Text>
      </View>
    </View>
  );
}

function InstructionStep({
  num,
  title,
  desc,
}: {
  num: string;
  title: string;
  desc: string;
}) {
  return (
    <View style={st.instrRow}>
      <View style={st.instrNum}>
        <Text style={st.instrNumText}>{num}</Text>
      </View>
      <View style={st.instrContent}>
        <Text style={st.instrTitle}>{title}</Text>
        <Text style={st.instrDesc}>{desc}</Text>
      </View>
    </View>
  );
}

/* ─── Step 4: Complete ─── */
function StepComplete() {
  return (
    <View style={st.stepCenter}>
      <View style={st.successIcon}>
        <Ionicons name="checkmark-circle" size={64} color={Colors.success} />
      </View>
      <Text style={st.heroTitle}>You're all set!</Text>
      <Text style={st.heroSubtitle}>
        Your AI agent is ready to start handling calls. You'll see leads,
        transcripts, and analytics in your dashboard as calls come in.
      </Text>
      <View style={st.successFeatures}>
        <View style={st.successRow}>
          <Ionicons name="checkmark" size={20} color={Colors.success} />
          <Text style={st.successText}>AI Agent configured</Text>
        </View>
        <View style={st.successRow}>
          <Ionicons name="checkmark" size={20} color={Colors.success} />
          <Text style={st.successText}>Dashboard ready</Text>
        </View>
        <View style={st.successRow}>
          <Ionicons name="checkmark" size={20} color={Colors.success} />
          <Text style={st.successText}>14-day free trial active</Text>
        </View>
      </View>
    </View>
  );
}

/* ─── Styles ─── */
const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgVoid },

  /* Progress */
  progressWrap: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing['3xl'] + Spacing.lg,
    paddingBottom: Spacing.base,
  },
  progressTrack: {
    height: 4,
    backgroundColor: Colors.bgElevated,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 2 },
  progressLabel: {
    ...Fonts.body,
    fontSize: TypeScale.caption,
    color: Colors.textMuted,
    marginTop: Spacing.sm,
    textAlign: 'right',
  },

  /* Scroll / Content */
  scrollView: { flex: 1 },
  content: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing['3xl'],
    flexGrow: 1,
  },

  /* Navigation */
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing['2xl'],
    paddingTop: Spacing.base,
    gap: Spacing.md,
  },
  navBack: { flex: 0.4 },
  navNext: { flex: 1 },

  /* Step layouts */
  stepCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.xl },
  stepTop: { flex: 1, paddingTop: Spacing.base },

  /* Hero icon (Welcome) */
  heroIcon: {
    width: 96,
    height: 96,
    borderRadius: 32,
    backgroundColor: Colors.electricMuted,
    borderWidth: 1,
    borderColor: Colors.electricBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  heroTitle: {
    ...TextStyles.h1,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  heroSubtitle: {
    ...Fonts.body,
    fontSize: TypeScale.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: TypeScale.body * 1.6,
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing['2xl'],
  },

  /* Feature list (Welcome) */
  featureList: { gap: Spacing.base, width: '100%' },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  featureDot: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.electricMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    ...Fonts.bodyMedium,
    fontSize: TypeScale.body,
    color: Colors.textPrimary,
  },

  /* Step header (shared) */
  stepIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: Colors.electricMuted,
    borderWidth: 1,
    borderColor: Colors.electricBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  stepTitle: {
    ...TextStyles.h2,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  stepDesc: {
    ...Fonts.body,
    fontSize: TypeScale.body,
    color: Colors.textSecondary,
    lineHeight: TypeScale.body * 1.6,
    marginBottom: Spacing.xl,
  },

  /* Agent greeting (Step 2) */
  greetingWrap: { marginBottom: Spacing.xl },
  greetingLabel: {
    ...Fonts.bodyMedium,
    fontSize: TypeScale.bodySm,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    marginLeft: 2,
  },
  greetingInputWrap: {
    backgroundColor: Colors.bgInput,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.base,
    minHeight: 100,
  },
  greetingInput: {
    ...Fonts.body,
    fontSize: TypeScale.body,
    color: Colors.textPrimary,
    lineHeight: TypeScale.body * 1.6,
    minHeight: 70,
  },
  greetingHint: {
    ...Fonts.body,
    fontSize: TypeScale.caption,
    color: Colors.textMuted,
    marginTop: Spacing.sm,
    marginLeft: 2,
  },

  /* Preview bubble */
  previewWrap: {},
  previewLabel: {
    ...Fonts.bodyMedium,
    fontSize: TypeScale.bodySm,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    marginLeft: 2,
  },
  previewBubble: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.electricBorder,
    padding: Spacing.base,
  },
  previewText: {
    ...Fonts.body,
    fontSize: TypeScale.bodySm,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: TypeScale.bodySm * 1.5,
  },

  /* Number card (Step 3) */
  numberCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.electricBorder,
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  numberLabel: {
    ...Fonts.body,
    fontSize: TypeScale.caption,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.sm,
  },
  numberValue: {
    ...Fonts.monoBold,
    fontSize: TypeScale.h1,
    color: Colors.electric,
    letterSpacing: 1,
  },
  numberHint: {
    ...Fonts.body,
    fontSize: TypeScale.caption,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },

  /* Instructions */
  instructionsWrap: { gap: Spacing.base, marginBottom: Spacing.xl },
  instructionsTitle: {
    ...Fonts.bodySemibold,
    fontSize: TypeScale.body,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  instrRow: { flexDirection: 'row', gap: Spacing.md },
  instrNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.electricMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  instrNumText: {
    ...Fonts.bodySemibold,
    fontSize: TypeScale.bodySm,
    color: Colors.electric,
  },
  instrContent: { flex: 1 },
  instrTitle: {
    ...Fonts.bodySemibold,
    fontSize: TypeScale.body,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  instrDesc: {
    ...Fonts.body,
    fontSize: TypeScale.bodySm,
    color: Colors.textSecondary,
    lineHeight: TypeScale.bodySm * 1.5,
  },

  /* Skip note */
  skipNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  skipNoteText: {
    ...Fonts.body,
    fontSize: TypeScale.caption,
    color: Colors.textMuted,
    flex: 1,
    lineHeight: TypeScale.caption * 1.5,
  },

  /* Success (Step 4) */
  successIcon: { marginBottom: Spacing.xl },
  successFeatures: {
    gap: Spacing.base,
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.xl,
    width: '100%',
  },
  successRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  successText: {
    ...Fonts.bodyMedium,
    fontSize: TypeScale.body,
    color: Colors.textPrimary,
  },
});
