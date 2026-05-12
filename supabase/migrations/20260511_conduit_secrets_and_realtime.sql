-- Praxis Console R19 — chat responder infrastructure
--
-- 1. conduit_secrets: service-role-only key/value store for runtime
--    credentials read by Praxis Console edge functions. RLS denies all role
--    queries; only service_role bypasses. This is functionally equivalent
--    to Supabase project secrets but accessible via the MCP-driven workflow.
--
-- 2. Realtime publication for conduit_messages + conduit_conversations.
--    The mobile client subscribes to INSERT events on conduit_messages to
--    render assistant replies. Without the table in supabase_realtime the
--    subscription was silently a no-op — half of the R19 chat bug.

CREATE TABLE IF NOT EXISTS public.conduit_secrets (
  name text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.conduit_secrets ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.conduit_secrets IS
  'Service-role-only credential store. RLS denies all; edge functions use service_role to read.';

-- Idempotent realtime publication adds. The DO blocks swallow "already in
-- publication" errors so this migration is safe to re-run.
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.conduit_messages;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END$$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.conduit_conversations;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END$$;
