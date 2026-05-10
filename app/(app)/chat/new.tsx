import React, { useMemo } from "react";
import { useLocalSearchParams } from "expo-router";
import { ChatShell } from "../../../components/praxis/chat/ChatShell";
import { ErrorBoundary } from "../../../components/praxis/ErrorBoundary";
import {
  EMPLOYEES,
  type EmployeeId,
} from "../../../lib/conduit/employees";

export default function ChatNewScreen() {
  const params = useLocalSearchParams<{
    employee?: string;
    broadcast?: string;
    draft?: string;
  }>();

  const broadcast = params.broadcast === "true" || params.broadcast === "1";
  const employeeId = useMemo<EmployeeId | null>(() => {
    if (!params.employee || typeof params.employee !== "string") return null;
    const lower = params.employee.toLowerCase();
    return lower in EMPLOYEES ? (lower as EmployeeId) : null;
  }, [params.employee]);

  const initialDraft = useMemo<string | undefined>(() => {
    if (params.draft) return params.draft;
    if (employeeId) return `@${EMPLOYEES[employeeId].name} `;
    return undefined;
  }, [params.draft, employeeId]);

  return (
    <ErrorBoundary resetKey={`new-${employeeId ?? (broadcast ? "team" : "blank")}`}>
      <ChatShell
        conversationId={null}
        preferredEmployee={broadcast ? "team" : employeeId}
        initialDraft={initialDraft}
        autoFocus={!!(employeeId || broadcast)}
      />
    </ErrorBoundary>
  );
}
