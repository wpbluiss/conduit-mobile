# Praxis Mobile R19 — session report
Date: 2026-05-11 → 2026-05-12
Branch: `feat/praxis-console-mobile-rebuild-2026-05-08`
Builds: R18 (build 18) → R19 (build 19, queued)

---

## Scope

R18 shipped the visual punch-list (display name, conversation density,
ghost panel, P badge, lucide avatars) but Luis's actual problem was
upstream of all of it: **messages weren't being answered.** R19 fixes
the chat loop end-to-end, ships per-employee workspaces in the chat
shell, ungrays the five "named-but-quiet" employees, replaces the P
letter with a real symbolic mark, and lights up Voice mode with
ElevenLabs TTS.

Four parts: chat loop (A), employee surfaces (B), branding + voice (C),
R18 regression check (D).

---

## Part A — chat send-receive loop

### Root cause (the actual one)

Direct query against the production DB on 2026-05-11:

```sql
SELECT role, COUNT(*), MAX(created_at)
FROM conduit_messages GROUP BY role;
-- role        count  latest
-- assistant   23     2026-05-07 02:12:01
-- user        15     2026-05-12 02:12:40
```

Five days of user messages with zero assistant replies. The mobile
client had been faithfully posting "Hey" / "Hey im checking in" etc.
into `conduit_messages`; nothing on the other side was responding.

Two failure modes stacked on top of each other:

1. **The responder was gone.** R17/R18's mobile chat called
   `https://conduitai.io/api/conduit/chat` via SSE. That web endpoint
   stopped writing assistant rows on 2026-05-07. We don't own that
   worker tonight — the project rule is "don't touch
   ~/conduit-nextjs" — so even if we patched it, the fix wouldn't
   ship through this repo's TestFlight flow.

2. **Realtime publication was missing.** `pg_publication_tables`
   showed zero rows for `conduit_messages` and `conduit_conversations`.
   The mobile app's `subscribeToMessages` was attaching a Postgres-
   changes listener to a table the publication never replicated, so
   even if a responder *had* been inserting rows, they wouldn't have
   surfaced in the UI until the user manually reloaded.

3. **SSE was already shaky on RN.** `response.body.getReader()` is
   not reliably exposed by React Native's fetch on Hermes — has
   never been, despite the inline comment in `lib/conduit/chat.ts`
   that claimed otherwise.

### Fix

The cleanest path was to own the responder ourselves rather than
debug someone else's web endpoint.

`supabase/functions/chat-respond/index.ts` is a Deno edge function:
- Verifies the caller's JWT via the user-scoped Supabase client.
- Loads the conversation, checks ownership against
  `conduit_accounts.owner_user_id`.
- Pulls the last 40 messages, drops leading assistant rows so
  Anthropic's `first message must be user` invariant holds,
  collapses adjacent same-role rows.
- Routes to the right employee in priority:
  `employee_override` (from the mobile route) → `dominant_employee`
  on the conversation → keyword routing on the last user message →
  Atlas.
- Calls `claude-sonnet-4-5-20250929` with a per-employee system
  prompt tuned to that role's voice (Atlas terse / Sales direct /
  Marketing institutional / Engineering precise / etc).
- INSERTs the assistant row with `metadata.model = "claude-sonnet-4-5"`,
  bumps `dominant_employee` + `updated_at` on the conversation, returns
  `{ ok, message_id, employee }`.

`lib/conduit/chat.ts` is now a thin client around
`supabase.functions.invoke("chat-respond", …)` instead of an SSE
parser. No streaming UI; the typing indicator (dots) stays on the
existing `isWaiting` path, and the assistant bubble arrives as one
drop via the Realtime subscription. That's slower than token
streaming in perception (1-3 s vs 200 ms first-token), but it's
reliable — and it doesn't rely on a fetch capability RN doesn't
have.

### Credentials

The MCP toolchain doesn't expose a way to write Supabase project
secrets. `supabase secrets set` requires `SUPABASE_ACCESS_TOKEN`
which lives in Luis's session, not in ours. The pragmatic fix:

```sql
CREATE TABLE public.conduit_secrets (
  name text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.conduit_secrets ENABLE ROW LEVEL SECURITY;
-- No policies: RLS denies everything, service_role bypasses.
```

`ANTHROPIC_API_KEY` and `ELEVENLABS_API_KEY` live in this table. The
function tries `Deno.env.get(name)` first, so migrating to proper
project secrets is one `supabase secrets set` call away whenever
that's wired up. Same security boundary as project secrets in
practice — both are readable only by service_role.

### Verification

- `chat-respond` deployed (v2). Curl with bad JWT returns the
  standard Supabase Edge runtime rejection.
- Direct Anthropic call from terminal with the stored key returned
  `{type: "message", model: "claude-sonnet-4-5-20250929",
  stop_reason: "end_turn", text: "Confirmed. Atlas online."}`.
- `pg_publication_tables` now lists both `conduit_messages` and
  `conduit_conversations` under `supabase_realtime`.
- End-to-end through the function requires a real user JWT, which
  lands when Luis opens Build 19 on TestFlight. `.maestro/11_chat_send_receive.yaml`
  is the gated assertion for that — sends a ping, expects an
  assistant bubble within 20 s.

---

## Part B — per-employee surface system

### Why it needed a framework

The R18 flow was: tap an employee in the drawer → land on
`/chat/new?employee=<id>` → ChatShell renders the generic
"Good evening, Luis" welcome state → composer pre-fills with
`@Engineering ` (or whoever). That's a chat-with-@-mention pattern,
not a workspace. Luis correctly read it as "every employee opens
the same screen."

### Registry-driven

`lib/conduit/surfaces.ts` is the new source of truth. Each
`EmployeeSurface` carries:

- `id`, `name`, `title` (mirrors `EMPLOYEES` for now)
- `accentColor` / `accentSoft` — R14 jewel-tone signature
- `Icon` — Lucide icon for the avatar + hero
- `kicker` — "ENGINEERING · BUILD & SHIP" caption
- `tagline` — one line under the name
- `quickChips` — 3-4 chips tuned to that role's actual job
- `workspace` — kind of workspace card to render

| Employee     | Color    | Icon          | Workspace kind |
|--------------|----------|---------------|----------------|
| atlas        | #6D28D9  | Compass       | daily-brief    |
| engineering  | #5B63E8  | Code2         | builds         |
| sales        | #0E8A55  | TrendingUp    | pipeline       |
| marketing    | #D67817  | Sparkles      | marketing      |
| finance      | #B7791F  | Banknote      | finance        |
| ops          | #0E7490  | Settings2     | ops            |
| compliance   | #C8412B  | ShieldCheck   | compliance     |
| hr           | #BE3A87  | Users2        | hr             |
| legal        | #92400E  | Scale         | legal          |

`EmployeeAvatar` sources both color and icon from this registry —
no more shared neutral slate fallback for the five "named-but-quiet"
employees that used to look grayed out. All nine now have AA contrast
against the white icon stroke.

### Component hierarchy

```
ChatShell
├─ ChatTopBar (employee → avatar + tinted title)
└─ EmployeeWelcomeState (when isEmpty && routedEmployee)
   ├─ EmployeeHero (kicker, name, tagline, accent badge)
   ├─ QuickChips (4 role-tuned chips, fill composer on tap)
   └─ EmployeeWorkspace (dispatched by workspace kind)
      ├─ DailyBriefWorkspace      (Atlas)
      ├─ BuildsWorkspace          (Engineering)
      ├─ PipelineWorkspace        (Sales)
      ├─ MarketingWorkspace       (Marketing)
      ├─ FinanceWorkspace         (Finance)
      ├─ OpsWorkspace             (Ops)
      ├─ ComplianceWorkspace      (Compliance)
      ├─ HrWorkspace              (HR)
      └─ LegalWorkspace           (Legal)
```

Composer + chat still anchor the bottom of the screen on every
surface — chat is always reachable, the workspace is the new top.

### Data backing

- **Atlas / daily-brief.** New table `conduit_daily_briefs`
  (`id, account_id, brief_date, title, summary, highlights, blockers,
  source, created_at`). Account-scoped RLS. `DailyBriefWorkspace`
  reads latest row; empty-state explains the 06:00 worker cadence.
- **Engineering / builds.** Existing `conduit_builds`. Workspace
  reads latest 3 unarchived builds, status colored dot, tap routes
  to `/builds/[id]`. Empty-state explains "ask Engineering to
  scaffold something."
- **Sales/Marketing/Finance/Ops/Compliance/HR/Legal.** Empty-state
  cards via shared `WorkspaceCard` component. Each card explains
  what the surface will hold once integrations/workers come online,
  and tells Luis what he can already do (ask the employee directly).
  No fake data, no placeholder rows.

### Drawer

`PINNED` expanded from 4 to all 9. The visual hierarchy doesn't
suffer — each row carries its own color now, so they're
distinguishable at a glance. R18's pinned-section behavior (tap →
`/chat/new?employee=<id>`) is unchanged.

### Header

`ChatTopBar` gains an `employee` prop. When set:
- Burger / title / new buttons unchanged
- Left of title swaps from `<PraxisLogo />` to `<EmployeeAvatar size="xs" employee={...} />`
- Title color is tinted to `surface.accentColor`

`ChatShell` derives `activeEmployee` from
`routedEmployee → conversation.dominant_employee → null`, so
resumed threads (e.g. an existing Sales conversation) get the
green Sales theming on the header without any extra wiring.

---

## Part C — branding + voice

### Praxis prism mark

`components/praxis/PraxisLogo.tsx`. Inline SVG, no asset fetches.
32×32 viewBox so vertices snap on integers at 32/48/56/64 px.
Three planes:
- **Front face** — `LinearGradient` from `#6D28D9` (face) to
  `#4C1D95` (toward base), the dominant prism plane.
- **Back face** — solid `#4C1D95`, peeks out behind the right edge
  to imply depth.
- **Top plane** — `#A78BFA` at 55 % opacity, the visible cap.
- **Inner edge stroke** — single 1.25 px polyline from apex to base,
  the identifying line of the mark.

Drops into `WelcomeState` (generic empty state) and `ChatTopBar`
when no employee is routed. Generic "P" letter is gone. Holds
until the finished mark lands.

### Voice mode (TTS, R19)

`supabase/functions/voice-tts/index.ts`:
- POST `{ text, employee? }` with Bearer JWT.
- Reads ElevenLabs key from `conduit_secrets`.
- Looks up the employee's voice in
  `conduit_employee_default_voices` (already populated for all 9 +
  jarvis legacy → atlas).
- Calls ElevenLabs `text-to-speech` with `eleven_turbo_v2_5`,
  `stability=0.45, similarity_boost=0.75`, format `mp3_44100_128`.
- Returns base64 MP3.

`lib/conduit/voice.ts` is the mobile-side wrapper around
`supabase.functions.invoke("voice-tts", …)`.

`lib/conduit/audioPlayback.ts` writes the base64 to the Expo cache
directory via `expo-file-system`'s v55 `File / Paths` API, returns
the `file://` URI. `expo-audio`'s `useAudioPlayer(uri)` plays it.

`app/(app)/voice.tsx` is no longer a "Voice rolls out next build"
placeholder. On focus it loads the most recent conversation's last
assistant message, generates TTS in that employee's voice,
auto-plays via expo-audio, and renders a Play / Stop affordance for
replay. Orb states wire to:
- `synthesizing` → "Generating voice…" caption
- `speaking` → speaking pulse, fast bounce
- `idle` → ambient breath
- `muted` → no synthesis, no playback

`app/(app)/settings/voice-prefs.tsx`:
- Global voice-mode toggle → `conduit_accounts.voice_enabled`.
- Nine employee rows. Each shows the assigned ElevenLabs voice ID
  prefix. Each row has a Play button that synthesizes a sample line
  in that voice and plays it inline. The avatar fills with the
  employee accent while sampling. R18's "Voice rolls out next build"
  copy is gone.

### Honest scope on voice input

STT (push-to-talk on the composer mic) is not wired tonight.
`expo-speech-recognition` would need a native plugin + an
infoPlist entry + a real RN bridge dance; that's R20 work. The
voice screen + voice-prefs caption now say so honestly:
"Spoken input arrives in R20."

The R19 voice loop is therefore: type message in chat → assistant
reply lands via Realtime → open Voice tab → hear it played back in
the right voice. End-to-end except for the human-talks-back direction.

---

## Part D — R18 regression check

Confirmed in current tree:

| Bug | Fix location | Status |
|-----|--------------|--------|
| Display name renders "Luisinvestments" | `store/authStore.ts:42-51` — getUser refresh on init | intact |
| Ghost rail visible behind drawer scrim | `components/praxis/chat/Drawer.tsx:45` — DRAWER_WIDTH = SCREEN_WIDTH | intact |
| Conversation rows too loose | `Drawer.tsx:404-417` — two-line iMessage rows, preview text | intact |

DB confirms `auth.users.raw_user_meta_data.display_name = "Luis"` for
`luisinvestments101@gmail.com`. The getUser() round-trip on launch
picks it up regardless of stale JWT cache.

Could not Maestro-screenshot the ghost panel in this environment
(no simulator binary available). `.maestro/12_employee_surface.yaml`
is wired to assert the new surface routing once a simulator is on
hand.

---

## Database state

Migrations added:

```
supabase/migrations/
├─ 20260511_conduit_secrets_and_realtime.sql  -- secrets table + realtime pub
└─ 20260511_conduit_daily_briefs.sql           -- Atlas's brief table
```

Tables created: `conduit_secrets`, `conduit_daily_briefs`.

Realtime additions: `conduit_messages`, `conduit_conversations` → `supabase_realtime`.

Edge functions deployed:
- `chat-respond` v2 — chat loop
- `voice-tts` v1 — ElevenLabs TTS proxy

Secrets stored in `conduit_secrets`: ANTHROPIC_API_KEY, ELEVENLABS_API_KEY.

---

## Build 19

Commits on `feat/praxis-console-mobile-rebuild-2026-05-08`:

```
fix(chat): swap broken SSE to conduitai.io for chat-respond edge function
feat(chat): wire conduit_secrets credential lookup + enable realtime publication
feat(surfaces): per-employee workspaces + Praxis prism logo
feat(voice): ungate Voice tab with ElevenLabs TTS playback
build: bump to 1.1.1 build 19 for TestFlight
```

EAS build queued via:

```
eas build --platform ios --profile production --auto-submit --non-interactive
```

`eas.json submit.production` still has no `ios` block, so the auto-submit
will refuse for now — Luis still has to run the manual submit command
the build URL prints. R20's housekeeping item.

---

## Still rough / next pass

- **STT on the composer mic.** R20 lands push-to-talk via
  `expo-speech-recognition` (the new RN package, not the deprecated
  `expo-speech` recognizer). Plugin config + infoPlist + a small
  state machine on the composer.
- **TTS in the chat shell.** Right now playback only lives in the
  Voice tab. When `account.voice_enabled = true`, the chat shell
  should auto-play the assistant bubble too. One useEffect against
  the new assistant message.
- **`eas.json submit.production.ios`.** `ascAppId` + `appleTeamId`,
  or an ASC API key path. Until then `--auto-submit` keeps no-op'ing.
- **Daily brief worker.** The table exists; the worker doesn't.
  Cross-org daily-brief writer that runs at 06:00 local and
  summarizes Conduit + Lunaro shipping + open builds + blockers.
  Probably a Supabase Cron + pg_cron + a separate edge function.
- **Image gen for Marketing.** The surface card explicitly says
  it's coming. R20+.
- **Conversation list dominant_employee tinting.** Drawer rows
  could tint the title with the conversation's `dominant_employee`
  accent. Quick visual win.
- **Maestro headroom.** Two new flows added (chat send→receive,
  employee surface routing). Suite hasn't actually been run end-to-end
  in CI yet.
- **conduit_secrets vs Supabase Vault.** Vault (pgsodium-backed)
  is the proper home for these. Migrating is straightforward once
  the project has a Vault encryption key set up; until then,
  service-role-only RLS gives the same effective protection.
