import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { usePraxisTheme } from "../../../contexts/PraxisThemeContext";
import { ChatShell } from "../../../components/praxis/chat/ChatShell";
import { getMostRecentConversation } from "../../../lib/conduit/conversations";

export default function ChatActiveScreen() {
  const t = usePraxisTheme();
  const router = useRouter();
  const [resolved, setResolved] = useState<{ id: string | null } | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const recent = await getMostRecentConversation();
      if (!alive) return;
      if (recent) {
        // Within last 24h, jump straight into the thread.
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

  return <ChatShell conversationId={resolved.id} />;
}
