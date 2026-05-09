import React from "react";
import { Microphone } from "phosphor-react-native";
import { PlaceholderScreen } from "../../components/praxis";
import { usePraxisTheme } from "../../contexts/PraxisThemeContext";

export default function VoiceScreen() {
  const t = usePraxisTheme();
  return (
    <PlaceholderScreen
      eyebrow="VOICE"
      title="Voice mode"
      body="Hold to talk to Atlas. Captions render live."
      icon={<Microphone size={28} color={t.colors.indigo500} weight="fill" />}
    />
  );
}
