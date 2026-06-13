import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@praxis_creator_mode";

interface CreatorModeState {
  enabled: boolean;
  initialize: () => Promise<void>;
  setEnabled: (on: boolean) => Promise<void>;
}

export const useCreatorModeStore = create<CreatorModeState>((set) => ({
  enabled: false,

  initialize: async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored === "true") set({ enabled: true });
    } catch (e) {
      console.warn("[CreatorMode] Failed to load preference:", e);
    }
  },

  setEnabled: async (on) => {
    set({ enabled: on });
    try {
      await AsyncStorage.setItem(STORAGE_KEY, on ? "true" : "false");
    } catch (e) {
      console.warn("[CreatorMode] Failed to save preference:", e);
    }
  },
}));
