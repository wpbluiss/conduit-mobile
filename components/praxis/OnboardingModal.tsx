import React, { useState } from "react";
import {
  Modal,
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
} from "react-native";
import { usePraxisTheme } from "../../contexts/PraxisThemeContext";
import { Text } from "./Text";
import { Button } from "./Button";
import { Input } from "./Input";
import { dismissOnboarding, completeOnboarding } from "../../lib/conduit/onboarding";

interface Props {
  visible: boolean;
  workspaceName: string;
  onDone: () => void;
}

const TOTAL_STEPS = 4;

export function OnboardingModal({ visible, workspaceName, onDone }: Props) {
  const t = usePraxisTheme();
  const [step, setStep] = useState(0);
  const [name, setName] = useState(workspaceName);
  const [businessType, setBusinessType] = useState("");
  const [businessDescription, setBusinessDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isLastStep = step === TOTAL_STEPS - 1;
  const canSkip = step < TOTAL_STEPS - 1 && !submitting;

  const handleSkip = async () => {
    await dismissOnboarding();
    onDone();
  };

  const handleNext = () => {
    if (step < TOTAL_STEPS - 1) setStep((s) => s + 1);
  };

  const handleBack = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await completeOnboarding({
        name,
        businessType,
        businessDescription,
      });
    } finally {
      setSubmitting(false);
      onDone();
    }
  };

  const nextDisabled = (() => {
    if (step === 0) return !name.trim();
    if (step === 1) return !businessType.trim();
    if (step === 2) return !businessDescription.trim();
    return false;
  })();

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent>
      <View
        style={{
          flex: 1,
          justifyContent: "flex-end",
          backgroundColor: "rgba(0,0,0,0.5)",
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 0 }}
        >
          <View
            style={{
              backgroundColor: t.colors.bgCanvas,
              borderTopLeftRadius: t.radii.xl,
              borderTopRightRadius: t.radii.xl,
              paddingTop: 8,
              paddingBottom: Platform.OS === "ios" ? 40 : 24,
              maxHeight: "85%",
            }}
          >
            {/* Drag handle */}
            <View style={{ alignItems: "center", marginBottom: 16 }}>
              <View
                style={{
                  width: 36,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: t.colors.borderDefault,
                }}
              />
            </View>

            {/* Progress dots */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "center",
                gap: 6,
                marginBottom: 24,
              }}
            >
              {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                <View
                  key={i}
                  style={{
                    width: i === step ? 20 : 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor:
                      i <= step ? t.colors.indigo500 : t.colors.borderSubtle,
                  }}
                />
              ))}
            </View>

            <ScrollView
              contentContainerStyle={{
                paddingHorizontal: t.layout.screenPaddingX,
                paddingBottom: 8,
                gap: 20,
              }}
              keyboardShouldPersistTaps="handled"
            >
              <StepContent
                step={step}
                name={name}
                businessType={businessType}
                businessDescription={businessDescription}
                onChangeName={setName}
                onChangeBusinessType={setBusinessType}
                onChangeBusinessDescription={setBusinessDescription}
              />

              {/* Actions */}
              <View style={{ gap: 10, marginTop: 8 }}>
                {isLastStep ? (
                  <Button
                    label="Let's go"
                    variant="primary"
                    size="lg"
                    fullWidth
                    loading={submitting}
                    onPress={handleSubmit}
                  />
                ) : (
                  <Button
                    label="Continue"
                    variant="primary"
                    size="lg"
                    fullWidth
                    disabled={nextDisabled}
                    onPress={handleNext}
                  />
                )}

                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  {step > 0 ? (
                    <Pressable onPress={handleBack} hitSlop={8}>
                      <Text variant="bodySm" tone="tertiary">
                        Back
                      </Text>
                    </Pressable>
                  ) : (
                    <View />
                  )}

                  {canSkip ? (
                    <Pressable onPress={handleSkip} hitSlop={8}>
                      <Text variant="bodySm" tone="tertiary">
                        Skip for now
                      </Text>
                    </Pressable>
                  ) : (
                    <View />
                  )}
                </View>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

interface StepContentProps {
  step: number;
  name: string;
  businessType: string;
  businessDescription: string;
  onChangeName: (v: string) => void;
  onChangeBusinessType: (v: string) => void;
  onChangeBusinessDescription: (v: string) => void;
}

function StepContent({
  step,
  name,
  businessType,
  businessDescription,
  onChangeName,
  onChangeBusinessType,
  onChangeBusinessDescription,
}: StepContentProps) {
  const t = usePraxisTheme();

  if (step === 0) {
    return (
      <View style={{ gap: 12 }}>
        <View>
          <Text variant="caption" tone="indigo" weight="semibold">
            STEP 1 OF 4
          </Text>
          <Text variant="displayMd" family="display" weight="semibold">
            Name your workspace.
          </Text>
          <Text variant="body" tone="secondary" style={{ marginTop: 6 }}>
            This is how your team and Atlas will refer to your company.
          </Text>
        </View>
        <Input
          label="Workspace name"
          placeholder="e.g. Acme Corp"
          value={name}
          onChangeText={onChangeName}
          autoCapitalize="words"
          autoCorrect={false}
          returnKeyType="next"
        />
      </View>
    );
  }

  if (step === 1) {
    return (
      <View style={{ gap: 12 }}>
        <View>
          <Text variant="caption" tone="indigo" weight="semibold">
            STEP 2 OF 4
          </Text>
          <Text variant="displayMd" family="display" weight="semibold">
            What kind of business?
          </Text>
          <Text variant="body" tone="secondary" style={{ marginTop: 6 }}>
            A short label helps Atlas give you more relevant advice.
          </Text>
        </View>
        <Input
          label="Business type"
          placeholder="e.g. SaaS startup, e-commerce, agency"
          value={businessType}
          onChangeText={onChangeBusinessType}
          autoCapitalize="sentences"
          returnKeyType="next"
        />
      </View>
    );
  }

  if (step === 2) {
    return (
      <View style={{ gap: 12 }}>
        <View>
          <Text variant="caption" tone="indigo" weight="semibold">
            STEP 3 OF 4
          </Text>
          <Text variant="displayMd" family="display" weight="semibold">
            Describe your business.
          </Text>
          <Text variant="body" tone="secondary" style={{ marginTop: 6 }}>
            One or two sentences — Atlas will use this as context in every conversation.
          </Text>
        </View>
        <Input
          label="Business description"
          placeholder="We help small teams automate their admin workflows…"
          value={businessDescription}
          onChangeText={onChangeBusinessDescription}
          multiline
          numberOfLines={3}
          autoCapitalize="sentences"
        />
      </View>
    );
  }

  return (
    <View style={{ gap: 12 }}>
      <View>
        <Text variant="caption" tone="indigo" weight="semibold">
          STEP 4 OF 4
        </Text>
        <Text variant="displayMd" family="display" weight="semibold">
          Atlas is ready.
        </Text>
        <Text variant="body" tone="secondary" style={{ marginTop: 6 }}>
          Your workspace is set up. Ask Atlas anything — it already knows your business context.
        </Text>
      </View>
      <View
        style={{
          padding: 16,
          borderRadius: t.radii.md,
          backgroundColor: t.colors.indigoSoft,
          borderWidth: 1,
          borderColor: t.colors.indigo500,
          gap: 4,
        }}
      >
        <Text variant="bodySm" weight="semibold" tone="indigo">
          {name || "Your workspace"}
        </Text>
        <Text variant="bodySm" tone="secondary">
          {businessType} · {businessDescription}
        </Text>
      </View>
    </View>
  );
}
