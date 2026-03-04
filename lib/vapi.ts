import { VAPI_API_KEY, VAPI_BASE_URL } from '../constants/config';
import { supabase } from './supabase';
import { getClientId } from './api';
import type { AgentConfig } from './api';

// ── Vapi Voice Mapping ──────────────────────────────────────

/** Map app voice IDs to Vapi voice provider + voiceId */
const VOICE_MAP: Record<string, { provider: string; voiceId: string }> = {
  professional_female: { provider: '11labs', voiceId: 'EXAVITQu4vr4xnSDxMaL' },  // Sarah
  professional_male:   { provider: '11labs', voiceId: 'pNInz6obpgDQGcFmaJgB' },  // Adam
  friendly_female:     { provider: '11labs', voiceId: 'MF3mGyEYCl7XYWbV9V6O' },  // Emily
  friendly_male:       { provider: '11labs', voiceId: 'bIHbv24MWmeRgasZH58o' },  // Will
  neutral:             { provider: '11labs', voiceId: 'onwK4e9ZLuTAKqWW03F9' },  // Daniel
};

/** Reverse: find app voice ID from Vapi voiceId */
function vapiVoiceToAppVoice(voiceId: string | undefined): string {
  if (!voiceId) return 'professional_female';
  for (const [appId, mapping] of Object.entries(VOICE_MAP)) {
    if (mapping.voiceId === voiceId) return appId;
  }
  return 'professional_female';
}

/** Map speaking speed to Vapi speed multiplier */
const SPEED_MAP: Record<string, number> = { slow: 0.85, normal: 1.0, fast: 1.2 };
function speedToMultiplier(speed: string): number { return SPEED_MAP[speed] || 1.0; }
function multiplierToSpeed(mult: number | undefined): 'slow' | 'normal' | 'fast' {
  if (!mult || mult >= 1.1) return mult && mult >= 1.1 ? 'fast' : 'normal';
  if (mult <= 0.9) return 'slow';
  return 'normal';
}

/** Map language setting to Vapi transcriber language */
const LANG_MAP: Record<string, string> = { en: 'en', es: 'es', both: 'multi' };
function langToVapi(lang: string): string { return LANG_MAP[lang] || 'en'; }
function vapiToLang(lang: string | undefined): 'en' | 'es' | 'both' {
  if (lang === 'es') return 'es';
  if (lang === 'multi') return 'both';
  return 'en';
}

// ── Vapi API Helpers ────────────────────────────────────────

export function isVapiConfigured(): boolean {
  return !!VAPI_API_KEY && VAPI_API_KEY !== '';
}

async function vapiRequest<T>(path: string, options: { method?: string; body?: any } = {}): Promise<T> {
  const { method = 'GET', body } = options;
  const res = await fetch(`${VAPI_BASE_URL}${path}`, {
    method,
    headers: {
      'Authorization': `Bearer ${VAPI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: `Vapi API ${res.status}` }));
    throw new Error(err.message || `Vapi API error: ${res.status}`);
  }
  return res.json();
}

// ── Get Assistant Config ────────────────────────────────────

export async function getAssistantConfig(assistantId: string): Promise<any> {
  return vapiRequest(`/assistant/${assistantId}`);
}

// ── Update Assistant Config ─────────────────────────────────

export async function updateAssistantConfig(assistantId: string, config: any): Promise<any> {
  return vapiRequest(`/assistant/${assistantId}`, { method: 'PATCH', body: config });
}

// ── Build System Prompt ─────────────────────────────────────

function buildSystemPrompt(config: AgentConfig, businessName?: string): string {
  const biz = businessName || '[Business Name]';
  const tone = config.personality <= 0.3
    ? 'professional and formal'
    : config.personality >= 0.7
    ? 'warm, friendly, and conversational'
    : 'polite and approachable';

  const captureFields = Object.entries(config.capture_fields)
    .filter(([_, enabled]) => enabled)
    .map(([field]) => field.replace('_', ' '))
    .join(', ');

  let prompt = `You are a ${tone} AI phone receptionist for ${biz}.\n\n`;
  prompt += `Your primary job is to help callers and capture their information.\n`;
  prompt += `Always try to collect: ${captureFields}.\n`;
  prompt += `Maximum call duration: ${config.max_call_duration} minutes.\n`;

  if (config.transfer_enabled && config.transfer_phone) {
    prompt += `If the caller has an emergency or asks to speak to a human, transfer them to ${config.transfer_phone}.\n`;
  }

  // Append FAQ knowledge
  if (config.faqs.length > 0) {
    prompt += '\n--- Frequently Asked Questions ---\n';
    for (const faq of config.faqs) {
      prompt += `Q: ${faq.question}\nA: ${faq.answer}\n\n`;
    }
  }

  return prompt.trim();
}

// ── Map App Config → Vapi Payload ───────────────────────────

export function mapConfigToVapiPayload(config: AgentConfig, businessName?: string): any {
  const voiceMapping = VOICE_MAP[config.voice] || VOICE_MAP.professional_female;

  return {
    voice: {
      provider: voiceMapping.provider,
      voiceId: voiceMapping.voiceId,
      speed: speedToMultiplier(config.speaking_speed),
    },
    firstMessage: config.greeting,
    model: {
      messages: [
        { role: 'system', content: buildSystemPrompt(config, businessName) },
      ],
    },
    transcriber: {
      language: langToVapi(config.language),
    },
    maxDurationSeconds: config.max_call_duration * 60,
    recordingEnabled: config.call_recording,
    ...(config.transfer_enabled && config.transfer_phone ? {
      forwardingPhoneNumber: config.transfer_phone.replace(/\D/g, ''),
    } : {}),
  };
}

// ── Map Vapi Response → App Config ──────────────────────────

export function mapVapiToAppConfig(assistant: any): Partial<AgentConfig> {
  return {
    voice: vapiVoiceToAppVoice(assistant.voice?.voiceId),
    speaking_speed: multiplierToSpeed(assistant.voice?.speed),
    greeting: assistant.firstMessage || '',
    language: vapiToLang(assistant.transcriber?.language),
    max_call_duration: assistant.maxDurationSeconds ? Math.round(assistant.maxDurationSeconds / 60) : 5,
    call_recording: assistant.recordingEnabled ?? true,
  };
}

// ── Supabase Client Settings ────────────────────────────────

/** Fetch the client row (includes vapi_assistant_id and agent settings) */
export async function getClientSettings(): Promise<{
  clientId: string;
  assistantId: string | null;
  settings: Partial<AgentConfig>;
} | null> {
  const clientId = await getClientId();
  if (!clientId) return null;

  const { data, error } = await supabase
    .from('clients')
    .select('id, vapi_assistant_id, agent_voice, agent_language, agent_personality, agent_greeting, agent_business_hours, business_name, transfer_number, transfer_enabled, auto_followup_enabled, faq_data')
    .eq('id', clientId)
    .single();

  if (error || !data) return null;

  // Parse business hours if stored as JSON string
  let businessHours: AgentConfig['business_hours'] | undefined;
  if (data.agent_business_hours) {
    try {
      businessHours = typeof data.agent_business_hours === 'string'
        ? JSON.parse(data.agent_business_hours)
        : data.agent_business_hours;
    } catch { /* ignore */ }
  }

  // Parse FAQs
  let faqs: AgentConfig['faqs'] = [];
  if (data.faq_data) {
    try {
      faqs = typeof data.faq_data === 'string' ? JSON.parse(data.faq_data) : data.faq_data;
    } catch { /* ignore */ }
  }

  return {
    clientId: data.id,
    assistantId: data.vapi_assistant_id || null,
    settings: {
      voice: data.agent_voice || undefined,
      language: (data.agent_language as any) || undefined,
      personality: data.agent_personality ? parseFloat(data.agent_personality) : undefined,
      greeting: data.agent_greeting || undefined,
      transfer_phone: data.transfer_number || undefined,
      transfer_enabled: data.transfer_enabled ?? false,
      ...(businessHours ? { business_hours: businessHours } : {}),
      faqs,
    },
  };
}

/** Save non-Vapi settings to the clients table */
export async function saveClientSettings(config: AgentConfig): Promise<void> {
  const clientId = await getClientId();
  if (!clientId) throw new Error('No client found');

  const { error } = await supabase
    .from('clients')
    .update({
      agent_voice: config.voice,
      agent_language: config.language,
      agent_personality: config.personality.toString(),
      agent_greeting: config.greeting,
      agent_business_hours: JSON.stringify(config.business_hours),
      transfer_number: config.transfer_phone || null,
      transfer_enabled: config.transfer_enabled,
      faq_data: config.faqs,
      updated_at: new Date().toISOString(),
    })
    .eq('id', clientId);

  if (error) throw error;
}

// ── Combined Save (Vapi + Supabase) ─────────────────────────

export interface SaveResult {
  vapiSaved: boolean;
  supabaseSaved: boolean;
  vapiError?: string;
  supabaseError?: string;
}

export async function saveAgentConfig(config: AgentConfig): Promise<SaveResult> {
  const result: SaveResult = { vapiSaved: false, supabaseSaved: false };

  // 1. Save to Supabase (always attempt)
  try {
    await saveClientSettings(config);
    result.supabaseSaved = true;
  } catch (err: any) {
    result.supabaseError = err.message;
    console.warn('[Vapi] Supabase save failed:', err.message);
  }

  // 2. Save to Vapi API (only if configured)
  if (!isVapiConfigured()) {
    result.vapiError = 'Vapi API key not configured';
    return result;
  }

  try {
    const clientSettings = await getClientSettings();
    if (!clientSettings?.assistantId) {
      result.vapiError = 'No Vapi assistant ID found for this client';
      return result;
    }

    const clientRow = await supabase
      .from('clients')
      .select('business_name')
      .eq('id', clientSettings.clientId)
      .single();

    const payload = mapConfigToVapiPayload(config, clientRow.data?.business_name);
    await updateAssistantConfig(clientSettings.assistantId, payload);
    result.vapiSaved = true;
  } catch (err: any) {
    result.vapiError = err.message;
    console.warn('[Vapi] API save failed:', err.message);
  }

  return result;
}

// ── Combined Load (Vapi + Supabase) ─────────────────────────

export async function loadAgentConfig(): Promise<{
  config: Partial<AgentConfig>;
  source: 'vapi+supabase' | 'supabase' | 'defaults';
  assistantId: string | null;
}> {
  // 1. Try Supabase first (always available)
  let clientSettings: Awaited<ReturnType<typeof getClientSettings>> = null;
  try {
    clientSettings = await getClientSettings();
  } catch (err: any) {
    console.warn('[Vapi] Failed to load client settings:', err.message);
  }

  const supabaseConfig = clientSettings?.settings || {};
  const assistantId = clientSettings?.assistantId || null;

  // 2. Try Vapi API if configured and assistant ID available
  if (isVapiConfigured() && assistantId) {
    try {
      const assistant = await getAssistantConfig(assistantId);
      const vapiConfig = mapVapiToAppConfig(assistant);
      return {
        config: { ...supabaseConfig, ...vapiConfig },
        source: 'vapi+supabase',
        assistantId,
      };
    } catch (err: any) {
      console.warn('[Vapi] Failed to load assistant config:', err.message);
    }
  }

  // 3. Return Supabase-only or defaults
  if (Object.keys(supabaseConfig).length > 0) {
    return { config: supabaseConfig, source: 'supabase', assistantId };
  }

  return { config: {}, source: 'defaults', assistantId };
}
