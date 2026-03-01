import { create } from 'zustand';
import { api, Lead, DashboardStats, AgentStatus } from '../lib/api';
import { supabase } from '../lib/supabase';

interface LeadsState {
  leads: Lead[];
  dashboardStats: DashboardStats | null;
  agentStatus: AgentStatus | null;
  isLoading: boolean;
  isRefreshing: boolean;
  filter: string;
  fetchLeads: (filter?: string) => Promise<void>;
  fetchDashboard: () => Promise<void>;
  fetchAgentStatus: () => Promise<void>;
  updateLeadStatus: (id: string, status: string) => Promise<void>;
  setFilter: (f: string) => void;
  refresh: () => Promise<void>;
  subscribeToRealtime: (businessId: string) => () => void;
}

export const useLeadsStore = create<LeadsState>((set, get) => ({
  leads: [],
  dashboardStats: null,
  agentStatus: null,
  isLoading: false,
  isRefreshing: false,
  filter: 'all',

  fetchLeads: async (filter) => {
    try {
      set({ isLoading: true });
      const period = filter || get().filter;
      const leads = await api.getLeads(period !== 'all' ? { period } : undefined);
      set({ leads, isLoading: false });
    } catch { set({ isLoading: false }); }
  },

  fetchDashboard: async () => {
    try { const stats = await api.getDashboardStats(); set({ dashboardStats: stats }); } catch {}
  },

  fetchAgentStatus: async () => {
    try { const status = await api.getAgentStatus(); set({ agentStatus: status }); } catch {}
  },

  updateLeadStatus: async (id, status) => {
    try {
      await api.updateLeadStatus(id, status);
      set((s) => ({ leads: s.leads.map((l) => l.id === id ? { ...l, status: status as Lead['status'] } : l) }));
    } catch {}
  },

  setFilter: (filter) => { set({ filter }); get().fetchLeads(filter); },

  refresh: async () => {
    set({ isRefreshing: true });
    await Promise.all([get().fetchLeads(), get().fetchDashboard(), get().fetchAgentStatus()]);
    set({ isRefreshing: false });
  },

  subscribeToRealtime: (businessId) => {
    const channel = supabase
      .channel('leads-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'leads', filter: `business_id=eq.${businessId}` },
        (payload) => {
          const newLead = payload.new as Lead;
          set((s) => ({
            leads: [newLead, ...s.leads],
            dashboardStats: s.dashboardStats ? { ...s.dashboardStats, leads_today: s.dashboardStats.leads_today + 1 } : null,
          }));
        })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  },
}));
