// Praxis Console — voice TTS via ElevenLabs.
//
// POST /functions/v1/voice-tts
//   Authorization: Bearer <user-jwt>
//   { text: string, employee?: EmployeeId | "team" | null }
//
// Returns { ok: true, audio_base64, voice_id } | { ok: false, error }
//
// Looks up the employee's configured voice in
// conduit_employee_default_voices; falls back to Atlas's voice. Audio is
// returned as base64-encoded MP3 (mp3_44100_128). The mobile client plays
// it via expo-audio + data URI.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const DEFAULT_EMPLOYEE = "atlas";

interface SynthRequest {
  text: string;
  employee?: string | null;
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
  if (req.method !== "POST") return json({ ok: false, error: "method_not_allowed" }, 405);

  let body: SynthRequest;
  try {
    body = (await req.json()) as SynthRequest;
  } catch {
    return json({ ok: false, error: "bad_json" }, 400);
  }
  if (!body.text || typeof body.text !== "string") {
    return json({ ok: false, error: "missing_text" }, 400);
  }
  // ElevenLabs has a 5000-char limit per request. Trim aggressively for
  // the chat-respond → tts flow; assistant turns rarely need more than this.
  const text = body.text.slice(0, 4500);

  const auth = req.headers.get("Authorization") ?? "";
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: auth } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData?.user) {
    return json({ ok: false, error: "unauthenticated" }, 401);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Resolve ElevenLabs key
  let key = Deno.env.get("ELEVENLABS_API_KEY") ?? "";
  if (!key) {
    const { data: secret } = await admin
      .from("conduit_secrets")
      .select("value")
      .eq("name", "ELEVENLABS_API_KEY")
      .maybeSingle();
    key = (secret?.value as string | undefined) ?? "";
  }
  if (!key) return json({ ok: false, error: "missing_elevenlabs_key" }, 500);

  // Resolve voice id
  const employee = normalizeEmployee(body.employee) ?? DEFAULT_EMPLOYEE;
  const { data: voiceRow } = await admin
    .from("conduit_employee_default_voices")
    .select("voice_id")
    .eq("employee", employee === "team" ? "atlas" : employee)
    .maybeSingle();
  const voiceId =
    (voiceRow?.voice_id as string | undefined) ??
    "UgBBYS2sOqTuMpoF3BR0"; // Atlas fallback

  // Call ElevenLabs TTS — returns audio/mpeg by default
  const ttsResp = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: {
        "xi-api-key": key,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_turbo_v2_5",
        voice_settings: {
          stability: 0.45,
          similarity_boost: 0.75,
        },
      }),
    },
  );

  if (!ttsResp.ok) {
    const errText = await ttsResp.text().catch(() => "");
    console.error("[voice-tts] elevenlabs error", ttsResp.status, errText);
    return json(
      { ok: false, error: "elevenlabs_error", status: ttsResp.status, detail: errText.slice(0, 400) },
      502,
    );
  }

  const arrayBuf = await ttsResp.arrayBuffer();
  const audioBase64 = bufferToBase64(arrayBuf);

  return json({ ok: true, audio_base64: audioBase64, voice_id: voiceId });
});

function normalizeEmployee(value: string | null | undefined): string | null {
  if (!value || typeof value !== "string") return null;
  const v = value.toLowerCase();
  if (v === "jarvis") return "atlas";
  const valid = ["atlas","engineering","sales","marketing","finance","ops","compliance","hr","legal","team"];
  return valid.includes(v) ? v : null;
}

function bufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  // Chunk the conversion to avoid blowing the call stack for big buffers
  const chunkSize = 0x8000;
  let out = "";
  for (let i = 0; i < bytes.length; i += chunkSize) {
    out += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(out);
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
