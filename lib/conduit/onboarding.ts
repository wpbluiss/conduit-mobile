import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../supabase";
import { clearAccountCache, getOrCreateAccount } from "./account";

const DISMISSED_KEY = "praxis:onboarding_dismissed";

export async function isOnboardingDismissed(): Promise<boolean> {
  const val = await AsyncStorage.getItem(DISMISSED_KEY);
  return val === "true";
}

export async function dismissOnboarding(): Promise<void> {
  await AsyncStorage.setItem(DISMISSED_KEY, "true");
}

export async function needsOnboarding(): Promise<boolean> {
  const dismissed = await isOnboardingDismissed();
  if (dismissed) return false;

  const account = await getOrCreateAccount();
  if (!account) return false;

  if (account.business_type && account.business_description) {
    await AsyncStorage.setItem(DISMISSED_KEY, "true");
    return false;
  }

  return true;
}

export async function completeOnboarding(params: {
  name: string;
  businessType: string;
  businessDescription: string;
}): Promise<void> {
  const account = await getOrCreateAccount();
  if (account) {
    await supabase
      .from("conduit_accounts")
      .update({
        name: params.name.trim() || account.name,
        business_type: params.businessType.trim(),
        business_description: params.businessDescription.trim(),
      })
      .eq("id", account.id);
    clearAccountCache();
  }
  await AsyncStorage.setItem(DISMISSED_KEY, "true");
}
