import { create } from "zustand";
import { supabase } from "../lib/supabase";
import { clearAccountCache } from "../lib/conduit/account";
import { clearBackendToken } from "../lib/conduit/backendAuth";
import type { User, Session } from "@supabase/supabase-js";

interface AuthState {
  user: User | null;
  session: Session | null;
  // True only while the app is hydrating its initial auth state from
  // SecureStore on cold launch. Never flipped by signIn/signUp/signOut —
  // the root layout uses this to gate the splash screen and the very first
  // navigation decision; auth screens own their own per-submit "submitting"
  // state, so this flag must NOT be toggled during in-flight auth ops or
  // the entire <Slot /> unmounts mid-submit and the screen flashes blank.
  isBootstrapping: boolean;
  isAuthenticated: boolean;
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, metadata?: Record<string, unknown>) => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  isBootstrapping: true,
  isAuthenticated: false,

  initialize: async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      set({
        user: session?.user ?? null,
        session: session ?? null,
        isAuthenticated: !!session,
        isBootstrapping: false,
      });

      // The session's `user` is hydrated from the cached JWT, which carries
      // user_metadata as it existed *when the token was issued*. If anyone
      // has updated auth.users (e.g. display_name) since then, those fields
      // are stale until the next token refresh. Fetch the live user from
      // /auth/v1/user so greetings/avatars reflect current metadata on
      // first launch — not an hour later.
      if (session) {
        const { data: live, error: liveErr } = await supabase.auth.getUser();
        if (liveErr) {
          console.warn("[Auth] getUser refresh failed:", liveErr.message);
        } else if (live?.user) {
          console.log(
            "[Auth] user_metadata at launch:",
            JSON.stringify(live.user.user_metadata ?? {}),
          );
          set({ user: live.user });
        }
      }

      supabase.auth.onAuthStateChange((_event, nextSession) => {
        set({
          user: nextSession?.user ?? null,
          session: nextSession,
          isAuthenticated: !!nextSession,
        });
        if (!nextSession) clearAccountCache();
      });
    } catch (error) {
      console.error("[Auth] init error:", error);
      set({ isBootstrapping: false });
    }
  },

  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    set({
      user: data.user,
      session: data.session,
      isAuthenticated: true,
    });
  },

  signUp: async (email, password, metadata) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata },
    });
    if (error) throw error;
    set({
      user: data.user,
      session: data.session,
      isAuthenticated: !!data.session,
    });
  },

  signOut: async () => {
    await supabase.auth.signOut();
    clearAccountCache();
    clearBackendToken().catch(() => {});
    set({ user: null, session: null, isAuthenticated: false });
  },
}));
