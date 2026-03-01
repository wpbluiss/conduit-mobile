import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, metadata?: Record<string, unknown>) => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  isLoading: true,
  isAuthenticated: false,

  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        set({ user: session.user, session, isAuthenticated: true, isLoading: false });
      } else {
        set({ isLoading: false });
      }
      supabase.auth.onAuthStateChange((_event, session) => {
        set({ user: session?.user ?? null, session, isAuthenticated: !!session });
      });
    } catch (error) {
      console.error('Auth init error:', error);
      set({ isLoading: false });
    }
  },

  signIn: async (email, password) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      set({ user: data.user, session: data.session, isAuthenticated: true, isLoading: false });
    } catch (error) { set({ isLoading: false }); throw error; }
  },

  signUp: async (email, password, metadata) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase.auth.signUp({ email, password, options: { data: metadata } });
      if (error) throw error;
      set({ user: data.user, session: data.session, isAuthenticated: !!data.session, isLoading: false });
    } catch (error) { set({ isLoading: false }); throw error; }
  },

  signOut: async () => {
    set({ isLoading: true });
    try {
      await supabase.auth.signOut();
      set({ user: null, session: null, isAuthenticated: false, isLoading: false });
    } catch (error) { set({ isLoading: false }); throw error; }
  },
}));
