import React, { useMemo } from "react";
import { useLocalSearchParams } from "expo-router";
import { ChatShell } from "../../../components/praxis/chat/ChatShell";
import { ErrorBoundary } from "../../../components/praxis/ErrorBoundary";
import {
  EMPLOYEES,
  type EmployeeId,
} from "../../../lib/conduit/employees";

export default function ChatThreadScreen() {
  const params = useLocalSearchParams<{
    id: string;
    employee?: string;
    broadcast?: string;
    draft?: string;
  }>();
  const id = params.id === "new" ? null : params.id;
  const broadcast = params.broadcast === "true" || params.broadcast === "1";

  const employeeId = useMemo<EmployeeId | null>(() => {
    if (!params.employee || typeof params.employee !== "string") return null;
    const lower = params.employee.toLowerCase();
    return lower in EMPLOYEES ? (lower as EmployeeId) : null;
  }, [params.employee]);

  return (
    <ErrorBoundary resetKey={id ?? "new"}>
      <ChatShell
        conversationId={id ?? null}
        preferredEmployee={broadcast ? "team" : employeeId}
        initialDraft={params.draft}
      />
    </ErrorBoundary>
  );
}
