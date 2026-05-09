# Praxis Console Mobile — Rebuild Plan
**Branch**: `feat/praxis-console-mobile-rebuild-2026-05-08`
**Target**: TestFlight build 12 — 2026-05-08

---

## What this is

`~/conduit-mobile` was a CallFlow AI missed-call dialer. It is being rebuilt as the iOS companion to the web Praxis Console at `conduitai.io/app`. Bundle id `io.conduitai.app` is preserved so the existing TestFlight thread continues; display name changes to **Praxis**.

---

## Audit — what we have

### Keepable (reuse, optionally redesign)
| Path | Reason |
|---|---|
| `app/_layout.tsx` | Root wiring (auth gate, splash, fonts, status bar) — rewrite for Praxis providers, keep auth-redirect skeleton |
| `app/(auth)/_layout.tsx` `login.tsx` `signup.tsx` `welcome.tsx` `onboarding.tsx` | Supabase auth works; redesign visuals only |
| `lib/supabase.ts` | Supabase client with SecureStore adapter — keep verbatim |
| `lib/notifications.ts` | Expo push registration + realtime helpers — keep registration; rewrite the realtime subscription topic |
| `store/authStore.ts` | Zustand store w/ Supabase integration — keep verbatim |
| `eas.json` | EAS profiles — keep |
| `app.json` | Update name/buildNumber/version/icon |
| `package.json` deps | Most deps still useful — add Phosphor icons, eventsource polyfill, etc. |
| `assets/images/icon.png` etc. | Replace with indigo Praxis identity |
| `tsconfig.json` `index.ts` `setup.sh` | Keep |

### Replaceable (delete)
| Path | Why |
|---|---|
| `app/(tabs)/*` | CallFlow dashboard / agent / calls / messages / analytics / settings / affiliates — full vertical |
| `app/call/[id].tsx`, `app/lead/[id].tsx` | CallFlow detail screens |
| `app/calendar.tsx`, `locations.tsx`, `payments.tsx`, `revenue.tsx`, `reviews.tsx` | CallFlow vertical features |
| `lib/api.ts` | FastAPI/Railway client wired to CallFlow endpoints |
| `lib/vapi.ts` | Vapi voice agent for CallFlow — replaced by Conduit voice worker |
| `store/leadsStore.ts` | CallFlow leads cache |
| `constants/colors.ts` `typography.ts` `animations.ts` `layout.ts` | Replace with `constants/praxis-tokens.ts` (single source) |
| `contexts/ThemeContext.tsx` | Rewrite to use new Praxis tokens + `useColorScheme` |
| `components/ui/*` | All CallFlow-flavored components — most rewritten under `components/praxis/` |

---

## New file structure

```
app/
  _layout.tsx                 — Praxis providers, fonts, splash
  (auth)/
    _layout.tsx
    sign-in.tsx               — bone canvas, indigo accents
    sign-up.tsx
    forgot-password.tsx
  (app)/
    _layout.tsx               — bottom tab bar (5 tabs)
    index.tsx                 — Home (workspace dashboard)
    chat/
      _layout.tsx
      index.tsx               — conversation list
      [id].tsx                — conversation detail w/ streaming
    voice.tsx                 — Voice mode entry → fullscreen modal
    builds/
      index.tsx               — build sessions list
      [id].tsx                — build detail (live progress)
    team/
      index.tsx               — 9-employee grid
      [employee].tsx          — employee profile
    settings/
      index.tsx
      account.tsx
      voice-prefs.tsx
      memory.tsx
      appearance.tsx

components/
  praxis/
    Surface.tsx               — themed View w/ tokens
    Text.tsx                  — typography variants
    Button.tsx                — primary / ghost / link
    IconBadge.tsx             — phosphor icon w/ ring
    EmployeeAvatar.tsx        — colored ring + initial
    chat/
      MessageList.tsx         — virtualized scroller
      MessageBubble.tsx       — user / assistant variants
      Composer.tsx            — multiline + voice toggle + @mention
      StreamingIndicator.tsx
      CodeBlock.tsx
      CitationCard.tsx
    voice/
      VoiceOrb.tsx            — animated radial waveform
      Captions.tsx
      VoiceControls.tsx
    home/
      QuickStartGrid.tsx
      RecentActivityCard.tsx
      MemorySnippetCard.tsx
      UsageStatCard.tsx

constants/
  praxis-tokens.ts            — single source of truth (light + dark)

lib/
  supabase.ts                 — kept
  conduit/
    api.ts                    — fetch wrapper for conduitai.io
    chat.ts                   — SSE-streamed chat (POST /api/conduit/chat)
    conversations.ts          — direct Supabase reads
    builds.ts                 — direct Supabase reads + realtime
    memory.ts                 — direct Supabase reads
    account.ts                — getOrCreateAccount via supabase
    employees.ts              — 9-employee config (mirrors web)
    types.ts                  — shared type defs
  voice/
    client.ts                 — voice worker WebSocket client (v1: PTT)

store/
  authStore.ts                — kept
  themeStore.ts               — system/light/dark override

assets/
  images/
    icon.png                  — indigo C, 1024x1024
    splash.png                — indigo C centered, bone bg
    adaptive-icon.png
```

---

## Backend integration

### Auth
- Supabase auth (existing). Same project `mvuslmfjkkuizixjpkgl`.
- The mobile app uses the user's session from `lib/supabase.ts` for **direct Supabase queries**.
- Account context comes from `conduit_accounts` table; mirrors the `getOrCreateAccount()` server helper but client-side.

### Reads — direct Supabase queries
| Resource | Table |
|---|---|
| Conversations list | `conduit_conversations` (RLS filters by account_id → user) |
| Messages in thread | `conduit_messages` |
| Memory snippets | `conduit_memory` |
| Build sessions | `conduit_builds` |
| Engineering logs | `conduit_engineering_logs` (realtime subscribe) |
| Account / usage | `conduit_accounts` (tokens, tier_id, billing_period_*) |

All are RLS-secured; the mobile session token is sufficient.

### Writes — chat completion
The **only** server compute we need is the AI streaming. The web endpoint `POST /api/conduit/chat` uses cookie auth via `@supabase/ssr`. To call it from mobile without modifying the web codebase, the request must include a `Cookie` header that mimics the supabase session cookie format: `sb-<ref>-auth-token=base64-<JSON>`.

**Implementation**: `lib/conduit/chat.ts` builds the cookie from the active Supabase session before calling `fetch(url, { method: 'POST', headers: { Cookie } })`. The endpoint then streams SSE events (`token`, `tts_chunk`, `done`).

If cookie injection proves unreliable in production, the **v2 fallback** is a Supabase Edge Function `/functions/v1/chat` that accepts Bearer tokens directly and runs the same logic — deployable without touching `conduit-nextjs`.

### Voice
- WebSocket: `wss://conduit-voice-worker.up.railway.app`
- v1 ships push-to-talk: record audio → POST to `/api/conduit/voice/tts` (audio out) and STT via on-device or API.
- v2 documented: full duplex via LiveKit Cloud + WebRTC.

---

## Environment variables

Set as EAS secrets:
```
EXPO_PUBLIC_SUPABASE_URL=https://mvuslmfjkkuizixjpkgl.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon key — already in lib/supabase.ts as fallback>
EXPO_PUBLIC_API_URL=https://conduitai.io
EXPO_PUBLIC_VOICE_WS_URL=wss://conduit-voice-worker.up.railway.app
```

These are public-safe (anon key is RLS-bound). No service-role keys ship.

---

## Phase order & commits

| Phase | Commit |
|---|---|
| 0 | (no commit — plan doc) |
| 1 | `feat(tokens): praxis design system` |
| 2 | `refactor(rebuild): wipe CallFlow surfaces, prep for Praxis Console` |
| 3 | `feat(shell): praxis tab nav + auth flow` |
| 4 | `feat(chat): conversation surface with streaming` |
| 5 | `feat(voice): fullscreen voice mode (v1 PTT)` |
| 6 | `feat(home): workspace dashboard` |
| 7 | `feat(team-builds-settings): remaining surfaces` |
| 8 | `chore(config): bump to build 12, rename to Praxis, indigo identity` |
| 9 | `chore(release): EAS build 12 → TestFlight` |

---

## Known gaps (v2 backlog)

- Voice mode v2: full-duplex LiveKit + RN WebRTC + interrupt detection
- Builds: live SSE streaming from `executeBuild` instead of polling `conduit_engineering_logs`
- Push notifications: tie to `conduit_messages` realtime so Atlas can poke the user
- iPad layout (currently `supportsTablet: false` — keep until launch)
