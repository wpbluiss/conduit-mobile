# Praxis Mobile Constitution

This constitution governs `praxis-mobile`, the iOS companion app for the Praxis Console
AI workforce. It complements (and where stated, defers to) the Praxis Web constitution
where the two apps share a Supabase backend. Where the two constitutions disagree on a
shared resource, the more restrictive rule wins.

## Core Principles

### Principle Zero — Domain Truth & No Hallucination (NON-NEGOTIABLE)

The user has nine named AI employees. Every employee identity, role, and surface
rendered in the UI MUST come from `lib/conduit/employees.ts` and the Supabase
`conduit_*` tables. Code MUST NOT invent employee names, roles, capabilities,
or relationships outside that registry.

When an LLM produces output (currently via `supabase/functions/chat-respond`,
which calls Anthropic), the orchestration layer must validate employee
identifiers against the registry before persisting to `conduit_messages`.
The mobile client trusts only what it reads back from Supabase Realtime — it
does not render speculative or optimistic LLM output as if it were canonical.

UI fallbacks (loading, error, empty states) must say what is actually missing —
never fabricate plausible-looking content to fill space. "Atlas is thinking…"
is acceptable; rendering a fake placeholder message is not.

### Principle I — Apple Review Discipline (NON-NEGOTIABLE)

Every external-facing change must answer: "Does this trigger a new App Store
review? If yes, does it remain compliant with Guidelines 5.1.1, 5.1.2, 4.0,
and 5.0?"

Non-negotiable specifics learned from the build-10 rejection:

- **AI data consent disclosure MUST be present at sign-up.** Removing or
  weakening it — as silently happened during the May 2026 rebuild when the
  legacy `AIConsentModal` was deleted with the old auth stack — re-triggers
  the original rejection on next submission. The consent record is written
  to Supabase `auth.users.user_metadata.ai_data_consent` (boolean) and
  `ai_data_consent_date` (ISO timestamp). These field names are a contract
  shared with downstream RLS and edge functions — do not rename.

- The Privacy Policy URL (`https://conduitai.io/privacy`) must remain
  reachable from any consent or onboarding surface.

- Required usage strings (`NSMicrophoneUsageDescription`, etc.) must describe
  what the app actually does. Generic or aspirational copy is a rejection
  vector.

- Placeholder data, "Coming Soon" screens, dead-end taps, and demo-only
  surfaces are 4.0 / 4.2 rejection vectors. Either ship a real surface or
  hide the entry point.

- The next App Store submission off `main` is the gate at which the consent
  restoration in `app/(auth)/sign-up.tsx` will be re-validated by an Apple
  reviewer creating a fresh test account. Treat it as the canonical test.

### Principle II — Expo Managed Workflow (NON-NEGOTIABLE)

No eject. The repository has no `ios/` or `android/` directory, and that
is the shipped contract. All native configuration lives in `app.json` and
`eas.json`. Any proposal to add native code must instead be solved via:

1. An existing Expo SDK module (preferred), or
2. A config plugin entry in `app.json.plugins`, or
3. A custom Expo Module — only after explicit decision and constitution
   amendment, because it changes the build pipeline.

Bundle identifier `io.conduitai.app` is the shipped identity for both iOS
and Android. EAS project `9a547e37-6e21-4587-99f3-39d13c5ad6a2`
(owner `wpbluiss`) is the build pipeline. Neither is interchangeable —
changing the bundle ID orphans the existing TestFlight thread (builds 1–19
to date) and forces a new App Store record.

### Principle III — Schema Namespacing (NON-NEGOTIABLE)

The Supabase project `mvuslmfjkkuizixjpkgl` is shared with Praxis Web and
(via namespace partitioning) the Lunaro stack. Every table, function, view,
type, policy, and trigger this app introduces MUST be prefixed `conduit_*`.
Migration filenames in `supabase/migrations/` must also include the prefix
(e.g. `20260511_conduit_daily_briefs.sql`).

Service-role secrets are stored in `conduit_secrets` (RLS: service-role only)
and read by edge functions — never by the mobile client. The mobile client
only ever holds the anon key.

Cross-table joins to `lunaro_*` tables or unprefixed shared tables
(`auth.users`, `storage.*`) are allowed but must be reviewed for RLS impact
in the same commit.

### Principle IV — Release Discipline

Build numbers move forward, never backward. `eas.json` is configured with
`appVersionSource: "remote"` and `production.autoIncrement: true`, but local
`app.json` `ios.buildNumber` and `android.versionCode` must advance in
lockstep with each TestFlight push, so dev builds remain installable
alongside TestFlight builds.

Every TestFlight-bound commit follows the form:
`build: bump to <version> build <n> for TestFlight`. Each release commit
must explicitly state whether the change touches Apple-Review-relevant
surfaces (auth, permission strings, consent, payment, privacy).

`usesNonExemptEncryption: false` is intentional — Praxis ships no proprietary
encryption. Keep both the `ios.config.usesNonExemptEncryption` and the
`ios.infoPlist.ITSAppUsesNonExemptEncryption` declarations to skip the
TestFlight export-compliance gate (commit `62f3494` established this).

### Principle V — Brand Integrity

User-facing UI surfaces MUST NEVER name "Claude", "Anthropic", "OpenAI",
"ElevenLabs", or any underlying model/vendor as the speaker. The named
identities — the nine AI employees, of which Atlas is the default — are
the product.

Exceptions (where third-party names MUST appear):

- The AI Data Notice on `sign-up.tsx` names third parties to satisfy
  Apple 5.1.2.
- Settings → About / Privacy / Legal MAY name vendors when describing
  data flows.

Internal module names (`lib/conduit/*`, `conduit_secrets`, `io.conduitai.app`,
`conduitai.io` callback domain) are technical scaffolding, not user-facing,
and may retain "Conduit" without rebrand work.

"CallFlow" is dead. Any surviving reference (README, rebuild plan docs as
of v1.0.0) is documentation rot to be removed when noticed.

### Principle VI — Short Branches, Trunk-First

The May 2026 rebuild branch (`feat/praxis-console-mobile-rebuild-2026-05-08`)
was 55 commits in a vacuum, silently diverged from production for over two
months, and required a dedicated reconciliation session to merge cleanly —
during which the deleted AI-consent surface (a build-10 rejection fix) was
nearly shipped as a regression.

Going forward:

- Feature branches should live no longer than one week.
- If a rewrite is unavoidable, the parent branch must rebase onto `main`
  weekly so divergence stays visible.
- Cross-cutting changes (Apple-Review-relevant edits, schema migrations,
  brand identity) MUST land on `main` within the same day.

Long-lived branches require explicit acknowledgment of the reconciliation
cost in the branch's first commit message — "this branch will diverge,
here is the reconciliation plan." No more silent multi-month forks.

## Compliance Requirements

**App Store / TestFlight:**
- Bundle ID: `io.conduitai.app` (iOS + Android)
- EAS project: `9a547e37-6e21-4587-99f3-39d13c5ad6a2`
- Owner: `wpbluiss`
- iPhone-only (`ios.supportsTablet: false`). iPad regressions are out of scope.
- Privacy Policy: `https://conduitai.io/privacy` — must remain live.
- Current shipped state: v1.1.1 build 19 (TestFlight); next App Store submission
  will be reviewed fresh against build-10 history.

**Supabase contract (shared with Praxis Web):**
- Project ref: `mvuslmfjkkuizixjpkgl`
- All app-owned schema objects prefixed `conduit_*`.
- Realtime publication `supabase_realtime` includes `conduit_messages` and
  `conduit_conversations` — do not drop without coordinating with Web (R19
  added these; removing them silently breaks the assistant-render path).
- Service-role keys live ONLY in edge functions, never in the mobile bundle.
- Edge functions in this repo: `chat-respond`, `voice-tts`. Both read
  credentials from `conduit_secrets`.

**Tech stack (locked unless explicitly amended):**
- Expo SDK 55, React Native 0.83, React 19, TypeScript 5.9
- Expo Router (file-based routing under `app/`)
- Zustand (state, in `store/`)
- Supabase JS + `expo-secure-store` session adapter (`lib/supabase.ts`)
- Phosphor + Lucide for icons (consolidation toward one TBD)
- Fraunces (display) + Inter (body) + JetBrains Mono (code)
  via `@expo-google-fonts/*`
- Maestro for E2E flows in `.maestro/`

## Development Workflow

- Domain logic lives in `lib/conduit/*`. Components in `components/praxis/*`.
  Design tokens in `constants/praxis-tokens.ts`. Theme via
  `contexts/PraxisThemeContext.tsx`. Components should not import from `app/`
  (the route layer); the dependency direction is route → component → lib.
- TypeScript strictness is the floor. `npx tsc --noEmit` must pass on every
  commit destined for `main`.
- E2E flows live in `.maestro/` (12 flows as of v1.0.0). Adding a new
  top-level surface should add a corresponding Maestro flow.
- Session narrative goes in `docs/SESSION_REPORT_<date>_ROUND<n>_MOBILE.md`.
  These are running history, not specifications.
- Specifications live under `.specify/` (Spec Kit). New product work follows
  `/speckit-specify` → `/speckit-plan` → `/speckit-tasks` → `/speckit-implement`.
- Use `/usr/bin/git` in scripts; a shell wrapper in this user's environment
  swallows the default `git` command's output when called from the Bash tool.

## Governance

This constitution supersedes ad-hoc convention. Amendments are made by:

1. PR (or direct commit to `main` while contributor count remains 1) editing
   `.specify/memory/constitution.md` and bumping the version footer.
2. Updating any affected templates in `.specify/templates/`.
3. Recording the rationale in the commit message.

Versioning is `MAJOR.MINOR.PATCH`:

- **MAJOR** — A principle is removed, or its NON-NEGOTIABLE status flips.
- **MINOR** — A new principle or material section is added.
- **PATCH** — Wording, examples, or compliance specifics change without
  altering meaning.

All non-trivial work must verify compliance with this document before merge.
Where this constitution disagrees with the Praxis Web constitution on a
shared resource (Supabase, brand, bundle identity, employee registry), the
more restrictive rule wins.

**Version**: 1.0.0 | **Ratified**: 2026-05-14 | **Last Amended**: 2026-05-14
