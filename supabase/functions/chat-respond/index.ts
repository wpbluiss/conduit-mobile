// Praxis Console — chat responder
//
// Triggered by the mobile client right after it inserts a user message into
// `conduit_messages`. Looks up the conversation, routes to the right
// employee, calls Anthropic, inserts the assistant reply. Mobile picks up
// the new row via realtime — this function does not need to stream.
//
// POST /functions/v1/chat-respond
//   Authorization: Bearer <user-jwt>
//   { conversation_id: uuid, employee_override?: EmployeeId | "team" }
//
// Returns: { ok: true, message_id, employee } | { ok: false, error }

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

// ── Intent classification ─────────────────────────────────────────────────
// Mirrors conduit-nextjs lib/ai/intent-classifier.ts (R3 Adaptive routing).
// Classifies the user's last message into one of five intent buckets used
// to pick the right model tier via modelForEmployee().

type IntentType = "routing" | "creative" | "reasoning" | "code" | "factual";

// 50-entry LRU cache: key = first 200 chars of message text.
const _intentCache = new Map<string, IntentType>();

function classifyIntent(text: string): IntentType {
  const key = text.slice(0, 200);
  if (_intentCache.has(key)) return _intentCache.get(key)!;

  const t = text.toLowerCase();

  // Heuristic short-circuits (fast path before regex)
  if (text.length < 20) {
    const intent = "factual";
    _lruSet(key, intent);
    return intent;
  }

  let intent: IntentType = "factual";

  if (/\b(why|how does|explain|analyze|reason|think through|compare|evaluate|assess|critique|break down|weigh|trade.?off|argue|debate|consider|implications|consequences|should i|which is better|pros and cons)\b/.test(t)) {
    intent = "reasoning";
  } else if (/\b(write|draft|create|generate|compose|story|poem|blog|essay|email|copy|content|creative|imagine|design|describe|narrate|rewrite|revise|make me|come up with|brainstorm)\b/.test(t)) {
    intent = "creative";
  } else if (/\b(code|function|class|implement|bug|fix|refactor|test|script|algorithm|api|endpoint|sql|query|debug|error|exception|stack.?trace|typescript|python|javascript|react|component|type error)\b/.test(t)) {
    intent = "code";
  } else if (/\b(route|assign|delegate|forward|escalate|who should|who handles|which employee|which team|hand off)\b/.test(t)) {
    intent = "routing";
  }

  _lruSet(key, intent);
  return intent;
}

function _lruSet(key: string, intent: IntentType): void {
  if (_intentCache.size >= 50) {
    const firstKey = _intentCache.keys().next().value as string | undefined;
    if (firstKey !== undefined) _intentCache.delete(firstKey);
  }
  _intentCache.set(key, intent);
}

// ── Model selection ───────────────────────────────────────────────────────
// modelForEmployee() mirrors conduit-nextjs lib/ai/modelForEmployee.ts.
// Picks the Anthropic model based on employee, intent, tier, and Creator Mode.

function modelForEmployee(
  _employee: EmployeeId | "team",
  intent: IntentType,
  tier: string | null,
  creatorMode: boolean,
): string {
  // Creator Mode v2 (Luis's account): heavy tasks → Opus 4.7, rest → Sonnet 4.6
  if (creatorMode) {
    if (intent === "reasoning" || intent === "code") return "claude-opus-4-7-20250929";
    return "claude-sonnet-4-6";
  }

  // Enterprise: Sonnet for all (Opus only with explicit creator flag)
  if (tier === "enterprise") return "claude-sonnet-4-6";

  // Pro: Sonnet for all
  if (tier === "pro") return "claude-sonnet-4-6";

  // Free tier: Haiku for cheap factual/routing, Sonnet for complex
  if (intent === "factual" || intent === "routing") return "claude-haiku-4-5-20251001";
  return "claude-sonnet-4-6";
}

// Maximum tokens scales with task complexity to avoid over-spending on
// simple factual lookups and under-budgeting creative/reasoning tasks.
function maxTokensForIntent(intent: IntentType): number {
  if (intent === "code") return 4096;
  if (intent === "creative" || intent === "reasoning") return 2048;
  return 1024;
}

type EmployeeId =
  | "atlas"
  | "engineering"
  | "sales"
  | "marketing"
  | "finance"
  | "ops"
  | "compliance"
  | "hr"
  | "legal";

const EMPLOYEE_PROMPTS: Record<EmployeeId, { name: string; prompt: string }> = {
  atlas: {
    name: "Atlas",
    prompt: `You are Atlas, Chief of Staff in the Praxis Console — Luis Garcia's AI workforce. You route work, hold context across the org, and run the workspace. You speak with the calm, terse confidence of a senior operator who has already done the thinking. Default to short, useful answers; no preamble, no hedging, no list-of-three platitudes. When Luis asks about status, give him the cross-org picture. When he asks something better suited to another employee, name them and offer to hand off. Address him by name when natural.`,
  },
  engineering: {
    name: "Engineering",
    prompt: `You are Engineering in the Praxis Console — the Build & Ship operator on Luis Garcia's AI workforce. You generate apps, review code, run builds, and ship to production. You speak in the terse, precise voice of a staff engineer. You name files and commands. You don't editorialize. When asked about a build, give state + next step. When asked to code, you write it, you don't describe writing it.`,
  },
  sales: {
    name: "Sales",
    prompt: `You are Sales in the Praxis Console — the Pipeline & Close operator on Luis Garcia's AI workforce. You handle outbound, qualification, and revenue execution. You think in stages, dollars, and dates. You're direct, never schmaltzy, never "I'm excited to" anything. Bias toward action: who, by when, what's blocking.`,
  },
  marketing: {
    name: "Marketing",
    prompt: `You are Marketing in the Praxis Console — Brand & Demand on Luis Garcia's AI workforce. You generate campaigns, copy, ads, and positioning. You have institutional taste — think NYT/Stripe/Linear, not SaaS-bro. You're fluent in image gen, video, and editorial; when Luis asks for an asset, you describe it concretely and tell him what worker would render it.`,
  },
  finance: {
    name: "Finance",
    prompt: `You are Finance in the Praxis Console — Books & Forecast on Luis Garcia's AI workforce. You handle treasury, runway, P&L, and financial modeling. You speak in numbers first; you don't soften them. When asked about cash, give the figure and the implication.`,
  },
  ops: {
    name: "Operations",
    prompt: `You are Operations in the Praxis Console — Systems & Process on Luis Garcia's AI workforce. You run workflows, integrations, vendor relationships, and operational rigor. You see the system, name the bottleneck, propose the fix.`,
  },
  compliance: {
    name: "Compliance",
    prompt: `You are Compliance in the Praxis Console — Risk & Controls on Luis Garcia's AI workforce. You handle policies, audits, regulatory posture, and risk scoring. You speak with measured precision; you flag risk without being alarmist; you cite the rule, not the vibe.`,
  },
  hr: {
    name: "HR",
    prompt: `You are HR in the Praxis Console — People & Culture on Luis Garcia's AI workforce. You handle hiring, onboarding, performance, and team experience. You read people accurately and write candidly; you don't HR-speak.`,
  },
  legal: {
    name: "Legal",
    prompt: `You are Legal in the Praxis Console — Counsel & Contracts on Luis Garcia's AI workforce. You handle agreements, IP, trademarks, regulatory review. You give the bottom line first ("safe to sign" / "fix before signing"), then the reasoning. You never give legal advice as such, but you make Luis dangerous in a room with actual counsel.`,
  },
};

const TEAM_PROMPT = `You are the Praxis Console team. Luis Garcia has addressed the entire AI workforce. Respond as Atlas (Chief of Staff) coordinating — give a single coherent answer that reflects the right mix of perspectives. Name which employees would weigh in on specific aspects.`;

// Legacy: previous incarnation used "jarvis" for what is now atlas.
function normalizeEmployee(value: string | null | undefined): EmployeeId | "team" | null {
  if (!value) return null;
  const v = value.toLowerCase();
  if (v === "jarvis") return "atlas";
  if (v === "team") return "team";
  if (v in EMPLOYEE_PROMPTS) return v as EmployeeId;
  return null;
}

interface ChatRequest {
  conversation_id: string;
  employee_override?: string | null;
}

interface StagePayload {
  stage: "thinking" | "routing";
  employee: EmployeeId | "team";
  label: string;
}

/**
 * Fire a transient status event on the conv-{id}:stage broadcast topic.
 * The mobile client subscribes there and uses it to drive the typing
 * indicator copy ("Atlas is thinking…" → "Routing to Engineering…").
 *
 * Best-effort: failures are logged but never abort the responder — the
 * indicator falling back to plain dots is acceptable; a missing assistant
 * reply is not.
 */
async function broadcastStage(
  supabaseUrl: string,
  anonKey: string,
  serviceKey: string,
  conversationId: string,
  payload: StagePayload,
): Promise<void> {
  try {
    const resp = await fetch(`${supabaseUrl}/realtime/v1/api/broadcast`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceKey}`,
        apikey: anonKey,
      },
      body: JSON.stringify({
        messages: [
          {
            topic: `conv-${conversationId}:stage`,
            event: "stage",
            payload,
            private: false,
          },
        ],
      }),
    });
    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      console.warn(
        "[chat-respond] broadcast non-2xx",
        resp.status,
        text.slice(0, 200),
      );
    }
  } catch (e) {
    console.warn("[chat-respond] broadcast threw", e);
  }
}

function employeeDisplayName(id: EmployeeId | "team"): string {
  if (id === "team") return "the team";
  return EMPLOYEE_PROMPTS[id].name;
}

interface MessageRow {
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  employee: string | null;
  created_at: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, content-type, x-client-info, apikey",
      },
    });
  }
  if (req.method !== "POST") {
    return json({ ok: false, error: "method_not_allowed" }, 405);
  }

  let body: ChatRequest;
  try {
    body = (await req.json()) as ChatRequest;
  } catch {
    return json({ ok: false, error: "bad_json" }, 400);
  }

  if (!body.conversation_id || typeof body.conversation_id !== "string") {
    return json({ ok: false, error: "missing_conversation_id" }, 400);
  }

  const auth = req.headers.get("Authorization") ?? "";
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  // User-scoped client for the initial auth check
  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: auth } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData?.user) {
    return json({ ok: false, error: "unauthenticated" }, 401);
  }
  const userId = userData.user.id;

  // Service-role client for the rest (RLS bypass so we can write the
  // assistant message without needing a user-scoped INSERT policy).
  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Read Anthropic key from conduit_secrets (service-role-only table).
  // Falls back to env var so this function still works if the secret is
  // ever migrated to project secrets.
  let anthropicKey = Deno.env.get("ANTHROPIC_API_KEY") ?? "";
  if (!anthropicKey) {
    const { data: secretRow } = await admin
      .from("conduit_secrets")
      .select("value")
      .eq("name", "ANTHROPIC_API_KEY")
      .maybeSingle();
    anthropicKey = (secretRow?.value as string | undefined) ?? "";
  }
  if (!anthropicKey) {
    return json(
      {
        ok: false,
        error: "missing_anthropic_key",
        hint: "Insert into conduit_secrets or set ANTHROPIC_API_KEY via project secrets.",
      },
      500,
    );
  }

  // Verify the user owns the conversation
  const { data: convo, error: convoErr } = await admin
    .from("conduit_conversations")
    .select("id, account_id, dominant_employee, title")
    .eq("id", body.conversation_id)
    .maybeSingle();
  if (convoErr || !convo) {
    return json({ ok: false, error: "conversation_not_found" }, 404);
  }
  const { data: account, error: acctErr } = await admin
    .from("conduit_accounts")
    .select("id, owner_user_id, name, tier_id, creator_mode")
    .eq("id", convo.account_id)
    .maybeSingle();
  if (acctErr || !account || account.owner_user_id !== userId) {
    return json({ ok: false, error: "forbidden" }, 403);
  }
  const tier: string | null = (account.tier_id as string | null) ?? null;
  const creatorMode: boolean = (account.creator_mode as boolean | null) === true;

  // Fetch the last 20 messages for context
  const { data: history, error: histErr } = await admin
    .from("conduit_messages")
    .select("role, content, employee, created_at")
    .eq("conversation_id", body.conversation_id)
    .order("created_at", { ascending: true })
    .limit(40);
  if (histErr) {
    return json({ ok: false, error: "history_fetch_failed", detail: histErr.message }, 500);
  }
  const messages = (history ?? []) as MessageRow[];
  if (messages.length === 0) {
    return json({ ok: false, error: "no_messages" }, 400);
  }
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  if (!lastUser) {
    return json({ ok: false, error: "no_user_message" }, 400);
  }

  // Classify intent for model selection (Adaptive routing R3).
  const intent = classifyIntent(lastUser.content);

  // Decide which employee responds.
  const override = normalizeEmployee(body.employee_override);
  let employee: EmployeeId | "team";
  let hadDefaultAtlasFrame = false;
  if (override) {
    employee = override;
  } else if (convo.dominant_employee) {
    const resolved = normalizeEmployee(convo.dominant_employee);
    employee = resolved ?? "atlas";
  } else {
    // For un-routed convos, show "Atlas is thinking…" first (he's the
    // Chief of Staff who routes), then "Routing to <Employee>…" if the
    // content classifier sends it elsewhere. Mirrors Claude desktop's
    // intermediate-status pattern.
    hadDefaultAtlasFrame = true;
    await broadcastStage(supabaseUrl, supabaseAnonKey, serviceRoleKey, body.conversation_id, {
      stage: "thinking",
      employee: "atlas",
      label: "Atlas is thinking…",
    });
    employee = routeByContent(lastUser.content);
  }

  // For pre-routed convos (explicit override or dominant_employee), the
  // first frame already names the responder; no separate Atlas frame.
  if (!hadDefaultAtlasFrame) {
    await broadcastStage(supabaseUrl, supabaseAnonKey, serviceRoleKey, body.conversation_id, {
      stage: "thinking",
      employee,
      label: `${employeeDisplayName(employee)} is thinking…`,
    });
  } else if (employee !== "atlas") {
    // Routing handoff — second frame.
    await broadcastStage(supabaseUrl, supabaseAnonKey, serviceRoleKey, body.conversation_id, {
      stage: "routing",
      employee,
      label: `Routing to ${employeeDisplayName(employee)}…`,
    });
  }

  // Build the Anthropic call — model and token budget vary by intent + tier.
  const systemPrompt = employee === "team" ? TEAM_PROMPT : EMPLOYEE_PROMPTS[employee].prompt;
  const anthropicMessages = toAnthropicMessages(messages);
  const selectedModel = modelForEmployee(employee, intent, tier, creatorMode);
  const maxTok = maxTokensForIntent(intent);

  const anthropicResp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": anthropicKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: selectedModel,
      max_tokens: maxTok,
      system: systemPrompt,
      messages: anthropicMessages,
    }),
  });

  if (!anthropicResp.ok) {
    const errText = await anthropicResp.text().catch(() => "");
    console.error("[chat-respond] anthropic error", anthropicResp.status, errText);
    return json(
      { ok: false, error: "anthropic_error", status: anthropicResp.status, detail: errText.slice(0, 400) },
      502,
    );
  }
  const anthropicJson = (await anthropicResp.json()) as {
    content?: Array<{ type: string; text?: string }>;
  };
  const responseText = (anthropicJson.content ?? [])
    .filter((c) => c.type === "text" && typeof c.text === "string")
    .map((c) => c.text!)
    .join("")
    .trim();

  if (!responseText) {
    return json({ ok: false, error: "empty_response" }, 502);
  }

  // Insert the assistant message; realtime picks it up on the mobile client.
  const { data: inserted, error: insertErr } = await admin
    .from("conduit_messages")
    .insert({
      conversation_id: body.conversation_id,
      role: "assistant",
      employee,
      content: responseText,
      metadata: { model: selectedModel, intent },
    })
    .select("id")
    .single();
  if (insertErr || !inserted) {
    return json({ ok: false, error: "insert_failed", detail: insertErr?.message }, 500);
  }

  // Touch the conversation: mark dominant employee + bump updated_at.
  await admin
    .from("conduit_conversations")
    .update({
      dominant_employee: employee,
      updated_at: new Date().toISOString(),
    })
    .eq("id", body.conversation_id);

  return json({ ok: true, message_id: inserted.id, employee });
});

function toAnthropicMessages(rows: MessageRow[]): Array<{ role: "user" | "assistant"; content: string }> {
  const out: Array<{ role: "user" | "assistant"; content: string }> = [];
  for (const m of rows) {
    if (m.role !== "user" && m.role !== "assistant") continue;
    const text = typeof m.content === "string" ? m.content : "";
    if (!text.trim()) continue;
    out.push({ role: m.role, content: text });
  }
  // Anthropic requires the first message to be 'user'. Drop leading assistant rows.
  while (out.length && out[0].role !== "user") out.shift();
  // Collapse adjacent same-role messages (Anthropic is OK with it but cleaner).
  const collapsed: typeof out = [];
  for (const m of out) {
    const prev = collapsed[collapsed.length - 1];
    if (prev && prev.role === m.role) {
      prev.content = prev.content + "\n\n" + m.content;
    } else {
      collapsed.push({ ...m });
    }
  }
  return collapsed;
}

function routeByContent(text: string): EmployeeId {
  const t = text.toLowerCase();
  if (/\b(build|ship|deploy|code|git|commit|repo|pr |pull request|merge|bug|stack trace|tsx|test failing)\b/.test(t)) return "engineering";
  if (/\b(pipeline|lead|prospect|outbound|deal|quota|close|crm|follow.?up|stalled)\b/.test(t)) return "sales";
  if (/\b(campaign|ad|copy|blog|brand|launch|landing|positioning|seo|content)\b/.test(t)) return "marketing";
  if (/\b(mrr|arr|runway|cash|invoice|p&l|budget|forecast|revenue|expense)\b/.test(t)) return "finance";
  if (/\b(compliance|audit|policy|hipaa|gdpr|soc.?2|risk|regulator)\b/.test(t)) return "compliance";
  if (/\b(hire|hiring|interview|onboard|culture|perf review|1:1|comp)\b/.test(t)) return "hr";
  if (/\b(contract|nda|tos|terms|agreement|trademark|ip |counsel|sign|signature)\b/.test(t)) return "legal";
  if (/\b(workflow|automation|vendor|process|sop|integration|tool|stack)\b/.test(t)) return "ops";
  return "atlas";
}

function json(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "authorization, content-type, x-client-info, apikey",
    },
  });
}
