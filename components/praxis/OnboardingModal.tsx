import React, { useEffect, useRef, useState } from "react";
import {
  Modal,
  View,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Check, X } from "phosphor-react-native";
import { supabase } from "../../lib/supabase";
import { getOrCreateAccount, clearAccountCache } from "../../lib/conduit/account";
import { usePraxisTheme } from "../../contexts/PraxisThemeContext";
import { Text } from "./Text";
import { Button } from "./Button";
import { Input } from "./Input";
import { PraxisLogo } from "./PraxisLogo";

const STORAGE_KEY = "onboarding_dismissed";

const BUSINESS_TYPES = [
  "SaaS / Software",
  "Agency / Consulting",
  "E-commerce / Retail",
  "Professional Services",
  "Healthcare / Wellness",
  "Finance / FinTech",
  "Media / Content",
  "Other",
];

export function useOnboardingGate() {
  const [show, setShow] = useState(false);
  const checked = useRef(false);

  useEffect(() => {
    if (checked.current) return;
    checked.current = true;

    (async () => {
      try {
        const dismissed = await AsyncStorage.getItem(STORAGE_KEY);
        if (dismissed === "true") return;

        const account = await getOrCreateAccount();
        if (!account) return;

        // Server-side completion gate: both fields set means onboarding done
        if (account.business_type && account.business_description) return;

        setShow(true);
      } catch {
        // Fail open — never block the app on storage/network errors
      }
    })();
  }, []);

  return { show, setShow };
}

interface OnboardingModalProps {
  visible: boolean;
  onDismiss: () => void;
}

export function OnboardingModal({ visible, onDismiss }: OnboardingModalProps) {
  const t = usePraxisTheme();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(1);
  const [workspaceName, setWorkspaceName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [businessDescription, setBusinessDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dismiss = async (skipFlag = true) => {
    if (skipFlag) {
      try {
        await AsyncStorage.setItem(STORAGE_KEY, "true");
      } catch {
        // ignore storage errors
      }
    }
    onDismiss();
  };

  const handleSkip = () => dismiss(true);

  const handleNext = () => {
    setError(null);
    if (step === 1) {
      if (!workspaceName.trim()) {
        setError("Please enter a workspace name.");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!businessType) {
        setError("Please select a business type.");
        return;
      }
      setStep(3);
    } else if (step === 3) {
      if (!businessDescription.trim()) {
        setError("Please describe your business.");
        return;
      }
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const account = await getOrCreateAccount();
      if (!account) throw new Error("Account not found");

      const { error: updateErr } = await supabase
        .from("conduit_accounts")
        .update({
          name: workspaceName.trim(),
          business_type: businessType,
          business_description: businessDescription.trim(),
        })
        .eq("id", account.id);

      if (updateErr) throw new Error(updateErr.message);

      clearAccountCache();
      setStep(4);
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinish = () => dismiss(false);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleSkip}
    >
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: t.colors.bgCanvas }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View
          style={{
            paddingTop: insets.top + 16,
            paddingHorizontal: 20,
            paddingBottom: 12,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <StepDots total={4} current={step} />
          {step < 4 ? (
            <Pressable
              onPress={handleSkip}
              hitSlop={10}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                opacity: pressed ? 0.5 : 1,
              })}
            >
              <X size={14} color={t.colors.inkTertiary} />
              <Text variant="bodySm" tone="tertiary">
                Skip for now
              </Text>
            </Pressable>
          ) : null}
        </View>

        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 20,
            paddingBottom: Math.max(insets.bottom, 24) + 16,
          }}
          keyboardShouldPersistTaps="handled"
        >
          {step === 1 && (
            <StepContent
              eyebrow="STEP 1 OF 3"
              heading="Name your workspace."
              body="This is how Praxis will refer to your company. You can change it later in Account Settings."
            >
              <Input
                label="Workspace name"
                placeholder="Acme Inc."
                autoCapitalize="words"
                autoCorrect={false}
                value={workspaceName}
                onChangeText={setWorkspaceName}
                error={error}
              />
            </StepContent>
          )}

          {step === 2 && (
            <StepContent
              eyebrow="STEP 2 OF 3"
              heading="What kind of business?"
              body="Praxis tailors its employees to your industry."
            >
              <View style={{ gap: 8 }}>
                {BUSINESS_TYPES.map((type) => {
                  const selected = businessType === type;
                  return (
                    <Pressable
                      key={type}
                      onPress={() => setBusinessType(type)}
                      style={({ pressed }) => ({
                        flexDirection: "row",
                        alignItems: "center",
                        padding: 14,
                        borderRadius: t.radii.md,
                        backgroundColor: pressed ? t.colors.bgElevated : t.colors.bgSurface,
                        borderWidth: selected ? 1.5 : 1,
                        borderColor: selected ? t.colors.indigo500 : t.colors.borderSubtle,
                      })}
                    >
                      <Text
                        variant="body"
                        weight={selected ? "semibold" : "regular"}
                        style={{ flex: 1, color: selected ? t.colors.indigo500 : t.colors.inkPrimary }}
                      >
                        {type}
                      </Text>
                      {selected ? (
                        <Check size={18} color={t.colors.indigo500} weight="bold" />
                      ) : null}
                    </Pressable>
                  );
                })}
                {error ? (
                  <Text variant="bodySm" tone="danger" style={{ marginTop: 4 }}>
                    {error}
                  </Text>
                ) : null}
              </View>
            </StepContent>
          )}

          {step === 3 && (
            <StepContent
              eyebrow="STEP 3 OF 3"
              heading="Describe what you do."
              body="A sentence or two is plenty. Your employees will use this to personalise every response."
            >
              <Input
                label="About your business"
                placeholder="We build SaaS tools for independent financial advisors…"
                multiline
                numberOfLines={4}
                autoCapitalize="sentences"
                value={businessDescription}
                onChangeText={setBusinessDescription}
                error={error}
              />
            </StepContent>
          )}

          {step === 4 && (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 48 }}>
              {submitting ? (
                <ActivityIndicator size="large" color={t.colors.indigo500} />
              ) : (
                <>
                  <View style={{ marginBottom: 24 }}>
                    <PraxisLogo size={56} />
                  </View>
                  <Text variant="displayLg" family="display" weight="semibold" align="center">
                    You're all set.
                  </Text>
                  <Text
                    variant="body"
                    tone="secondary"
                    align="center"
                    style={{ marginTop: 10, lineHeight: 22 }}
                  >
                    Atlas and your team are seeding your workspace. They'll be ready momentarily.
                  </Text>
                  {done ? (
                    <Button
                      label="Open workspace"
                      variant="primary"
                      size="lg"
                      style={{ marginTop: 32 }}
                      onPress={handleFinish}
                    />
                  ) : null}
                </>
              )}
            </View>
          )}

          <View style={{ flex: 1 }} />

          {step < 4 ? (
            <View style={{ gap: 12, marginTop: 24 }}>
              <Button
                label={step === 3 ? (submitting ? "Setting up…" : "Complete setup") : "Next"}
                variant="primary"
                size="lg"
                fullWidth
                loading={submitting}
                disabled={submitting}
                onPress={handleNext}
              />
              <Button
                label="Skip for now"
                variant="ghost"
                size="lg"
                fullWidth
                onPress={handleSkip}
                hapticOnPress={false}
              />
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function StepContent({
  eyebrow,
  heading,
  body,
  children,
}: {
  eyebrow: string;
  heading: string;
  body: string;
  children: React.ReactNode;
}) {
  return (
    <View style={{ gap: 20 }}>
      <View style={{ marginBottom: 4 }}>
        <Text variant="caption" tone="indigo" weight="semibold" style={{ marginBottom: 4 }}>
          {eyebrow}
        </Text>
        <Text variant="displayLg" family="display" weight="semibold" style={{ lineHeight: 34 }}>
          {heading}
        </Text>
        <Text variant="body" tone="secondary" style={{ marginTop: 6, lineHeight: 22 }}>
          {body}
        </Text>
      </View>
      {children}
    </View>
  );
}

function StepDots({ total, current }: { total: number; current: number }) {
  const t = usePraxisTheme();
  return (
    <View style={{ flexDirection: "row", gap: 6 }}>
      {Array.from({ length: total }).map((_, i) => {
        const active = i + 1 === current;
        const done = i + 1 < current;
        return (
          <View
            key={i}
            style={{
              width: active ? 20 : 8,
              height: 8,
              borderRadius: 4,
              backgroundColor:
                active || done ? t.colors.indigo500 : t.colors.borderSubtle,
            }}
          />
        );
      })}
    </View>
  );
}
