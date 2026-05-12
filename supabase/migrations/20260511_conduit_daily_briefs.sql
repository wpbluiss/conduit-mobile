-- Atlas's daily brief: a per-account, per-date summary that the daily
-- brief worker writes overnight. Mobile reads via the Atlas surface.
CREATE TABLE IF NOT EXISTS public.conduit_daily_briefs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES public.conduit_accounts(id) ON DELETE CASCADE,
  brief_date date NOT NULL,
  title text,
  summary text,
  highlights jsonb DEFAULT '[]'::jsonb,
  blockers jsonb DEFAULT '[]'::jsonb,
  source text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (account_id, brief_date)
);

ALTER TABLE public.conduit_daily_briefs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "account_members_full_access" ON public.conduit_daily_briefs;
CREATE POLICY "account_members_full_access" ON public.conduit_daily_briefs
  FOR ALL
  USING (
    account_id IN (
      SELECT id FROM public.conduit_accounts WHERE owner_user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS conduit_daily_briefs_account_date_idx
  ON public.conduit_daily_briefs (account_id, brief_date DESC);

COMMENT ON TABLE public.conduit_daily_briefs IS
  'Daily brief surfaced on Atlas''s workspace. Populated by the cross-org daily-brief worker at 06:00 local.';
