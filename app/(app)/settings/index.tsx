import React, { useEffect, useState } from "react";
import {
  View,
  ScrollView,
  Pressable,
  Linking,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  CaretRight,
  UserCircle,
  Microphone,
  Brain,
  Sun,
  Info,
  CreditCard,
  FileText,
  EnvelopeSimple,
  SignOut,
} from "phosphor-react-native";
import Constants from "expo-constants";
import { usePraxisTheme } from "../../../contexts/PraxisThemeContext";
import { Text, Button } from "../../../components/praxis";
import { useAuthStore } from "../../../store/authStore";
import { getOrCreateAccount } from "../../../lib/conduit/account";
import {
  deriveDisplayName,
  deriveInitial,
} from "../../../lib/conduit/displayName";
import { API_URL, authedFetch } from "../../../lib/conduit/api";
import type { ConduitAccount } from "../../../lib/conduit/types";

interface Row {
  href: string;
  label: string;
  hint: string;
  icon: (color: string) => React.ReactNode;
}

const SETTINGS_ROWS: Row[] = [
  {
    href: "/(app)/settings/account",
    label: "Account",
    hint: "Profile, email, danger zone",
    icon: (c) => <UserCircle size={18} color={c} weight="fill" />,
  },
  {
    href: "/(app)/settings/voice-prefs",
    label: "Voice preferences",
    hint: "Audio output, captions",
    icon: (c) => <Microphone size={18} color={c} />,
  },
  {
    href: "/(app)/settings/memory",
    label: "Memory",
    hint: "What Atlas remembers",
    icon: (c) => <Brain size={18} color={c} />,
  },
  {
    href: "/(app)/settings/appearance",
    label: "Appearance",
    hint: "Light, dark, or system",
    icon: (c) => <Sun size={18} color={c} weight="fill" />,
  },
];

function tierLabel(tierId: string | null | undefined): string {
  const id = (tierId ?? "free").toLowerCase();
  const map: Record<string, string> = {
    free: "FREE",
    starter: "STARTER",
    pro: "PRO",
    enterprise: "ENTERPRISE",
  };
  return map[id] ?? id.toUpperCase();
}

function TierBadge({ tierId }: { tierId: string | null | undefined }) {
  const t = usePraxisTheme();
  const id = (tierId ?? "free").toLowerCase();

  const { color, bg } = ((): { color: string; bg: string } => {
    switch (id) {
      case "pro":
        return { color: t.colors.violet600, bg: "rgba(124,58,237,0.13)" };
      case "enterprise":
        return { color: t.colors.ember, bg: "rgba(214,120,23,0.13)" };
      default:
        return { color: t.colors.indigo500, bg: t.colors.indigoSoft };
    }
  })();

  return (
    <View
      style={{
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: t.radii.full,
        backgroundColor: bg,
      }}
    >
      <Text
        variant="caption"
        weight="semibold"
        style={{ color, letterSpacing: 0.7 }}
      >
        {tierLabel(tierId)}
      </Text>
    </View>
  );
}

export default function SettingsIndexScreen() {
  const t = usePraxisTheme();
  const router = useRouter();
  const { user, signOut } = useAuthStore();

  const [account, setAccount] = useState<ConduitAccount | null>(null);

  const version = Constants.expoConfig?.version ?? "1.0.0";
  const build = Constants.expoConfig?.ios?.buildNumber ?? "?";

  const displayName = deriveDisplayName(user);
  const initial = deriveInitial(user);

  useEffect(() => {
    getOrCreateAccount().then(setAccount);
  }, []);

  const handleSignOut = () => {
    Alert.alert("Sign out?", "You can sign back in any time.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: async () => {
          await signOut();
          router.replace("/(auth)/sign-in");
        },
      },
    ]);
  };

  const handleBilling = async () => {
    try {
      const res = await authedFetch("/api/conduit/billing/portal", {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        const url = typeof data?.url === "string" ? data.url : null;
        if (url) {
          await Linking.openURL(url);
          return;
        }
      }
    } catch {
      // fall through to fallback
    }
    await Linking.openURL(`${API_URL}/app/billing`).catch(() => {});
  };

  const openURL = (url: string) => Linking.openURL(url).catch(() => {});

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: t.colors.bgCanvas }}
      edges={["top"]}
    >
      <View style={{ paddingHorizontal: 8, paddingVertical: 8 }}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          style={{
            width: 36,
            height: 36,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ArrowLeft size={20} color={t.colors.inkPrimary} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: t.layout.screenPaddingX,
          paddingBottom: 40,
          gap: 24,
        }}
      >
        {/* Page heading */}
        <View>
          <Text variant="caption" tone="indigo" weight="semibold">
            SETTINGS
          </Text>
          <Text variant="displayLg" family="display" weight="semibold">
            How Praxis behaves.
          </Text>
        </View>

        {/* User profile card */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 14,
            padding: 16,
            borderRadius: t.radii.lg,
            backgroundColor: t.colors.bgSurface,
            borderWidth: 1,
            borderColor: t.colors.borderSubtle,
          }}
        >
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: t.colors.indigoSoft,
              borderWidth: 1.5,
              borderColor: t.colors.indigo300,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              variant="displaySm"
              family="display"
              weight="semibold"
              style={{ color: t.colors.indigo500 }}
            >
              {initial.toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text variant="body" weight="semibold" numberOfLines={1}>
              {account?.name ?? displayName}
            </Text>
            <Text
              variant="bodySm"
              tone="tertiary"
              numberOfLines={1}
              style={{ marginTop: 2 }}
            >
              {user?.email ?? ""}
            </Text>
          </View>
          {account !== null ? (
            <TierBadge tierId={account.tier_id} />
          ) : (
            <ActivityIndicator size="small" color={t.colors.indigo500} />
          )}
        </View>

        {/* Settings section */}
        <Section label="PREFERENCES">
          {SETTINGS_ROWS.map((row, i) => (
            <NavRow
              key={row.href}
              label={row.label}
              hint={row.hint}
              icon={row.icon(t.colors.indigo500)}
              iconBg={t.colors.indigoSoft}
              isFirst={i === 0}
              onPress={() => router.push(row.href as never)}
            />
          ))}
        </Section>

        {/* Billing section */}
        <Section label="BILLING">
          <NavRow
            label="Manage billing"
            hint="Upgrade, invoices, Stripe portal"
            icon={<CreditCard size={18} color={t.colors.indigo500} />}
            iconBg={t.colors.indigoSoft}
            isFirst
            onPress={handleBilling}
          />
        </Section>

        {/* Legal section */}
        <Section label="LEGAL">
          <NavRow
            label="Terms of Service"
            hint="conduitai.io/terms"
            icon={<FileText size={18} color={t.colors.inkSecondary} />}
            iconBg={t.colors.bgElevated}
            isFirst
            onPress={() => openURL(`${API_URL}/terms`)}
          />
          <NavRow
            label="Privacy Policy"
            hint="conduitai.io/privacy"
            icon={<FileText size={18} color={t.colors.inkSecondary} />}
            iconBg={t.colors.bgElevated}
            onPress={() => openURL(`${API_URL}/privacy`)}
          />
          <NavRow
            label="Acceptable Use"
            hint="conduitai.io/aup"
            icon={<FileText size={18} color={t.colors.inkSecondary} />}
            iconBg={t.colors.bgElevated}
            onPress={() => openURL(`${API_URL}/aup`)}
          />
        </Section>

        {/* Support section */}
        <Section label="SUPPORT">
          <NavRow
            label="Email support"
            hint="support@praxis.ai"
            icon={<EnvelopeSimple size={18} color={t.colors.inkSecondary} />}
            iconBg={t.colors.bgElevated}
            isFirst
            onPress={() => openURL("mailto:support@praxis.ai")}
          />
        </Section>

        {/* Sign out */}
        <Button
          label="Sign out"
          variant="secondary"
          size="lg"
          fullWidth
          iconLeft={<SignOut size={16} color={t.colors.inkPrimary} />}
          onPress={handleSignOut}
        />

        {/* Version footer */}
        <View style={{ alignItems: "center", gap: 4 }}>
          <Info size={14} color={t.colors.inkTertiary} />
          <Text variant="caption" tone="tertiary">
            Praxis Console · v{version} (build {build})
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  const t = usePraxisTheme();
  return (
    <View style={{ gap: 6 }}>
      <Text
        variant="caption"
        tone="tertiary"
        weight="semibold"
        style={{ paddingHorizontal: 4 }}
      >
        {label}
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
        {children}
      </View>
    </View>
  );
}

function NavRow({
  label,
  hint,
  icon,
  iconBg,
  isFirst = false,
  onPress,
}: {
  label: string;
  hint: string;
  icon: React.ReactNode;
  iconBg: string;
  isFirst?: boolean;
  onPress: () => void;
}) {
  const t = usePraxisTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderTopWidth: isFirst ? 0 : 0.5,
        borderTopColor: t.colors.borderSubtle,
        backgroundColor: pressed ? t.colors.bgElevated : "transparent",
      })}
    >
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: iconBg,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
      </View>
      <View style={{ flex: 1 }}>
        <Text variant="body" weight="medium">
          {label}
        </Text>
        <Text variant="bodySm" tone="tertiary" style={{ marginTop: 2 }}>
          {hint}
        </Text>
      </View>
      <CaretRight size={14} color={t.colors.inkTertiary} />
    </Pressable>
  );
}
