// ElevenLabs TTS client for the Praxis Console mobile app.
//
// The mobile app does not hold the ElevenLabs API key directly — it lives
// in conduit_secrets and is read by the voice-tts Supabase edge function.
// This module wraps the call so callers don't need to know about the
// function shape.

import { supabase } from "../supabase";
import type { EmployeeId } from "./employees";

export interface SynthRequest {
  text: string;
  employee?: EmployeeId | "team" | null;
}

export interface SynthResult {
  ok: boolean;
  /** base64-encoded MP3 audio. Empty when ok=false. */
  audioBase64: string;
  /** Voice ID actually used (echoed back for debugging). */
  voiceId?: string;
  error?: string;
}

/**
 * Call the voice-tts edge function and return base64 MP3 audio.
 *
 * The client passes the text + (optional) employee. The function looks up
 * the employee's configured ElevenLabs voice in
 * `conduit_employee_default_voices`, calls ElevenLabs `text-to-speech`
 * with `mp3_44100_128`, and returns the audio as a base64 string.
 *
 * The mobile client plays this with expo-audio (Audio.Sound.createAsync
 * with a data URI).
 */
export async function synthesizeSpeech(req: SynthRequest): Promise<SynthResult> {
  try {
    const { data, error } = await supabase.functions.invoke<
      | { ok: true; audio_base64: string; voice_id?: string }
      | { ok: false; error: string }
    >("voice-tts", {
      body: {
        text: req.text,
        employee: req.employee ?? null,
      },
    });
    if (error || !data || !("ok" in data)) {
      return {
        ok: false,
        audioBase64: "",
        error: error?.message ?? "tts_invoke_failed",
      };
    }
    if (!data.ok) {
      return { ok: false, audioBase64: "", error: data.error };
    }
    return { ok: true, audioBase64: data.audio_base64, voiceId: data.voice_id };
  } catch (e: unknown) {
    return {
      ok: false,
      audioBase64: "",
      error: e instanceof Error ? e.message : String(e),
    };
  }
}
