import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type ThemePreference = "system" | "light" | "dark";

interface ThemeState {
  preference: ThemePreference;
  initialize: () => Promise<void>;
  setPreference: (p: ThemePreference) => Promise<void>;
}

const STORAGE_KEY = "@praxis_theme_preference";

export const useThemeStore = create<ThemeState>((set) => ({
  preference: "system",

  initialize: async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored === "light" || stored === "dark" || stored === "system") {
        set({ preference: stored });
      }
    } catch (e) {
      console.warn("[Theme] Failed to load preference:", e);
    }
  },

  setPreference: async (p) => {
    set({ preference: p });
    try {
      await AsyncStorage.setItem(STORAGE_KEY, p);
    } catch (e) {
      console.warn("[Theme] Failed to save preference:", e);
    }
  },
}));
