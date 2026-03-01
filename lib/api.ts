import { getCurrentSession } from './supabase';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'https://conduit-backend-production.up.railway.app';

class ApiClient {
  private baseUrl: string;
  constructor(baseUrl: string) { this.baseUrl = baseUrl; }

  private async getHeaders(): Promise<Record<string, string>> {
    const session = await getCurrentSession();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;
    return headers;
  }

  async request<T>(endpoint: string, options: { method?: string; body?: any; params?: Record<string, string> } = {}): Promise<T> {
    const { method = 'GET', body, params } = options;
    const headers = await this.getHeaders();
    let url = `${this.baseUrl}${endpoint}`;
    if (params) url += `?${new URLSearchParams(params).toString()}`;
    const response = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(error.detail || `API Error: ${response.status}`);
    }
    return response.json();
  }

  async getLeads(filters?: { period?: string }) { return this.request<Lead[]>('/api/v1/leads', { params: filters as any }); }
  async getLead(id: string) { return this.request<LeadDetail>(`/api/v1/leads/${id}`); }
  async updateLeadStatus(id: string, status: string) { return this.request(`/api/v1/leads/${id}/status`, { method: 'PATCH', body: { status } }); }
  async getDashboardStats() { return this.request<DashboardStats>('/api/v1/analytics'); }
  async getAgentStatus() { return this.request<AgentStatus>('/api/v1/agent/status'); }
  async registerPushToken(token: string, platform: string) { return this.request('/api/v1/notifications/register', { method: 'POST', body: { push_token: token, platform } }); }
}

export interface Lead {
  id: string; caller_name: string; caller_phone: string; summary: string;
  status: 'new' | 'contacted' | 'booked' | 'lost'; created_at: string; business_id: string;
}
export interface LeadDetail extends Lead {
  transcript: string; recording_url?: string; caller_email?: string; notes?: string;
}
export interface DashboardStats {
  leads_today: number; leads_this_week: number; leads_this_month: number;
  revenue_saved: number; capture_rate: number;
}
export interface AgentStatus {
  is_active: boolean; agent_name: string; phone_number: string;
  last_call_at?: string; total_calls_handled: number;
}

export const api = new ApiClient(BACKEND_URL);
