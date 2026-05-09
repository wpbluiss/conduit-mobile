import { supabase } from "../supabase";
import { getOrCreateAccount } from "./account";
import type { BuildSession, EngineeringLog } from "./types";

export async function listBuilds(): Promise<BuildSession[]> {
  const account = await getOrCreateAccount();
  if (!account) return [];

  const { data, error } = await supabase
    .from("conduit_builds")
    .select(
      "id, account_id, template_id, build_name, build_slug, status, github_repo_url, vercel_project_id, vercel_deployment_id, live_url, error_message, conversation_id, created_at, archived_at",
    )
    .eq("account_id", account.id)
    .is("archived_at", null)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.warn("[Builds] list failed:", error.message);
    return [];
  }
  return (data ?? []) as BuildSession[];
}

export async function getBuild(id: string): Promise<BuildSession | null> {
  const { data, error } = await supabase
    .from("conduit_builds")
    .select(
      "id, account_id, template_id, build_name, build_slug, status, github_repo_url, vercel_project_id, vercel_deployment_id, live_url, error_message, conversation_id, created_at, archived_at",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.warn("[Builds] get failed:", error.message);
    return null;
  }
  return data as BuildSession | null;
}

/**
 * Engineering logs are keyed by `session_id`, which lives on the conversation
 * row that owns this build (conversation.engineering_session_id). Resolve it,
 * then fetch the logs.
 */
async function resolveEngineeringSessionId(buildId: string): Promise<string | null> {
  const build = await getBuild(buildId);
  if (!build?.conversation_id) return null;

  const { data, error } = await supabase
    .from("conduit_conversations")
    .select("engineering_session_id")
    .eq("id", build.conversation_id)
    .maybeSingle();

  if (error || !data) return null;
  return (data as { engineering_session_id: string | null }).engineering_session_id ?? null;
}

export async function getBuildLogs(buildId: string): Promise<EngineeringLog[]> {
  const sessionId = await resolveEngineeringSessionId(buildId);
  if (!sessionId) return [];

  const { data, error } = await supabase
    .from("conduit_engineering_logs")
    .select("id, session_id, ts, level, message")
    .eq("session_id", sessionId)
    .order("ts", { ascending: true })
    .limit(500);

  if (error) {
    console.warn("[Builds] logs failed:", error.message);
    return [];
  }
  return (data ?? []) as EngineeringLog[];
}

export function subscribeToBuildLogs(
  buildId: string,
  onLog: (log: EngineeringLog) => void,
): () => void {
  let channel: ReturnType<typeof supabase.channel> | null = null;
  let cancelled = false;

  (async () => {
    const sessionId = await resolveEngineeringSessionId(buildId);
    if (cancelled || !sessionId) return;
    channel = supabase
      .channel(`build-logs-${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "conduit_engineering_logs",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => onLog(payload.new as EngineeringLog),
      )
      .subscribe();
  })();

  return () => {
    cancelled = true;
    if (channel) supabase.removeChannel(channel);
  };
}

export function subscribeToBuildStatus(
  buildId: string,
  onUpdate: (build: BuildSession) => void,
): () => void {
  const channel = supabase
    .channel(`build-status-${buildId}`)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "conduit_builds",
        filter: `id=eq.${buildId}`,
      },
      (payload) => onUpdate(payload.new as BuildSession),
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
