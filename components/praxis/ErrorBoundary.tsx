import React from "react";
import { View, Pressable } from "react-native";
import { ArrowClockwise, WarningCircle } from "phosphor-react-native";
import { usePraxisTheme } from "../../contexts/PraxisThemeContext";
import { Text } from "./Text";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  /** Override the default fallback UI. */
  fallback?: (err: Error, reset: () => void) => React.ReactNode;
  /** Called once when the boundary catches. Useful for telemetry. */
  onError?: (err: Error, info: React.ErrorInfo) => void;
  /** Reset state when this value changes (e.g. route param). */
  resetKey?: string | number | null;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.warn("[ErrorBoundary] caught:", error?.message, info?.componentStack);
    this.props.onError?.(error, info);
  }

  componentDidUpdate(prev: ErrorBoundaryProps) {
    if (this.state.error && prev.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }

  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.reset);
      }
      return <DefaultFallback error={this.state.error} onRetry={this.reset} />;
    }
    return this.props.children;
  }
}

function DefaultFallback({
  error,
  onRetry,
}: {
  error: Error;
  onRetry: () => void;
}) {
  const t = usePraxisTheme();
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: t.colors.bgCanvas,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 32,
      }}
    >
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: t.colors.indigoSoft,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 16,
        }}
      >
        <WarningCircle size={28} color={t.colors.indigo500} weight="regular" />
      </View>
      <Text
        variant="caption"
        tone="indigo"
        weight="semibold"
        style={{ marginBottom: 8 }}
      >
        SOMETHING WENT WRONG
      </Text>
      <Text
        variant="displayMd"
        family="display"
        weight="semibold"
        align="center"
        style={{ marginBottom: 8 }}
      >
        We hit a snag.
      </Text>
      <Text
        variant="body"
        tone="secondary"
        align="center"
        style={{ marginBottom: 24, maxWidth: 320 }}
      >
        {error.message?.slice(0, 200) || "Unexpected error rendering this view."}
      </Text>
      <Pressable
        onPress={onRetry}
        style={({ pressed }) => ({
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          paddingHorizontal: 18,
          paddingVertical: 12,
          borderRadius: t.radii.full,
          backgroundColor: pressed ? t.colors.indigo700 : t.colors.indigo500,
        })}
      >
        <ArrowClockwise size={16} color="#FFFFFF" weight="bold" />
        <Text variant="bodySm" weight="semibold" style={{ color: "#FFFFFF" }}>
          Try again
        </Text>
      </Pressable>
    </View>
  );
}
