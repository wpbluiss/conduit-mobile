import { getCurrentSession, supabase } from './supabase';

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

  // Real FastAPI endpoints using business_id
  async getLeads(businessId: string, filters?: { period?: string }) {
    return this.request<Lead[]>(`/api/leads/${businessId}`, { params: filters as any });
  }
  async getLead(id: string) {
    return this.request<LeadDetail>(`/api/leads/detail/${id}`);
  }
  async updateLeadStatus(id: string, status: string) {
    return this.request(`/api/leads/${id}/status`, { method: 'PATCH', body: { status } });
  }
  async getDashboardStats(businessId: string) {
    return this.request<DashboardStats>(`/api/dashboard/${businessId}`);
  }
  async getAgentStatus(businessId: string) {
    return this.request<AgentStatus>(`/api/agent/${businessId}/status`);
  }
  async toggleAgent(businessId: string) {
    return this.request<AgentStatus>(`/api/agent/${businessId}/toggle`, { method: 'POST' });
  }
  async registerPushToken(token: string, platform: string) {
    return this.request('/api/notifications/register', { method: 'POST', body: { push_token: token, platform } });
  }
  async registerDevice(expoPushToken: string, userId: string, platform: string) {
    return this.request('/api/v1/devices/register', {
      method: 'POST',
      body: { expo_push_token: expoPushToken, user_id: userId, platform },
    });
  }
  async getAffiliateStats() {
    return this.request<AffiliateStats>('/api/v1/affiliates/stats');
  }
  async getCallDetails(id: string) {
    return this.request<CallDetails>(`/api/v1/calls/${id}`);
  }
  async getAgentConfig() {
    return this.request<AgentConfig>('/api/v1/agent/config');
  }
  async updateAgentConfig(config: AgentConfig) {
    return this.request<AgentConfig>('/api/v1/agent/config', { method: 'PUT', body: config });
  }
  async getUserProfile() {
    return this.request<UserProfile>('/api/v1/profile');
  }
  async updateUserProfile(data: Partial<UserProfile>) {
    return this.request<UserProfile>('/api/v1/profile', { method: 'PUT', body: data });
  }
  async getInvoices() {
    return this.request<Invoice[]>('/api/v1/billing/invoices');
  }
  async getConversations() {
    return this.request<Conversation[]>('/api/v1/messages');
  }
  async getConversationMessages(conversationId: string) {
    return this.request<Message[]>(`/api/v1/messages/${conversationId}`);
  }
  async sendMessage(conversationId: string, text: string) {
    return this.request<Message>(`/api/v1/messages/${conversationId}`, {
      method: 'POST',
      body: { text },
    });
  }
  async getRevenueDashboard() {
    return this.request<RevenueDashboard>('/api/v1/revenue/dashboard');
  }
  async getBookings() {
    return this.request<Booking[]>('/api/v1/bookings');
  }
  async createBooking(booking: Omit<Booking, 'id' | 'status' | 'source'>) {
    return this.request<Booking>('/api/v1/bookings', { method: 'POST', body: booking });
  }
  async updateBooking(id: string, status: Booking['status']) {
    return this.request<Booking>(`/api/v1/bookings/${id}`, { method: 'PATCH', body: { status } });
  }
  async getPayments() {
    return this.request<PaymentOverview>('/api/v1/payments');
  }
  async getPaymentSettings() {
    return this.request<PaymentSettings>('/api/v1/payments/settings');
  }
  async updatePaymentSettings(settings: Partial<PaymentSettings>) {
    return this.request<PaymentSettings>('/api/v1/payments/settings', { method: 'PUT', body: settings });
  }
  async getLocations() {
    return this.request<Location[]>('/api/v1/locations');
  }
  async createLocation(data: Omit<Location, 'id' | 'agent_status' | 'calls_today' | 'leads_today' | 'active_hours' | 'last_call_at' | 'agent_voice' | 'agent_personality'>) {
    return this.request<Location>('/api/v1/locations', { method: 'POST', body: data });
  }
  async getReviews() {
    return this.request<ReviewsData>('/api/v1/reviews');
  }
  async getReviewSettings() {
    return this.request<ReviewSettings>('/api/v1/reviews/settings');
  }
  async updateReviewSettings(settings: Partial<ReviewSettings>) {
    return this.request<ReviewSettings>('/api/v1/reviews/settings', { method: 'PUT', body: settings });
  }
  async replyToReview(id: string, text: string) {
    return this.request<Review>(`/api/v1/reviews/${id}/reply`, { method: 'POST', body: { text } });
  }
  async deleteAccount() {
    return this.request('/api/v1/account', { method: 'DELETE' });
  }
  async exportData() {
    return this.request<{ download_url: string }>('/api/v1/account/export', { method: 'POST' });
  }
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

export interface AffiliateReferral {
  id: string; name: string; email: string; date: string;
  plan: 'solo' | 'business' | 'professional' | 'enterprise'; status: 'active' | 'trial' | 'churned';
  commission: number;
}

export interface AffiliateStats {
  referral_code: string;
  total_referrals: number;
  active_subscriptions: number;
  total_earned: number;
  next_payout_amount: number;
  next_payout_date: string;
  referrals: AffiliateReferral[];
}

export interface AgentConfig {
  is_active: boolean;
  voice: string;
  personality: number;
  speaking_speed: 'slow' | 'normal' | 'fast';
  greeting: string;
  after_hours_greeting: string;
  language: 'en' | 'es' | 'both';
  business_hours: Record<string, { enabled: boolean; start: string; end: string }>;
  after_hours_behavior: 'take_message' | 'transfer' | 'book_appointment' | 'custom_response';
  capture_fields: Record<string, boolean>;
  max_call_duration: number;
  transfer_enabled: boolean;
  transfer_phone: string;
  call_recording: boolean;
  faqs: { question: string; answer: string }[];
  push_on_new_lead: boolean;
  daily_summary: boolean;
  weekly_report: boolean;
  offline_alert: boolean;
}

export interface UserProfile {
  id: string;
  owner_name: string;
  email: string;
  business_name: string;
  phone: string;
  avatar_url?: string;
  plan: 'free' | 'solo' | 'business' | 'professional' | 'enterprise';
  plan_status: 'active' | 'trial' | 'past_due' | 'cancelled';
  trial_ends_at?: string;
  created_at: string;
}

export interface Invoice {
  id: string;
  date: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
  description: string;
}

export interface Conversation {
  id: string;
  contact_name: string;
  contact_phone: string;
  last_message: string;
  last_message_at: string;
  unread: boolean;
  source: 'auto' | 'manual';
  message_count: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  text: string;
  direction: 'inbound' | 'outbound';
  source: 'auto' | 'manual';
  created_at: string;
}

export interface Transaction {
  id: string;
  customer_name: string;
  amount: number;
  type: 'deposit' | 'no_show_fee' | 'payment' | 'refund';
  status: 'completed' | 'pending' | 'failed';
  created_at: string;
}

export interface PaymentSettings {
  stripe_connected: boolean;
  capture_deposits: boolean;
  deposit_amount: number;
  no_show_fees: boolean;
  no_show_fee_amount: number;
  send_payment_link: boolean;
  payment_link_amount: number | null;
}

export interface PaymentOverview {
  total_collected: number;
  pending_deposits: number;
  this_month: number;
  transactions: Transaction[];
  next_payout_amount: number;
  next_payout_date: string;
  bank_last4: string;
  bank_name: string;
  payout_history: { date: string; amount: number }[];
}

export interface Booking {
  id: string;
  client_name: string;
  client_phone: string;
  service: string;
  date: string;
  time: string;
  duration: number;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
  source: 'ai' | 'manual';
  notes?: string;
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  status: 'unlocked' | 'in_progress' | 'locked';
  icon: string;
}

export interface RevenueDashboard {
  total_revenue_saved: number;
  signup_date: string;
  leads_captured: number;
  calls_handled: number;
  avg_lead_value: number;
  roi_multiplier: number;
  subscription_cost: number;
  milestones: Milestone[];
  current_streak: number;
  best_streak: number;
  streak_week: boolean[];
  weekly_leads: { day: string; count: number }[];
  this_month: { leads: number; revenue: number; calls: number; conversion_rate: number };
  last_month: { leads: number; revenue: number; calls: number; conversion_rate: number };
}

export interface TranscriptMessage {
  speaker: 'ai' | 'caller';
  text: string;
  timestamp: number;
}

export interface CallDetails {
  id: string;
  caller_name: string;
  caller_phone: string;
  service_requested: string;
  status: 'captured' | 'missed' | 'in_progress';
  created_at: string;
  duration: number;
  audio_url?: string;
  lead_id?: string;
  transcript: TranscriptMessage[];
  ai_performance: {
    response_time: number;
    sentiment: 'positive' | 'neutral' | 'negative';
    lead_quality: number;
    captured_fields: string[];
  };
}

export interface Location {
  id: string;
  name: string;
  address: string;
  phone: string;
  business_type: string;
  agent_status: 'active' | 'inactive';
  calls_today: number;
  leads_today: number;
  active_hours: string;
  business_hours: Record<string, { enabled: boolean; start: string; end: string }>;
  agent_voice: string;
  agent_personality: number;
  last_call_at?: string;
}

export interface Review {
  id: string;
  reviewer_name: string;
  rating: number;
  text: string;
  source: 'google' | 'yelp' | 'facebook';
  created_at: string;
  reply?: string;
  ai_suggested_reply: string;
}

export interface ReviewsData {
  average_rating: number;
  total_reviews: number;
  rating_distribution: { stars: number; percentage: number }[];
  area_percentile: number;
  reviews: Review[];
  insights: {
    positive_keywords: string[];
    negative_keywords: string[];
    sentiment_trend: number[];
  };
  requests_sent_this_month: number;
  reviews_received_this_month: number;
  conversion_rate: number;
}

export interface ReviewSettings {
  auto_request_enabled: boolean;
  send_after_hours: 1 | 24 | 48;
  platforms: { google: boolean; yelp: boolean; facebook: boolean };
  message_template: string;
}

export const api = new ApiClient(BACKEND_URL);

// ── Direct Supabase Queries ────────────────────────────────────

/** Get the client_id for the currently logged-in user */
async function getClientId(): Promise<string | null> {
  const session = await getCurrentSession();
  if (!session?.user?.id) return null;
  const { data, error } = await supabase
    .from('clients')
    .select('id')
    .eq('user_id', session.user.id)
    .limit(1)
    .single();
  if (error || !data) return null;
  return data.id;
}

/** Map a Supabase `calls` row to the app's Lead interface */
function mapCallToLead(call: any): Lead {
  return {
    id: call.id,
    caller_name: call.caller_name || 'Unknown Caller',
    caller_phone: call.caller_phone || '',
    summary: call.transcript_summary || call.service_needed || call.notes || 'No summary available',
    status: call.status === 'converted' ? 'booked' : (call.status || 'new'),
    created_at: call.created_at,
    business_id: call.client_id || '',
  };
}

/** Map a Supabase `calls` row to the app's LeadDetail interface */
function mapCallToLeadDetail(call: any): LeadDetail {
  return {
    ...mapCallToLead(call),
    transcript: call.transcript || '',
    recording_url: call.recording_url || undefined,
    caller_email: call.caller_email || undefined,
    notes: call.notes || undefined,
  };
}

/** Fetch all leads from Supabase `calls` table, sorted by created_at desc */
export async function getLeadsFromSupabase(): Promise<Lead[]> {
  const clientId = await getClientId();
  if (!clientId) return [];
  const { data, error } = await supabase
    .from('calls')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapCallToLead);
}

/** Fetch a single lead detail from Supabase */
export async function getLeadDetailFromSupabase(id: string): Promise<LeadDetail | null> {
  const { data, error } = await supabase
    .from('calls')
    .select('*')
    .eq('id', id)
    .single();
  if (error || !data) return null;
  return mapCallToLeadDetail(data);
}

/** Build dashboard stats from Supabase data */
export async function getDashboardStatsFromSupabase(): Promise<DashboardStats | null> {
  const clientId = await getClientId();
  if (!clientId) return null;

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay()).toISOString();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [todayRes, weekRes, monthRes, clientRes] = await Promise.all([
    supabase.from('calls').select('*', { count: 'exact', head: true }).eq('client_id', clientId).gte('created_at', startOfDay),
    supabase.from('calls').select('*', { count: 'exact', head: true }).eq('client_id', clientId).gte('created_at', startOfWeek),
    supabase.from('calls').select('*', { count: 'exact', head: true }).eq('client_id', clientId).gte('created_at', startOfMonth),
    supabase.from('clients').select('avg_job_value, revenue_recovered').eq('id', clientId).single(),
  ]);

  const leadsToday = todayRes.count || 0;
  const leadsThisWeek = weekRes.count || 0;
  const leadsThisMonth = monthRes.count || 0;
  const avgJobValue = Number(clientRes.data?.avg_job_value) || 27;
  const revenueSaved = Number(clientRes.data?.revenue_recovered) || leadsThisMonth * avgJobValue;

  // Calculate capture rate from converted vs total
  const { count: convertedCount } = await supabase
    .from('calls')
    .select('*', { count: 'exact', head: true })
    .eq('client_id', clientId)
    .in('status', ['converted', 'contacted']);
  const { count: totalCount } = await supabase
    .from('calls')
    .select('*', { count: 'exact', head: true })
    .eq('client_id', clientId);
  const captureRate = totalCount ? Math.round(((convertedCount || 0) / totalCount) * 100) : 0;

  return {
    leads_today: leadsToday,
    leads_this_week: leadsThisWeek,
    leads_this_month: leadsThisMonth,
    revenue_saved: revenueSaved,
    capture_rate: captureRate,
  };
}

/** Update lead status in Supabase (maps 'booked' back to 'converted') */
export async function updateLeadStatusInSupabase(id: string, status: string): Promise<void> {
  const dbStatus = status === 'booked' ? 'converted' : status;
  const { error } = await supabase
    .from('calls')
    .update({ status: dbStatus })
    .eq('id', id);
  if (error) throw error;
}

/** Get the client_id (exported for realtime subscription) */
export { getClientId };
