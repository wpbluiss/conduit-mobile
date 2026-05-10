# Maestro QA — first-run bring-up

The harness lives in `.maestro/` (10 flows + `_shared.yaml`) and is
driven by `scripts/run-maestro.sh`. Running it for the first time on a
fresh machine is a one-time ~10-minute setup.

## Prerequisites (one-time)
1. **Java** — Maestro is JVM. Already installed on this machine via
   Homebrew (`brew install openjdk` → `/opt/homebrew/opt/openjdk`).
2. **Maestro CLI** — installed at `~/.maestro/bin/maestro`. The runner
   shims `$PATH` for you.
3. **iOS simulator** — Xcode + an iPhone 17 Pro device (default; override
   with `PRAXIS_SIMULATOR=<device-name>`).

The runner sets `JAVA_HOME` and prepends Maestro to `$PATH`, so once
those three are present you can ignore them in your shell config.

## First run — getting the app on the sim
Maestro launches by bundle id (`io.conduitai.app`). The app must be
installed on the simulator before flows can run. Two options:

### Option A — TestFlight build on a real device (recommended)
1. Plug in iPhone with Praxis build 14 from TestFlight.
2. `xcrun simctl list devices` — copy the iPhone's UDID.
3. `PRAXIS_SIMULATOR="<udid>" ./scripts/run-maestro.sh`

### Option B — Expo dev client on the simulator
1. `npx expo run:ios` (5–10 min first time; compiles the dev client and
   installs it on the booted sim).
2. `./scripts/run-maestro.sh`

The runner reuses any already-running `expo start` rather than spawning
a second one.

## Per-flow run
```bash
./scripts/run-maestro.sh 04_existing_chat   # only the BUG A regression
```

## Output
- `docs/maestro-results-<timestamp>.md` — per-flow pass/fail
- `.maestro/logs/<timestamp>/<flow>.log` — full Maestro stdout per flow

## Triage rules (per Luis)
- A flow fails → **fix the bug, not the test** — flows are the
  acceptance criteria.
- Cap fixes at 3 attempts per flow before deferring; document the flow
  + symptom in the next overnight report and move on.

## Known gaps (filed as future work)
- No swipe-from-edge gesture for the drawer in build 14 — flow 02 uses a
  point-tap on the hamburger. Add a swipe-open gesture and update the
  flow once that lands.
- Voice modal flow 07 closes via downward swipe. If we add a close
  button later, prefer asserting that target's text/id over the swipe.
- Flow 05 hits the live `/api/conduit/chat` endpoint on conduitai.io.
  Failures there are infra, not the app — runner does not yet
  distinguish.
