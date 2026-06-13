import React, { useMemo } from "react";
import { View } from "react-native";
import { usePraxisTheme } from "../../../contexts/PraxisThemeContext";
import { Text } from "../Text";
import { EmployeeAvatar } from "../EmployeeAvatar";
import { CodeBlock } from "./CodeBlock";
import { getEmployee, type EmployeeId } from "../../../lib/conduit/employees";

export interface MessageBubbleProps {
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  employee?: EmployeeId | "team" | null;
  pending?: boolean;
  /** Dept/employee accent color — user bubbles use it as bg; assistant gets a left border tint. */
  accentColor?: string;
  /** When false, suppress the employee name label and avatar (for consecutive same-sender messages). */
  showHeader?: boolean;
}

type Segment =
  | { type: "text"; text: string }
  | { type: "code"; lang: string; code: string };

function segmentMarkdown(input: unknown): Segment[] {
  // Defensive: legacy rows may have non-string content even after
  // normalization slips. Render gracefully instead of crashing on .slice().
  const text = typeof input === "string" ? input : input == null ? "" : String(input);
  if (!text) return [];

  const segments: Segment[] = [];
  const fence = /```(\w*)\n?([\s\S]*?)```/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = fence.exec(text))) {
    if (m.index > last) {
      segments.push({ type: "text", text: text.slice(last, m.index) });
    }
    segments.push({ type: "code", lang: m[1] ?? "", code: (m[2] ?? "").trimEnd() });
    last = m.index + m[0].length;
  }
  if (last < text.length) {
    segments.push({ type: "text", text: text.slice(last) });
  }
  return segments;
}

export function MessageBubble({
  role,
  content,
  employee,
  pending,
  accentColor,
  showHeader = true,
}: MessageBubbleProps) {
  const t = usePraxisTheme();
  const safeRole: MessageBubbleProps["role"] =
    role === "user" || role === "assistant" || role === "system" || role === "tool"
      ? role
      : "assistant";
  const isUser = safeRole === "user";
  const employeeCfg = !isUser ? getEmployee(employee ?? null) : null;

  const segments = useMemo(() => segmentMarkdown(content), [content]);

  // Effective bubble background: user bubbles use the dept accent (or indigo fallback);
  // assistant bubbles stay neutral with a subtle left accent stroke.
  const userBg = accentColor ?? t.colors.indigo500;

  if (safeRole === "tool" || safeRole === "system") {
    return (
      <View style={{ paddingHorizontal: 16, paddingVertical: 6 }}>
        <Text variant="caption" tone="tertiary" align="center">
          {typeof content === "string" ? content : ""}
        </Text>
      </View>
    );
  }

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-start",
        paddingHorizontal: 16,
        // Tighten vertical gap when header is suppressed (consecutive sender)
        paddingVertical: showHeader ? 8 : 3,
        gap: 10,
        justifyContent: isUser ? "flex-end" : "flex-start",
      }}
    >
      {!isUser ? (
        // Reserve space even when hidden so bubbles stay left-aligned
        <View style={{ width: 32, alignItems: "center" }}>
          {showHeader ? (
            <EmployeeAvatar employee={(employee ?? "atlas") as EmployeeId | "team"} size="sm" />
          ) : null}
        </View>
      ) : null}

      <View
        style={{
          maxWidth: "78%",
          borderRadius: t.radii.lg,
          paddingHorizontal: 14,
          paddingVertical: 10,
          backgroundColor: isUser ? userBg : t.colors.bgSurface,
          borderWidth: isUser ? 0 : 1,
          borderColor: isUser ? "transparent" : t.colors.borderSubtle,
          // Subtle dept-tinted left accent on assistant bubbles
          borderLeftWidth: !isUser && accentColor ? 3 : isUser ? 0 : 1,
          borderLeftColor: !isUser && accentColor ? accentColor : isUser ? "transparent" : t.colors.borderSubtle,
        }}
      >
        {!isUser && employeeCfg && showHeader ? (
          <Text
            variant="caption"
            weight="semibold"
            style={{
              color: employeeCfg.ringColor,
              marginBottom: 4,
              letterSpacing: 0.6,
            }}
          >
            {employeeCfg.name.toUpperCase()}
          </Text>
        ) : null}

        {segments.length === 0 || (segments.length === 1 && segments[0].type === "text" && !segments[0].text) ? (
          pending ? (
            <Text
              family="body"
              variant="body"
              style={{ color: isUser ? "#FFFFFF" : t.colors.inkPrimary, opacity: 0.5 }}
            >
              …
            </Text>
          ) : null
        ) : (
          segments.map((seg, i) =>
            seg.type === "text" ? (
              <Text
                key={i}
                family="body"
                variant="body"
                style={{ color: isUser ? "#FFFFFF" : t.colors.inkPrimary }}
              >
                {seg.text}
              </Text>
            ) : (
              <CodeBlock key={i} code={seg.code} language={seg.lang || undefined} />
            ),
          )
        )}
      </View>
    </View>
  );
}
