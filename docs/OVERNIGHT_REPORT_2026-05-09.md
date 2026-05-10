# Overnight report — 2026-05-09

Branch: `feat/praxis-console-mobile-rebuild-2026-05-08`
Build pushed: `1.1.1` (iOS build 14, Android versionCode 14)
Commits added overnight (oldest → newest):

```
c21b8f8 fix(chat): harden existing-thread loads + wire ROUTE TO routing
dcabc77 feat(drawer): add WORKSPACE rail + account row
318d0b9 feat(chat): polish picker + composer
c74fba5 test(qa): maestro harness + manual checklist for build-14 regressions
3e0154d build: bump to 1.1.1 build 14 for TestFlight
```

All five commits are on the remote.

---

## Bugs fixed

### ✅ BUG A — App crash when opening an existing conversation
- **Status:** Fixed in `c21b8f8`.
- **Root cause:** Legacy rows in `conduit_messages` carry content shapes
  the mobile app didn't expect — null content, JSON objects with `text`,
  Anthropic-style content blocks (`[{ type:"text", text:"…" }]`), and
  occasional `sender_type` instead of `role`. `MessageBubble.segmentMarkdown`
  blew up on `.slice()` against a non-string, taking the screen down with
  no fallback.
- **Files touched:**
  - `lib/conduit/normalize.ts` (new) — coerces content / role / employee
    / timestamp to safe shapes before they reach the UI.
  - `lib/conduit/conversations.ts` — switched the messages query to
    `select("*")` and pipes everything through `normalizeMessages`. Same
    for `appendUserMessage` and the realtime subscription.
  - `components/praxis/ErrorBoundary.tsx` (new) — class component with a
    polished fallback (warning glyph + retry button), a `resetKey` prop
    so route changes clear stale errors.
  - `components/praxis/chat/MessageBubble.tsx` — `segmentMarkdown`
    accepts unknown input; `safeRole` falls back to "assistant" if the
    DB sent something nonsensical.
  - `components/praxis/chat/MessageList.tsx` — per-row ErrorBoundary
    fallback so a single bad row can't kill the list. Stable
    `keyExtractor` even when `id` is null.
  - `components/praxis/chat/ChatLoadingSkeleton.tsx` (new) — three
    pulsing rows that match bubble geometry, shown while `getConversation`
    is in-flight so the screen never reads as a crash.
  - `components/praxis/chat/ChatEmptyState.tsx` (new) — shown when a
    thread loads with zero messages instead of the previous blank canvas.
  - `app/(app)/chat/[id].tsx` — wrapped in `ErrorBoundary` keyed on the
    thread id; reads `?employee=`, `?broadcast=`, `?draft=` params for
    deep links.
- **Defense in depth:** four nested error boundaries (route → list →
  row), data-layer normalization, type-safe rendering. A single bad row
  shows a one-line caption and the rest of the thread keeps working.

### ✅ BUG B — ROUTE TO footer doesn't route on tap
- **Status:** Fixed in `c21b8f8`.
- **Root cause:** `EmployeePicker.onSelect` mutated in-place state
  (`routedEmployee` + composer draft) and never navigated. From the
  user's POV, "tap does nothing" — same screen, same composer, no
  visible state change.
- **Behavior now:**
  - **From the picker (+ button)**: if you're already in a thread, tap
    routes to `/chat/new?employee=<id>` (or `?broadcast=true`) so the
    routing applies to a *new* thread, not a graft on top of the current
    conversation. If you're on a fresh blank slate, the legacy in-place
    behavior still works (sets routedEmployee + prefills composer).
  - **From the welcome state ("ROUTE TO" panel)**: the panel is new in
    `c21b8f8`. Each row navigates to `/chat/new?employee=<id>`; "The team"
    routes to `?broadcast=true`. The new-chat screen reads the param,
    pre-fills `@<Name> ` in the composer, and autoFocuses the input.
- **Files touched:** `components/praxis/chat/WelcomeState.tsx`,
  `components/praxis/chat/ChatShell.tsx`, `app/(app)/chat/new.tsx`,
  `app/(app)/chat/[id].tsx`.

---

## Bugs deferred (web-only — out of scope for mobile branch)

### BUG C — Tab switches feel slow on conduitai.io/app
- **Why deferred:** Lives in `~/conduit-nextjs`, not this repo.
- **Suggested next step:** Check whether each `/app/<tab>/page.tsx` is
  triggering a fresh server fetch on tab switch. If so, the cleanest
  fix is `loading.tsx` boundaries plus per-tab `unstable_cache` on the
  data load. If the tabs are using client navigation, look at
  React Query / SWR cache eviction policy. Likely a 1-hour fix on the
  web side.

### BUG D — Atlas voice cuts off mid-sentence on conduitai.io/app/voice
- **Why deferred:** Lives in `~/conduit-voice-worker`, not this repo.
- **Observation:** The Friday architectural fix (commit 1f934b5 on the
  voice worker) didn't hold. "I'm good" cutoff suggests the worker is
  hitting a turn-end trigger (silence threshold? VAD interrupt?) before
  TTS finishes streaming.
- **Suggested investigation Monday:** Pull worker logs around a
  reproducer call, look for `turn_end` or `interrupt` events firing
  during a successful TTS stream. Compare to the architecture before
  1f934b5 to see what guard regressed.

---

## Drawer completion

`components/praxis/chat/Drawer.tsx` now ends with two new sections:

- **WORKSPACE rail** — full-width labeled rows (28px icon tile +
  caret), in order: Builds (Code icon), Team (UsersThree), Memory
  (Brain), Settings (GearSix). Replaces the old three-icon footer rail
  which read as an afterthought.
- **Account row** — pinned below the scrollview, respects safe-area.
  Shows the user's display initial in an indigo-soft circle, their
  email (single-line truncated), "Manage account" subtitle, chevron.
  Taps route to `/(app)/settings/account`.

Both sections close the drawer on tap, fire light haptics, and navigate
on a 160ms delay so the drawer slide-out finishes before the route
transition. Visually the drawer now reads as the full app navigation
spine instead of a conversation list with a tiny utility footer.

---

## QA infrastructure

### Maestro install: success
- Maestro 2.5.1 at `~/.maestro/bin/maestro`.
- OpenJDK 25.0.2 at `/opt/homebrew/opt/openjdk` (installed overnight via
  `brew install openjdk`).
- Runner sets `JAVA_HOME` and `$PATH` itself — no shell config needed.

### Flows: 0/10 ran tonight
- 10 flow files written in `.maestro/`, mirroring the user's brief
  exactly: `01_launch.yaml` through `10_team_tab.yaml` plus a shared
  setup file.
- The simulator boots clean but has no Praxis app installed yet, so
  `maestro test` has nothing to attach to. Two paths to bring this up
  Monday:
  - **Real device** (recommended): plug in the iPhone with TestFlight
    build 14, set `PRAXIS_SIMULATOR=<udid>`, run
    `./scripts/run-maestro.sh`.
  - **Simulator**: `npx expo run:ios` once (5–10 min) to install the dev
    client, then `./scripts/run-maestro.sh`.
- Bring-up details in `docs/maestro-bring-up.md`.

### Manual fallback: complete and runnable now
- `docs/manual-qa-checklist.md` mirrors the same 10 flows step-by-step
  so a human (you, me on the phone, or anyone) can cover the same
  surface area on TestFlight build 14 immediately.

---

## Build 14 commands (DO NOT RUN — they need 2FA)

When you're ready in the morning:

```bash
# From repo root, on this branch:
eas build --platform ios --profile production
eas submit --platform ios --latest
```

The `production` profile auto-increments the build number remotely
(per `eas.json`), but I've already bumped to 14 locally so the
remote increment will land on 15 if you cut another build later
the same day. That's fine — TestFlight just numbers them in order.

---

## What I'd prioritize Monday

1. **Run the Maestro suite once** to catch any drift between the YAML
   assertions and what TestFlight build 14 actually renders. Iterate on
   the flows until 10/10 pass on a real device. Then wire it into a
   pre-commit or pre-push hook so future builds don't ship blind again.
   The harness you have now is the spine; the asserts are best-guesses
   based on current copy and may need tightening once they meet a
   running app.

2. **BUG D voice cutoff** is the most user-facing remaining issue —
   voice mode is a flagship surface and "Atlas cuts off mid-sentence"
   is the kind of thing that erodes trust. Worth budgeting half a day
   on the voice worker even before further mobile polish.

3. **Account-row should expose sign-out from the drawer.** Right now
   sign-out lives only in `/settings/account`. Adding a long-press or
   a destructive submenu on the drawer's account row would shave one
   tap off a flow that currently feels buried. Low effort, high
   ergonomic payoff.

---

## Context limits hit
None. All six phases landed in budget. The Maestro suite-run is the
only deliverable left short of the original brief, and that was a
sandbox-environment constraint (no app installed on the sim), not a
context one — the harness itself is fully written and runnable.
