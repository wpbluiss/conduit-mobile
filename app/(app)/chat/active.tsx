import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { usePraxisTheme } from "../../../contexts/PraxisThemeContext";
import { ChatShell } from "../../../components/praxis/chat/ChatShell";
import { getMostRecentConversation } from "../../../lib/conduit/conversations";
import { getOrCreateAccount } from "../../../lib/conduit/account";
import { needsOnboarding } from "../../../lib/conduit/onboarding";
import { OnboardingModal } from "../../../components/praxis/OnboardingModal";

export default function ChatActiveScreen() {
  const t = usePraxisTheme();
  const router = useRouter();
  const [resolved, setResolved] = useState<{ id: string | null } | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [workspaceName, setWorkspaceName] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      const [recent, onboarding, account] = await Promise.all([
        getMostRecentConversation(),
        needsOnboarding(),
        getOrCreateAccount(),
      ]);
      if (!alive) return;

      if (onboarding) {
        setWorkspaceName(account?.name ?? "");
        setShowOnboarding(true);
      }

      if (recent) {
        const updated = new Date(recent.updated_at).getTime();
        const now = Date.now();
        if (now - updated < 24 * 60 * 60 * 1000) {
          router.replace(`/(app)/chat/${recent.id}` as never);
          return;
        }
      }
      setResolved({ id: null });
    })();
    return () => {
      alive = false;
    };
  }, [router]);

  if (!resolved) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: t.colors.bgCanvas,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator color={t.colors.indigo500} />
      </View>
    );
  }

  return (
    <>
      <ChatShell conversationId={resolved.id} />
      <OnboardingModal
        visible={showOnboarding}
        workspaceName={workspaceName}
        onDone={() => setShowOnboarding(false)}
      />
    </>
  );
}
