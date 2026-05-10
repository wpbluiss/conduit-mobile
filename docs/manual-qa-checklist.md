# Praxis Console mobile — manual QA checklist

Use this when Maestro isn't running (CI, real-device builds, or someone
without the toolchain). Every flow has a numbered, tappable repro. Mark
✅ when the repro renders the expected state with no crash, ❌ if anything
diverges, with a one-line note on what diverged. The 10 flows match
`.maestro/01_…` through `.maestro/10_…` 1:1 so the manual run can fill in
when the harness can't.

Test rig:
- Device: iPhone 17 Pro simulator (iOS 26.x) or a real iPhone with
  TestFlight build 14
- Account: signed-in TestFlight user with at least one conversation
  older than 7 days (covers BUG A regression)

Conventions:
- "Hamburger" = top-left List icon in ChatTopBar
- "Plus" = top-right Plus icon in ChatTopBar
- "Mic" = right-edge mic icon in the composer when empty
- "Send" = right-edge up-arrow icon in the composer when text is present
- "+" inside composer = the plus button on the left of the input

---

## 01 — App launches and lands on chat
1. Force-quit the app.
2. Tap the Praxis icon.
- ✅ App boots within ~2s and lands either in the most-recent thread
  (active resume) or the Welcome screen ("Good morning/afternoon, …").
- ✅ No red screen / crash dialog.
- ✅ "PRAXIS CONSOLE · vX.Y.Z (BUILD 14)" footer is visible.

## 02 — Drawer opens via the hamburger
1. From any chat surface, tap the hamburger.
- ✅ Drawer slides in from the left with spring animation.
- ✅ Sections visible (top → bottom): CONVERSATIONS, search bar, the
  conversation list, PINNED, WORKSPACE, and an Account row.

## 03 — Drawer routes navigate
For each row below: open the drawer, tap the row, confirm the destination
loads, then back-swipe to chat.
- ✅ **Builds** → builds index renders (empty state acceptable).
- ✅ **Team** → team grid lists all 9 employees: Atlas, Engineering, Sales,
  Marketing, Finance, Compliance, HR, Ops, Legal.
- ✅ **Memory** → memory screen renders.
- ✅ **Settings** → settings index renders, sub-rows tappable.
- ✅ **Account row (bottom)** → opens settings/account with the user's
  email displayed.

## 04 — Existing chat opens (BUG A regression)
1. Open the drawer.
2. Scroll to "Last 7 days" (or "Earlier") group.
3. Tap an older thread.
- ✅ Either the messages render, the empty-state ("EMPTY THREAD")
  renders, or a loading skeleton flashes briefly first.
- ❌ App must NOT crash, must NOT show a red screen, must NOT freeze
  on a blank screen.
- ✅ Top bar shows the thread title and "with <Employee>" subtitle if
  the thread has a dominant employee.

## 05 — New chat round-trip
1. Tap the top-right plus → land on Welcome state.
2. Tap into the composer, type "smoke test ping".
3. Tap Send.
- ✅ Composer clears.
- ✅ Streaming dots appear, then a streaming bubble fills with response.
- ✅ When stream completes, no waiting indicator remains.
- ✅ A new thread row appears in the drawer's "Today" group within ~2s
  of the first response.

## 06 — ROUTE TO routes the conversation (BUG B regression)
1. Land on Welcome state (new chat).
2. Scroll to "ROUTE TO" panel.
3. Tap **The team**.
- ✅ Subtitle of top bar shows "Routing to the team".
- ✅ Composer focus is set, no @mention pre-fill.
4. Tap top-right plus to start over.
5. On Welcome state, tap **Engineering**.
- ✅ Composer prefills with "@Engineering ".
- ✅ Subtitle shows "Routing to Engineering".
6. Tap Send.
- ✅ Response routes to Engineering (banner above the assistant bubble
  reads "ENGINEERING").

## 07 — Voice modal
1. From a chat with an empty composer, tap the mic icon (right side of
   composer).
- ✅ Modal slides up from the bottom with eclipse-aurora background.
- ✅ Captions / orb visible.
2. Swipe down on the modal.
- ✅ Modal dismisses, returns to chat surface.

## 08 — Settings sub-screens
1. Open the drawer → tap Settings.
- ✅ Settings index renders with sub-rows.
2. Tap each sub-row in turn:
- ✅ **Account** — email rendered, sign-out option visible.
- ✅ **Appearance** — theme toggle (system/light/dark) responds.
- ✅ **Voice prefs** — toggle/slider rows render.
- ✅ **Memory** — memory list renders.

## 09 — Builds index
1. Drawer → Builds.
- ✅ Page header reads "Builds".
- ✅ Either an empty state ("No builds yet") or a list of build rows.

## 10 — Team grid
1. Drawer → Team.
- ✅ All 9 employees render in the grid: Atlas, Engineering, Sales,
  Marketing, Finance, Compliance, HR, Ops, Legal.
- ✅ Tapping any employee opens a per-employee screen with their title
  and blurb.
