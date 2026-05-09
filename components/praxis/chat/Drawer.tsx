import React, { useEffect, useMemo } from "react";
import {
  View,
  Pressable,
  ScrollView,
  TextInput,
  Dimensions,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  MagnifyingGlass,
  Stack as StackIcon,
  UsersThree,
  GearSix,
  PencilSimple,
  PushPinSimple,
} from "phosphor-react-native";
import { formatDistanceToNow, isToday, isYesterday, subDays } from "date-fns";
import * as Haptics from "expo-haptics";
import { usePraxisTheme } from "../../../contexts/PraxisThemeContext";
import { Text } from "../Text";
import { EmployeeAvatar } from "../EmployeeAvatar";
import { EMPLOYEE_LIST, type EmployeeId } from "../../../lib/conduit/employees";
import type { Conversation } from "../../../lib/conduit/types";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const DRAWER_WIDTH = Math.min(SCREEN_WIDTH * 0.84, 360);

const PINNED: EmployeeId[] = ["atlas", "engineering", "sales", "marketing"];

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  conversations: Conversation[];
  activeConversationId?: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onSelectEmployee: (employeeId: EmployeeId) => void;
}

interface ConversationGroup {
  label: string;
  items: Conversation[];
}

function groupConversations(items: Conversation[]): ConversationGroup[] {
  const today: Conversation[] = [];
  const yesterday: Conversation[] = [];
  const last7: Conversation[] = [];
  const earlier: Conversation[] = [];
  const sevenDaysAgo = subDays(new Date(), 7);

  for (const c of items) {
    const ts = new Date(c.updated_at);
    if (isToday(ts)) today.push(c);
    else if (isYesterday(ts)) yesterday.push(c);
    else if (ts > sevenDaysAgo) last7.push(c);
    else earlier.push(c);
  }

  const groups: ConversationGroup[] = [];
  if (today.length) groups.push({ label: "Today", items: today });
  if (yesterday.length) groups.push({ label: "Yesterday", items: yesterday });
  if (last7.length) groups.push({ label: "Last 7 days", items: last7 });
  if (earlier.length) groups.push({ label: "Earlier", items: earlier });
  return groups;
}

export function Drawer({
  open,
  onClose,
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewChat,
  onSelectEmployee,
}: DrawerProps) {
  const t = usePraxisTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const progress = useSharedValue(0);
  const [search, setSearch] = React.useState("");

  useEffect(() => {
    progress.value = open
      ? withSpring(1, { damping: 22, stiffness: 200, mass: 0.8 })
      : withTiming(0, { duration: 220, easing: Easing.out(Easing.cubic) });
  }, [open, progress]);

  const drawerStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(
          progress.value,
          [0, 1],
          [-DRAWER_WIDTH, 0],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  const scrimStyle = useAnimatedStyle(() => ({
    opacity: progress.value * 0.6,
  }));

  const filtered = useMemo(() => {
    if (!search.trim()) return conversations;
    const q = search.trim().toLowerCase();
    return conversations.filter((c) =>
      (c.title ?? "Untitled").toLowerCase().includes(q),
    );
  }, [conversations, search]);

  const groups = useMemo(() => groupConversations(filtered), [filtered]);

  const handleSelect = (id: string) => {
    Haptics.selectionAsync().catch(() => {});
    onSelectConversation(id);
    onClose();
  };

  const handleEmployee = (emp: EmployeeId) => {
    Haptics.selectionAsync().catch(() => {});
    onSelectEmployee(emp);
    onClose();
  };

  const handleNew = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onNewChat();
    onClose();
  };

  const goRoute = (path: string) => {
    Haptics.selectionAsync().catch(() => {});
    onClose();
    setTimeout(() => router.push(path as never), 160);
  };

  return (
    <View
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 50,
        pointerEvents: open ? "auto" : "none",
      }}
    >
      <Animated.View
        style={[
          {
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "#000",
          },
          scrimStyle,
        ]}
      >
        <Pressable
          onPress={onClose}
          style={{ width: "100%", height: "100%" }}
        />
      </Animated.View>

      <Animated.View
        style={[
          {
            position: "absolute",
            top: 0,
            bottom: 0,
            left: 0,
            width: DRAWER_WIDTH,
            backgroundColor: t.colors.bgSurface,
            borderRightWidth: 0.5,
            borderRightColor: t.colors.borderSubtle,
            paddingTop: insets.top + 8,
            paddingBottom: Math.max(insets.bottom, 12),
          },
          drawerStyle,
        ]}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 18,
            paddingBottom: 12,
          }}
        >
          <Text variant="caption" tone="indigo" weight="semibold">
            CONVERSATIONS
          </Text>
          <Pressable
            onPress={handleNew}
            hitSlop={10}
            style={({ pressed }) => ({
              width: 32,
              height: 32,
              borderRadius: 16,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: pressed ? t.colors.bgElevated : "transparent",
            })}
          >
            <PencilSimple size={16} color={t.colors.inkPrimary} weight="fill" />
          </Pressable>
        </View>

        <View style={{ paddingHorizontal: 14, paddingBottom: 10 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              backgroundColor: t.colors.bgElevated,
              borderRadius: t.radii.md,
              paddingHorizontal: 12,
              paddingVertical: 8,
            }}
          >
            <MagnifyingGlass size={14} color={t.colors.inkTertiary} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search"
              placeholderTextColor={t.colors.inkTertiary}
              style={{
                flex: 1,
                fontFamily: t.fonts.body,
                fontSize: 14,
                color: t.colors.inkPrimary,
                padding: 0,
              }}
            />
          </View>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
        >
          {groups.length === 0 ? (
            <View style={{ paddingHorizontal: 18, paddingTop: 24 }}>
              <Text variant="bodySm" tone="tertiary">
                No conversations yet. Tap the pencil to start one.
              </Text>
            </View>
          ) : (
            groups.map((g) => (
              <View key={g.label} style={{ marginBottom: 14 }}>
                <Text
                  variant="caption"
                  tone="tertiary"
                  weight="semibold"
                  style={{ paddingHorizontal: 18, paddingVertical: 6 }}
                >
                  {g.label.toUpperCase()}
                </Text>
                {g.items.map((c) => {
                  const isActive = c.id === activeConversationId;
                  return (
                    <Pressable
                      key={c.id}
                      onPress={() => handleSelect(c.id)}
                      style={({ pressed }) => ({
                        paddingHorizontal: 14,
                        paddingVertical: 10,
                        marginHorizontal: 6,
                        borderRadius: t.radii.md,
                        backgroundColor: isActive
                          ? t.colors.indigoSoft
                          : pressed
                            ? t.colors.bgElevated
                            : "transparent",
                      })}
                    >
                      <Text
                        variant="bodySm"
                        weight={isActive ? "semibold" : "medium"}
                        numberOfLines={1}
                        style={{
                          color: isActive
                            ? t.colors.indigo500
                            : t.colors.inkPrimary,
                        }}
                      >
                        {c.title ?? "Untitled"}
                      </Text>
                      <Text
                        variant="caption"
                        tone="tertiary"
                        style={{ marginTop: 2, letterSpacing: 0 }}
                      >
                        {formatDistanceToNow(new Date(c.updated_at), {
                          addSuffix: true,
                        })}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ))
          )}

          <View
            style={{
              marginTop: 8,
              marginHorizontal: 14,
              paddingTop: 14,
              borderTopWidth: 0.5,
              borderTopColor: t.colors.borderSubtle,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                paddingHorizontal: 4,
                paddingBottom: 8,
              }}
            >
              <PushPinSimple size={11} color={t.colors.inkTertiary} weight="fill" />
              <Text variant="caption" tone="tertiary" weight="semibold">
                PINNED
              </Text>
            </View>
            {PINNED.map((id) => {
              const e = EMPLOYEE_LIST.find((emp) => emp.id === id);
              if (!e) return null;
              return (
                <Pressable
                  key={id}
                  onPress={() => handleEmployee(id)}
                  style={({ pressed }) => ({
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                    paddingHorizontal: 6,
                    paddingVertical: 8,
                    borderRadius: t.radii.md,
                    backgroundColor: pressed ? t.colors.bgElevated : "transparent",
                  })}
                >
                  <EmployeeAvatar employee={id} size="xs" />
                  <View style={{ flex: 1 }}>
                    <Text variant="bodySm" weight="medium">
                      {e.name}
                    </Text>
                    <Text variant="caption" tone="tertiary" style={{ letterSpacing: 0 }}>
                      {e.title}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-around",
            paddingHorizontal: 16,
            paddingTop: 12,
            borderTopWidth: 0.5,
            borderTopColor: t.colors.borderSubtle,
          }}
        >
          <RailButton
            label="Builds"
            icon={<StackIcon size={18} color={t.colors.inkSecondary} />}
            onPress={() => goRoute("/(app)/builds")}
          />
          <RailButton
            label="Team"
            icon={<UsersThree size={18} color={t.colors.inkSecondary} />}
            onPress={() => goRoute("/(app)/team")}
          />
          <RailButton
            label="Settings"
            icon={<GearSix size={18} color={t.colors.inkSecondary} />}
            onPress={() => goRoute("/(app)/settings")}
          />
        </View>
      </Animated.View>
    </View>
  );
}

function RailButton({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
}) {
  const t = usePraxisTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        alignItems: "center",
        paddingVertical: 8,
        gap: 4,
        borderRadius: t.radii.md,
        backgroundColor: pressed ? t.colors.bgElevated : "transparent",
      })}
    >
      {icon}
      <Text
        variant="caption"
        tone="secondary"
        weight="medium"
        style={{ letterSpacing: 0.4, fontSize: 10 }}
      >
        {label.toUpperCase()}
      </Text>
    </Pressable>
  );
}
