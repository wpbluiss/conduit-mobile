import React, { useMemo } from "react";
import { Pressable, View } from "react-native";
import { format, isToday, isYesterday } from "date-fns";
import { usePraxisTheme } from "../../../contexts/PraxisThemeContext";
import { Text } from "../Text";
import { EmployeeAvatar } from "../EmployeeAvatar";
import { CodeBlock } from "./CodeBlock";
import { getEmployee, type EmployeeId } from "../../../lib/conduit/employees";

function formatMessageTime(iso: string): string {
  const d = new Date(iso);
  if (isToday(d)) return format(d, "h:mm a");
  if (isYesterday(d)) return "Yesterday " + format(d, "h:mm a");
  return format(d, "MMM d, h:mm a");
}

export interface MessageBubbleProps {
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  employee?: EmployeeId | "team" | null;
  pending?: boolean;
  /** ISO timestamp — displayed below the bubble when provided. */
  timestamp?: string;
  /** Whether the message failed to persist (user messages only). */
  failed?: boolean;
  /** Retry handler shown when failed=true. */
  onRetry?: () => void;
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

export function MessageBubble({ role, content, employee, pending, timestamp, failed, onRetry }: MessageBubbleProps) {
  const t = usePraxisTheme();
  const safeRole: MessageBubbleProps["role"] =
    role === "user" || role === "assistant" || role === "system" || role === "tool"
      ? role
      : "assistant";
  const isUser = safeRole === "user";
  const employeeCfg = !isUser ? getEmployee(employee ?? null) : null;

  const segments = useMemo(() => segmentMarkdown(content), [content]);

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
        paddingVertical: 8,
        gap: 10,
        justifyContent: isUser ? "flex-end" : "flex-start",
      }}
    >
      {!isUser ? (
        <EmployeeAvatar employee={(employee ?? "atlas") as EmployeeId | "team"} size="sm" />
      ) : null}

      <View style={{ maxWidth: "80%", gap: 4 }}>
      <View
        style={{
          borderRadius: t.radii.lg,
          paddingHorizontal: 14,
          paddingVertical: 10,
          backgroundColor: failed
            ? t.colors.bgSurface
            : isUser ? t.colors.indigo500 : t.colors.bgSurface,
          borderWidth: 1,
          borderColor: failed
            ? t.colors.danger
            : isUser ? "transparent" : t.colors.borderSubtle,
          opacity: pending ? 0.65 : 1,
        }}
      >
        {!isUser && employeeCfg ? (
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

      {/* Timestamp or status below the bubble */}
      {failed && onRetry ? (
        <Pressable onPress={onRetry} hitSlop={6}>
          <Text
            variant="caption"
            style={{
              color: t.colors.danger,
              textAlign: isUser ? "right" : "left",
            }}
          >
            Failed to send — tap to retry
          </Text>
        </Pressable>
      ) : pending ? (
        <Text
          variant="caption"
          tone="tertiary"
          style={{ textAlign: isUser ? "right" : "left" }}
        >
          Sending…
        </Text>
      ) : timestamp ? (
        <Text
          variant="caption"
          tone="tertiary"
          style={{ textAlign: isUser ? "right" : "left" }}
        >
          {formatMessageTime(timestamp)}
        </Text>
      ) : null}
      </View>
    </View>
  );
}
