import React, { useState } from "react";
import {
  Modal,
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
  StyleSheet,
} from "react-native";
import { usePraxisTheme } from "../../contexts/PraxisThemeContext";
import { Text } from "./Text";
import { Button } from "./Button";
import { Input } from "./Input";
import { PraxisLogo } from "./PraxisLogo";
import { updateAccountOnboarding } from "../../lib/conduit/account";

type Step = "business_type" | "business_description" | "done";

const STEPS: Step[] = ["business_type", "business_description", "done"];

interface Props {
  visible: boolean;
  onSkip: () => void;
  onComplete: () => void;
}

export function OnboardingModal({ visible, onSkip, onComplete }: Props) {
  const t = usePraxisTheme();
  const [stepIndex, setStepIndex] = useState(0);
  const [businessType, setBusinessType] = useState("");
  const [businessDescription, setBusinessDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const step = STEPS[stepIndex];
  const isLastDataStep = step === "business_description";
  const isDone = step === "done";

  const handleNext = async () => {
    setError(null);
    if (step === "business_type") {
      if (!businessType.trim()) {
        setError("Please enter your business type.");
        return;
      }
      setStepIndex(1);
      return;
    }
    if (step === "business_description") {
      if (!businessDescription.trim()) {
        setError("Please enter a brief description.");
        return;
      }
      setSubmitting(true);
      const result = await updateAccountOnboarding({
        business_type: businessType.trim(),
        business_description: businessDescription.trim(),
      });
      setSubmitting(false);
      if (!result.ok) {
        setError(result.error ?? "Could not save your info. Please try again.");
        return;
      }
      setStepIndex(2);
      return;
    }
    if (step === "done") {
      onComplete();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View
        style={[StyleSheet.absoluteFill, { backgroundColor: t.colors.scrim }]}
      />
      <KeyboardAvoidingView
        style={{ flex: 1, justifyContent: "flex-end" }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View
          style={{
            backgroundColor: t.colors.bgSurface,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingHorizontal: 24,
            paddingTop: 28,
            paddingBottom: 40,
            maxHeight: "85%",
          }}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                marginBottom: 20,
              }}
            >
              <PraxisLogo size={24} />
              <Text variant="caption" tone="indigo" weight="semibold">
                {isDone
                  ? "ALL SET"
                  : `STEP ${stepIndex + 1} OF ${STEPS.length - 1}`}
              </Text>
            </View>

            {step === "business_type" && (
              <StepBusinessType
                value={businessType}
                onChange={setBusinessType}
                error={error}
              />
            )}

            {step === "business_description" && (
              <StepBusinessDescription
                value={businessDescription}
                onChange={setBusinessDescription}
                error={error}
              />
            )}

            {step === "done" && <StepDone />}

            <View style={{ marginTop: 24, gap: 12 }}>
              <Button
                label={
                  isDone
                    ? "Go to workspace"
                    : isLastDataStep
                      ? submitting
                        ? "Saving…"
                        : "Save & continue"
                      : "Continue"
                }
                variant="primary"
                size="lg"
                fullWidth
                loading={submitting}
                onPress={handleNext}
              />

              {!isDone && (
                <Pressable
                  onPress={onSkip}
                  hitSlop={12}
                  style={{ alignItems: "center", paddingVertical: 8 }}
                  accessibilityRole="button"
                  accessibilityLabel="Skip onboarding for now"
                >
                  <Text variant="bodySm" tone="tertiary">
                    Skip for now
                  </Text>
                </Pressable>
              )}
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function StepBusinessType({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  error: string | null;
}) {
  return (
    <View style={{ gap: 16 }}>
      <View>
        <Text variant="displaySm" family="display" weight="semibold">
          What kind of business is this?
        </Text>
        <Text variant="body" tone="secondary" style={{ marginTop: 8 }}>
          Your AI employees tailor every response to your industry.
        </Text>
      </View>
      <Input
        label="Business type"
        placeholder="e.g. SaaS startup, law firm, marketing agency"
        value={value}
        onChangeText={onChange}
        autoCapitalize="sentences"
        autoFocus
        error={error}
      />
    </View>
  );
}

function StepBusinessDescription({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  error: string | null;
}) {
  return (
    <View style={{ gap: 16 }}>
      <View>
        <Text variant="displaySm" family="display" weight="semibold">
          Describe your business in a sentence.
        </Text>
        <Text variant="body" tone="secondary" style={{ marginTop: 8 }}>
          Atlas and your team will use this as context for every task.
        </Text>
      </View>
      <Input
        label="Business description"
        placeholder="e.g. We build B2B analytics tools for retail brands."
        value={value}
        onChangeText={onChange}
        autoCapitalize="sentences"
        multiline
        numberOfLines={3}
        autoFocus
        error={error}
      />
    </View>
  );
}

function StepDone() {
  return (
    <View style={{ gap: 16 }}>
      <Text variant="displaySm" family="display" weight="semibold">
        You're all set.
      </Text>
      <Text variant="body" tone="secondary">
        Atlas has been briefed on your business. Your nine AI employees are
        ready — ask them anything.
      </Text>
    </View>
  );
}
