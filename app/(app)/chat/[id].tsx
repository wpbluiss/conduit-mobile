import React from "react";
import { useLocalSearchParams } from "expo-router";
import { ChatShell } from "../../../components/praxis/chat/ChatShell";

export default function ChatThreadScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const id = params.id === "new" ? null : params.id;
  return <ChatShell conversationId={id} />;
}
