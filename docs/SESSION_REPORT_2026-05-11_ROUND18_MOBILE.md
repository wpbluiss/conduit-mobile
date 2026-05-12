# Praxis Mobile R18 — session report
Date: 2026-05-11
Branch: `feat/praxis-console-mobile-rebuild-2026-05-08`
Builds: R17 (build 17, finished) → R18 (build 18, queued)

---

## Scope

R17 left three bugs Luis could see on TestFlight:

1. Welcome screen still rendering `Luisinvestments` instead of `Luis`
   despite a server-side `display_name` update.
2. Drawer ghost-rail fix needed confirmation in the shipped IPA.
3. New-conversation send-and-render fix needed the same confirmation.

R18 also adds three visual items: tighter conversation rows with
preview text, a re-verified violet P badge, and avatar parity with
Lunaro's R18 icon system.

---

## Bug 1 — display name (the one that mattered)

**Symptom.** Welcome screen renders the cleaned-email fallback
(`Luisinvestments`) instead of `Luis`.

**What was confirmed.** Direct SQL against the project:

```sql
SELECT raw_user_meta_data->>'display_name' AS display_name,
       raw_user_meta_data->>'full_name'    AS full_name
FROM auth.users
WHERE email = 'luisinvestments101@gmail.com';
```

→ `display_name = "Luis"`, `full_name = null`. The data is in the
right column on the right row. So the bug is in the read path, not
the write path.

**Root cause.** The Supabase JS client persists the session to
SecureStore on sign-in. `session.user` is rehydrated from that cached
JWT on every launch — and the JWT carries `user_metadata` *as of the
moment the token was issued*. Luis's `UPDATE auth.users …` write did
not invalidate the cached JWT, did not invalidate the SecureStore
copy, and does not get refetched by `getSession()` (which is purely
local). The next time the access token auto-refreshes (≤1 h) the new
JWT will carry the fresh metadata, but anyone launching the app
before that window keeps seeing stale data.

`deriveDisplayName(user)` was already correctly chained
(`display_name → full_name → email`), but `user_metadata.display_name`
was `undefined` at call time, so it fell through to the email
cleaner and produced `Luisinvestments`. The fallback was working
exactly as designed against bad input.

**Fix.** `store/authStore.ts:initialize()` now calls
`supabase.auth.getUser()` immediately after the cached session is
restored. That endpoint round-trips to `/auth/v1/user` and returns
the live row from `auth.users`, including current `raw_user_meta_data`.
The live `user` replaces the cached one in the Zustand store, so the
welcome screen — and the drawer account-row initial — pick it up on
the first render. Errors from `getUser` are warn-logged but
non-fatal; we keep whatever the cached session gave us.

A `console.log("[Auth] user_metadata at launch:", …)` was added so
the next time something like this drifts, the answer is one line
into the Metro/Xcode console instead of a guess.

**Read-path consolidation.** R17 had `deriveDisplayName` inline in
`ChatShell.tsx` and the drawer was using its own one-off
`full_name → email` chain. Both now route through
`lib/conduit/displayName.ts` (`deriveDisplayName` + `deriveInitial`),
so the next time the priority chain shifts there is one place to
edit.

---

## Bug 2 / Bug 3 — verifying R17 fixes landed

Build 17 finished cleanly:

| Field | Value |
|------|------|
| ID | `cb6150b0-68f0-4b4a-b911-85c9c5e40098` |
| Status | finished |
| Commit | `2ca98992` (build bump on top of all R17 fixes) |
| IPA | https://expo.dev/artifacts/eas/r7CjRgXhDzWQngDGJo1tcN.ipa |

`DRAWER_WIDTH = SCREEN_WIDTH` is on `Drawer.tsx:45` in the commit
that build 17 was cut from. `router.replace` is gone from
`handleSend` in the same tree. Both fixes are in the shipped IPA.
TestFlight install + manual sanity-check is Luis's verification
step; no code on this side needs to change.

(Could not run a Puppeteer screenshot because the production iOS
app does not render in a web context, and there is no iOS simulator
binary in this environment. If we want gated screenshot proof going
forward, the Maestro harness in `.maestro/` is the right hook — it
just needs one flow per regression we care about.)

---

## Bug 4 — conversation row density

R17 went from "title over `about 3 hours ago` timestamp" to
"single-row title plus right-aligned short timestamp", which was the
right direction but read closer to Slack than to iMessage. R18 takes
the row to a two-line iMessage pattern:

- **Padding.** 12 px vertical (was 9), 16 px horizontal. Total row
  height ≈ 64 px with the second line; matches iMessage on a Pro Max.
- **Title.** `variant="body"` (15 px) `weight="semibold"`. Active row
  flips colour to `indigo500`; non-active stays `inkPrimary`.
- **Timestamp.** 12 px Inter, `tertiary`, right-aligned on the title
  line. Same `formatRowTimestamp` from R17 — today shows `10:42 AM`,
  yesterday shows `Yesterday`, within a week shows the weekday,
  older shows `Mar 5`.
- **Preview.** New second line, 13 px Inter, `tertiary`,
  `numberOfLines=1`. Pulled from the most recent message on the
  thread. `listConversations` now does a batched `IN ()` query for
  messages on the visible conversations, groups client-side, takes
  the latest per conversation, runs the content through the same
  defensive normalizer chat uses (handles legacy
  `[{type:"text",text:"…"}]` shapes), trims whitespace, and slices
  to 140 chars. If the second message-fetch fails, the row gracefully
  falls back to title-only.
- **Unread dot.** 8 px circle in `violet700` reserved in an 8 px
  left gutter. `isUnread` is hard-coded `false` for now — the DB
  does not have `last_read_at` yet. When that lands, this is the
  one line to flip.

---

## Bug 5 — P badge colour

Confirmed against `WelcomeState.tsx:43`:

```ts
backgroundColor: t.colors.violet700,
borderColor: t.colors.violet800,
```

In `praxis-tokens.ts`, light-theme `violet700 = "#6D28D9"` (matches
the spec; oklch ≈ 47 % 0.22 290). Dark-theme `violet700 = "#7C3AED"`,
which is the correct lighter-shade analogue against the dark
canvas. No change needed.

---

## Bug 6 — avatar parity with Lunaro

Lunaro's R18 ships a role-icon avatar system on `lucide-react-native`.
Praxis was on Phosphor — same intent (Compass/Code/TrendUp/Sparkle),
slightly different glyph weights. Migrated just the avatar so the
two apps read as one system when seen side-by-side:

| Employee   | Phosphor → Lucide       | bg              |
|------------|-------------------------|-----------------|
| atlas      | Compass → Compass       | `#6D28D9`       |
| engineering| Code → Code2            | `#5B63E8`       |
| sales      | TrendUp → TrendingUp    | `#0E8A55`       |
| marketing  | Sparkle → Sparkles      | `#D67817`       |
| team       | UsersThree → Users      | `#5B63E8`       |
| others     | Sparkle → Sparkles      | `#4A5160`       |

R14 palette (atlas violet-700, engineering indigo-500, sales success,
marketing ember, neutral slate) is unchanged. `strokeWidth={2.25}`
roughly matches Phosphor's `weight="bold"` at avatar sizes.

The rest of the app stays on Phosphor for this round — drawer
chrome, composer, top bar, settings, voice controls all still
import from `phosphor-react-native`. Migrating those is its own
PR; doing it inside R18 would have inflated scope past the punch
list.

---

## Build 18

Commits on `feat/praxis-console-mobile-rebuild-2026-05-08`:

```
3a08b09 build: bump to 1.1.1 build 18 for TestFlight
0305e6d feat(avatar): migrate EmployeeAvatar to lucide icons for Lunaro parity
1c4f3d4 style(drawer): two-line iMessage rows with preview + unread affordance
ff8b4d9 fix(auth): refresh user_metadata on launch so display_name lands
```

EAS build URL + IPA artifact + manual submit command are at the end
of the chat thread, not pasted here.

---

## Still rough

- **Auto-submit.** `eas.json submit.production` still has no `ios`
  block, so `--auto-submit --non-interactive` keeps failing right
  after the build queues. Manual `eas submit --platform ios --id <build-id>`
  is the workaround until someone fills in `ascAppId` /
  `appleTeamId` (or sets up an ASC API key). One-line fix; not
  done in R18 to avoid stalling on Luis's credentials.

- **Unread state.** Wired up in the row layout but not in the data
  model. Needs `conduit_conversations.last_read_at` (or a separate
  read-receipts table) plus an `is_unread` derivation on the list
  query. Probably a 30-min DB migration plus a query tweak.

- **Preview-fetch cost.** `listConversations` does a second batched
  query for *every* message on the listed conversations and discards
  all but the latest per thread. At Luis's current scale (≤20
  conversations, a few hundred messages total) this is invisible.
  At 200 conversations × 50 messages it would be 10 000 rows for
  ~200 useful ones. The fix when it matters is a Postgres RPC with
  `SELECT DISTINCT ON (conversation_id) … ORDER BY conversation_id,
  created_at DESC`, or a denormalized `last_message_preview` column
  on `conduit_conversations` kept in sync by a trigger.

- **Lucide partial migration.** Drawer, composer, top bar, error
  boundary, voice, settings still import from `phosphor-react-native`.
  Visually fine — the icon shapes are similar — but bundle size now
  includes both libraries. Worth doing the full sweep in one focused
  PR rather than incrementally drifting.

- **Maestro flows.** The harness from build 14 still has zero asserts
  exercised against the running app. The R17 empty-thread bug would
  have been caught by a single "send → assert message visible" flow.
  Adding that one flow before R19 would pay for itself.
