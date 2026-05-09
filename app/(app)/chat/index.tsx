import React from "react";
import { ChatCircleText } from "phosphor-react-native";
import { PlaceholderScreen } from "../../../components/praxis";
import { usePraxisTheme } from "../../../contexts/PraxisThemeContext";

export default function ChatIndexScreen() {
  const t = usePraxisTheme();
  return (
    <PlaceholderScreen
      eyebrow="CHAT"
      title="Conversations"
      body="Threads with Atlas and your team will surface here."
      icon={<ChatCircleText size={28} color={t.colors.indigo500} weight="fill" />}
    />
  );
}
