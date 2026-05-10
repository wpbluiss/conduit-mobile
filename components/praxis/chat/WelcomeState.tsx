import React from "react";
import { View, Pressable, ScrollView } from "react-native";
import * as Haptics from "expo-haptics";
import { usePraxisTheme } from "../../../contexts/PraxisThemeContext";
import { Text } from "../Text";
import { EmployeeAvatar } from "../EmployeeAvatar";
import {
  EMPLOYEE_LIST,
  type EmployeeId,
} from "../../../lib/conduit/employees";

export interface WelcomeStateProps {
  greeting: string;
  displayName: string;
  suggestions: string[];
  onSelectSuggestion: (text: string) => void;
  onSelectEmployee?: (id: EmployeeId | "team") => void;
}

export function WelcomeState({
  greeting,
  displayName,
  suggestions,
  onSelectSuggestion,
  onSelectEmployee,
}: WelcomeStateProps) {
  const t = usePraxisTheme();

  return (
    <ScrollView
      contentContainerStyle={{
        flexGrow: 1,
        justifyContent: "center",
        paddingHorizontal: t.layout.screenPaddingX,
        paddingVertical: 32,
      }}
      showsVerticalScrollIndicator={false}
    >
      <View
        style={{
          alignItems: "center",
          marginBottom: 32,
        }}
      >
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: t.colors.indigoSoft,
            borderWidth: 1,
            borderColor: t.colors.indigo300,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 18,
          }}
        >
          <Text
            variant="displayMd"
            family="display"
            weight="semibold"
            style={{ color: t.colors.indigo500 }}
          >
            P
          </Text>
        </View>

        <Text
          variant="caption"
          tone="indigo"
          weight="semibold"
          style={{ marginBottom: 8 }}
        >
          PRAXIS CONSOLE
        </Text>
        <Text
          variant="displayLg"
          family="display"
          weight="semibold"
          align="center"
        >
          {greeting},
        </Text>
        <Text
          variant="displayLg"
          family="display"
          weight="semibold"
          italic
          tone="indigo"
          align="center"
          style={{ marginTop: 0 }}
        >
          {displayName}.
        </Text>
        <Text
          variant="bodyLg"
          tone="secondary"
          align="center"
          style={{ marginTop: 12, maxWidth: 320 }}
        >
          What are we working on?
        </Text>
      </View>

      <View style={{ gap: 10, alignSelf: "stretch", marginBottom: 28 }}>
        {suggestions.map((s) => (
          <Pressable
            key={s}
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              onSelectSuggestion(s);
            }}
            style={({ pressed }) => ({
              paddingHorizontal: 16,
              paddingVertical: 14,
              borderRadius: t.radii.lg,
              backgroundColor: pressed ? t.colors.bgElevated : t.colors.bgSurface,
              borderWidth: 1,
              borderColor: t.colors.borderSubtle,
            })}
          >
            <Text variant="body" tone="primary">
              {s}
            </Text>
          </Pressable>
        ))}
      </View>

      {onSelectEmployee ? (
        <RouteToSection onSelectEmployee={onSelectEmployee} />
      ) : null}
    </ScrollView>
  );
}

function RouteToSection({
  onSelectEmployee,
}: {
  onSelectEmployee: (id: EmployeeId | "team") => void;
}) {
  const t = usePraxisTheme();

  const tap = (id: EmployeeId | "team") => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onSelectEmployee(id);
  };

  return (
    <View>
      <Text
        variant="caption"
        tone="indigo"
        weight="semibold"
        style={{ marginBottom: 10, paddingHorizontal: 4 }}
      >
        ROUTE TO
      </Text>

      <View
        style={{
          borderRadius: t.radii.lg,
          backgroundColor: t.colors.bgSurface,
          borderWidth: 1,
          borderColor: t.colors.borderSubtle,
          overflow: "hidden",
        }}
      >
        <RouteRow
          onPress={() => tap("team")}
          glyphAvatar={<EmployeeAvatar employee="team" size="xs" ringed />}
          name="The team"
          subtitle="Atlas routes to whoever fits"
          isFirst
        />
        {EMPLOYEE_LIST.map((e, idx) => (
          <RouteRow
            key={e.id}
            onPress={() => tap(e.id)}
            glyphAvatar={<EmployeeAvatar employee={e.id} size="xs" ringed />}
            name={e.name}
            subtitle={e.title}
            isFirst={false}
            isLast={idx === EMPLOYEE_LIST.length - 1}
          />
        ))}
      </View>
    </View>
  );
}

function RouteRow({
  onPress,
  glyphAvatar,
  name,
  subtitle,
  isFirst,
  isLast,
}: {
  onPress: () => void;
  glyphAvatar: React.ReactNode;
  name: string;
  subtitle: string;
  isFirst?: boolean;
  isLast?: boolean;
}) {
  const t = usePraxisTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingHorizontal: 14,
        paddingVertical: 11,
        backgroundColor: pressed ? t.colors.bgElevated : "transparent",
        borderTopWidth: isFirst ? 0 : 0.5,
        borderTopColor: t.colors.borderSubtle,
      })}
    >
      {glyphAvatar}
      <View style={{ flex: 1 }}>
        <Text variant="bodySm" weight="semibold">
          {name}
        </Text>
        <Text
          variant="caption"
          tone="tertiary"
          style={{ letterSpacing: 0, marginTop: 1 }}
        >
          {subtitle}
        </Text>
      </View>
    </Pressable>
  );
}
