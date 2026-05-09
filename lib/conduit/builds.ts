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

export async function getBuildLogs(buildId: string): Promise<EngineeringLog[]> {
  const { data, error } = await supabase
    .from("conduit_engineering_logs")
    .select("id, build_id, step, status, detail, created_at")
    .eq("build_id", buildId)
    .order("created_at", { ascending: true })
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
  const channel = supabase
    .channel(`build-logs-${buildId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "conduit_engineering_logs",
        filter: `build_id=eq.${buildId}`,
      },
      (payload) => onLog(payload.new as EngineeringLog),
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
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
