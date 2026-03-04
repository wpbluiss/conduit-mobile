import { create } from 'zustand';
import {
  api,
  Lead,
  DashboardStats,
  AgentStatus,
  getLeadsFromSupabase,
  getDashboardStatsFromSupabase,
  updateLeadStatusInSupabase,
} from '../lib/api';
import { supabase } from '../lib/supabase';
import { useAuthStore } from './authStore';

// ── Mock Data (guest mode only) ──────────────────────────────

const MOCK_LEADS: Lead[] = [
  { id: '1', caller_name: 'Marcus Johnson', caller_phone: '(561) 555-0134', summary: 'Wants a fade haircut, available Saturday morning', status: 'new', created_at: new Date(Date.now() - 3 * 60000).toISOString(), business_id: '1' },
  { id: '2', caller_name: 'Diana Reyes', caller_phone: '(561) 555-0278', summary: 'Kitchen sink leaking, needs plumber ASAP', status: 'new', created_at: new Date(Date.now() - 12 * 60000).toISOString(), business_id: '1' },
  { id: '3', caller_name: 'Terrence Williams', caller_phone: '(561) 555-0456', summary: 'Beard trim and lineup, walk-in today', status: 'contacted', created_at: new Date(Date.now() - 45 * 60000).toISOString(), business_id: '1' },
  { id: '4', caller_name: 'Laura Chen', caller_phone: '(561) 555-0891', summary: 'Bathroom remodel quote, 2-bed condo', status: 'booked', created_at: new Date(Date.now() - 2 * 3600000).toISOString(), business_id: '1' },
  { id: '5', caller_name: 'Andre Thompson', caller_phone: '(561) 555-0623', summary: 'Hot towel shave for wedding weekend', status: 'booked', created_at: new Date(Date.now() - 4 * 3600000).toISOString(), business_id: '1' },
  { id: '6', caller_name: 'Patricia Morales', caller_phone: '(305) 555-0347', summary: 'AC not blowing cold, unit is 8 years old', status: 'contacted', created_at: new Date(Date.now() - 6 * 3600000).toISOString(), business_id: '1' },
  { id: '7', caller_name: "Kevin O'Brien", caller_phone: '(954) 555-0182', summary: 'Kids haircut x2, ages 6 and 9', status: 'new', created_at: new Date(Date.now() - 8 * 3600000).toISOString(), business_id: '1' },
  { id: '8', caller_name: 'Jasmine Howard', caller_phone: '(561) 555-0754', summary: 'Water heater replacement, tankless preferred', status: 'lost', created_at: new Date(Date.now() - 18 * 3600000).toISOString(), business_id: '1' },
  { id: '9', caller_name: 'Carlos Gutierrez', caller_phone: '(305) 555-0519', summary: 'Drywall repair after pipe burst, insurance claim', status: 'lost', created_at: new Date(Date.now() - 26 * 3600000).toISOString(), business_id: '1' },
  { id: '10', caller_name: 'Nicole Baptiste', caller_phone: '(954) 555-0966', summary: 'Braids appointment, wants box braids waist-length', status: 'booked', created_at: new Date(Date.now() - 30 * 3600000).toISOString(), business_id: '1' },
];

const MOCK_DASHBOARD: DashboardStats = {
  leads_today: 12,
  leads_this_week: 47,
  leads_this_month: 156,
  revenue_saved: 4200,
  capture_rate: 89,
};

const MOCK_AGENT: AgentStatus = {
  is_active: true,
  agent_name: 'Conduit AI',
  phone_number: '(555) 012-3456',
  total_calls_handled: 243,
};

const EMPTY_DASHBOARD: DashboardStats = {
  leads_today: 0,
  leads_this_week: 0,
  leads_this_month: 0,
  revenue_saved: 0,
  capture_rate: 0,
};

const EMPTY_AGENT: AgentStatus = {
  is_active: false,
  agent_name: 'Conduit AI',
  phone_number: '',
  total_calls_handled: 0,
};

// ── Helper ────────────────────────────────────────────────────

function getBusinessId(): string | null {
  const { user } = useAuthStore.getState();
  return user?.user_metadata?.business_id || user?.id || null;
}

function isGuest(): boolean {
  return useAuthStore.getState().isGuestMode;
}

// ── Store ─────────────────────────────────────────────────────

interface LeadsState {
  leads: Lead[];
  dashboardStats: DashboardStats | null;
  agentStatus: AgentStatus | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  filter: string;
  usingMockData: boolean;
  fetchLeads: (filter?: string) => Promise<void>;
  fetchDashboard: () => Promise<void>;
  fetchAgentStatus: () => Promise<void>;
  toggleAgent: () => Promise<void>;
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
  error: null,
  filter: 'all',
  usingMockData: false,

  fetchLeads: async (filter) => {
    if (isGuest()) {
      set({ leads: MOCK_LEADS, isLoading: false, usingMockData: true });
      return;
    }

    // Authenticated user — real data only, never mock
    try {
      set({ isLoading: true, error: null });
      const supabaseLeads = await getLeadsFromSupabase();
      set({ leads: supabaseLeads, isLoading: false, usingMockData: false });
      if (supabaseLeads.length > 0) return;
    } catch (err: any) {
      console.warn('[LeadsStore] Supabase query failed, trying API:', err.message);
    }

    // Fallback: try the FastAPI backend
    const businessId = getBusinessId();
    if (businessId) {
      try {
        const period = filter || get().filter;
        const leads = await api.getLeads(businessId, period !== 'all' ? { period } : undefined);
        set({ leads, isLoading: false, usingMockData: false });
        return;
      } catch (err: any) {
        console.warn('[LeadsStore] API fallback failed:', err.message);
      }
    }

    // Auth user with no data = empty list, NOT mock data
    set({ leads: [], isLoading: false, usingMockData: false, error: null });
  },

  fetchDashboard: async () => {
    if (isGuest()) {
      set({ dashboardStats: MOCK_DASHBOARD, usingMockData: true });
      return;
    }

    // Authenticated user — real data only
    try {
      set({ error: null });
      const stats = await getDashboardStatsFromSupabase();
      if (stats) {
        set({ dashboardStats: stats, usingMockData: false });
        return;
      }
    } catch (err: any) {
      console.warn('[LeadsStore] Supabase dashboard failed, trying API:', err.message);
    }

    const businessId = getBusinessId();
    if (businessId) {
      try {
        const stats = await api.getDashboardStats(businessId);
        set({ dashboardStats: stats, usingMockData: false });
        return;
      } catch (err: any) {
        console.warn('[LeadsStore] API dashboard fallback failed:', err.message);
      }
    }

    // Auth user with no data = zeros, NOT mock data
    set({ dashboardStats: EMPTY_DASHBOARD, usingMockData: false });
  },

  fetchAgentStatus: async () => {
    if (isGuest()) {
      set({ agentStatus: MOCK_AGENT, usingMockData: true });
      return;
    }

    const businessId = getBusinessId();
    if (!businessId) {
      set({ agentStatus: EMPTY_AGENT, usingMockData: false });
      return;
    }

    try {
      set({ error: null });
      const status = await api.getAgentStatus(businessId);
      set({ agentStatus: status, usingMockData: false });
    } catch (err: any) {
      console.warn('[LeadsStore] fetchAgentStatus failed:', err.message);
      set({ agentStatus: EMPTY_AGENT, usingMockData: false });
    }
  },

  toggleAgent: async () => {
    const businessId = getBusinessId();
    if (!businessId) {
      set((s) => ({
        agentStatus: s.agentStatus
          ? { ...s.agentStatus, is_active: !s.agentStatus.is_active }
          : EMPTY_AGENT,
      }));
      return;
    }
    try {
      set({ error: null });
      const updated = await api.toggleAgent(businessId);
      set({ agentStatus: updated });
    } catch (err: any) {
      console.warn('[LeadsStore] toggleAgent failed:', err.message);
      set((s) => ({
        agentStatus: s.agentStatus
          ? { ...s.agentStatus, is_active: !s.agentStatus.is_active }
          : EMPTY_AGENT,
        error: 'Failed to toggle agent. Change may not persist.',
      }));
    }
  },

  updateLeadStatus: async (id, status) => {
    set((s) => ({ leads: s.leads.map((l) => l.id === id ? { ...l, status: status as Lead['status'] } : l) }));
    try {
      await updateLeadStatusInSupabase(id, status);
    } catch (err: any) {
      console.warn('[LeadsStore] Supabase status update failed, trying API:', err.message);
      try {
        await api.updateLeadStatus(id, status);
      } catch (apiErr: any) {
        console.warn('[LeadsStore] API status update also failed:', apiErr.message);
      }
    }
  },

  setFilter: (filter) => { set({ filter }); get().fetchLeads(filter); },

  refresh: async () => {
    set({ isRefreshing: true, error: null });
    await Promise.all([get().fetchLeads(), get().fetchDashboard(), get().fetchAgentStatus()]);
    set({ isRefreshing: false });
  },

  subscribeToRealtime: (businessId) => {
    const channel = supabase
      .channel('calls-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'calls', filter: `client_id=eq.${businessId}` },
        (payload) => {
          const call = payload.new as any;
          const newLead: Lead = {
            id: call.id,
            caller_name: call.caller_name || 'Unknown Caller',
            caller_phone: call.caller_phone || '',
            summary: call.transcript_summary || call.service_needed || call.notes || 'New call',
            status: call.status === 'converted' ? 'booked' : (call.status || 'new'),
            created_at: call.created_at,
            business_id: call.client_id || '',
          };
          set((s) => ({
            leads: [newLead, ...s.leads],
            dashboardStats: s.dashboardStats ? { ...s.dashboardStats, leads_today: s.dashboardStats.leads_today + 1 } : null,
          }));
        })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'calls', filter: `client_id=eq.${businessId}` },
        (payload) => {
          const call = payload.new as any;
          const updatedLead: Lead = {
            id: call.id,
            caller_name: call.caller_name || 'Unknown Caller',
            caller_phone: call.caller_phone || '',
            summary: call.transcript_summary || call.service_needed || call.notes || 'No summary',
            status: call.status === 'converted' ? 'booked' : (call.status || 'new'),
            created_at: call.created_at,
            business_id: call.client_id || '',
          };
          set((s) => ({
            leads: s.leads.map((l) => l.id === updatedLead.id ? updatedLead : l),
          }));
        })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  },
}));
