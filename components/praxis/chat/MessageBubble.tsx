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
}

type Segment =
  | { type: "text"; text: string }
  | { type: "code"; lang: string; code: string };

function segmentMarkdown(input: string): Segment[] {
  const segments: Segment[] = [];
  const fence = /```(\w*)\n?([\s\S]*?)```/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = fence.exec(input))) {
    if (m.index > last) {
      segments.push({ type: "text", text: input.slice(last, m.index) });
    }
    segments.push({ type: "code", lang: m[1] ?? "", code: m[2].trimEnd() });
    last = m.index + m[0].length;
  }
  if (last < input.length) {
    segments.push({ type: "text", text: input.slice(last) });
  }
  return segments;
}

export function MessageBubble({ role, content, employee, pending }: MessageBubbleProps) {
  const t = usePraxisTheme();
  const isUser = role === "user";
  const employeeCfg = !isUser ? getEmployee(employee ?? null) : null;

  const segments = useMemo(() => segmentMarkdown(content), [content]);

  if (role === "tool" || role === "system") {
    return (
      <View style={{ paddingHorizontal: 16, paddingVertical: 6 }}>
        <Text variant="caption" tone="tertiary" align="center">
          {content}
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

      <View
        style={{
          maxWidth: "80%",
          borderRadius: t.radii.lg,
          paddingHorizontal: 14,
          paddingVertical: 10,
          backgroundColor: isUser ? t.colors.indigo500 : t.colors.bgSurface,
          borderWidth: isUser ? 0 : 1,
          borderColor: isUser ? "transparent" : t.colors.borderSubtle,
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
    </View>
  );
}
