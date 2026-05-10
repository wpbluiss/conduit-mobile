#!/usr/bin/env bash
# Praxis Console — Maestro QA harness
#
# Boots the iOS simulator, brings up Expo dev server, runs every flow in
# .maestro/, and writes a per-flow pass/fail report to docs/.
#
# Usage:
#   ./scripts/run-maestro.sh                  # full suite
#   ./scripts/run-maestro.sh 04_existing_chat # one flow (filename or stem)
#
# Requirements:
#   - Maestro CLI on $PATH (curl -Ls "https://get.maestro.mobile.dev" | bash)
#   - Java 11+ (Maestro needs it; `brew install openjdk` works)
#   - Xcode + an iOS 26 simulator
#
# The script does NOT install the production app; it relies on Expo Go
# loading the dev bundle. Maestro launches against bundleId io.conduitai.app
# which the dev client registers as.

set -euo pipefail

cd "$(dirname "$0")/.."
REPO_ROOT="$(pwd)"

# ── Paths / env ──────────────────────────────────────────────────────────
export PATH="$PATH:$HOME/.maestro/bin:/opt/homebrew/opt/openjdk/bin"
if [ -z "${JAVA_HOME:-}" ] && [ -d "/opt/homebrew/opt/openjdk" ]; then
  export JAVA_HOME="/opt/homebrew/opt/openjdk"
fi

REPORT_DIR="$REPO_ROOT/docs"
mkdir -p "$REPORT_DIR"
TS="$(date +%Y-%m-%d_%H%M%S)"
REPORT="$REPORT_DIR/maestro-results-$TS.md"
LOG_DIR="$REPO_ROOT/.maestro/logs/$TS"
mkdir -p "$LOG_DIR"

# ── Pre-flight ───────────────────────────────────────────────────────────
echo "▸ Maestro version:"
if ! maestro --version >/dev/null 2>&1; then
  echo "✘ maestro not runnable (Java missing?). Try: brew install openjdk"
  exit 2
fi
maestro --version | head -1

echo "▸ Booting iOS simulator…"
DEVICE_NAME="${PRAXIS_SIMULATOR:-iPhone 17 Pro}"
DEVICE_UDID="$(xcrun simctl list devices available | grep -E "^\s*$DEVICE_NAME " | head -1 | awk -F '[()]' '{print $2}')"
if [ -z "$DEVICE_UDID" ]; then
  DEVICE_UDID="$(xcrun simctl list devices booted | grep -E '\\(.*\\)\\s+\\(Booted\\)' | head -1 | awk -F '[()]' '{print $2}')"
fi
if [ -z "$DEVICE_UDID" ]; then
  echo "✘ No usable iOS simulator found. Set PRAXIS_SIMULATOR=<name>."
  exit 3
fi

xcrun simctl boot "$DEVICE_UDID" 2>/dev/null || true
open -a Simulator
sleep 3

# ── Expo dev server ──────────────────────────────────────────────────────
EXPO_PID_FILE="$LOG_DIR/expo.pid"
if pgrep -f "expo start" >/dev/null; then
  echo "▸ Expo dev server already running — reusing it."
else
  echo "▸ Starting Expo dev server…"
  ( cd "$REPO_ROOT" && npx expo start --ios --no-dev --minify >"$LOG_DIR/expo.log" 2>&1 ) &
  EXPO_PID=$!
  echo "$EXPO_PID" >"$EXPO_PID_FILE"
  # Wait for "Bundling complete" or the websocket to come up.
  for i in $(seq 1 60); do
    if grep -qiE "Bundling complete|Logs for your project" "$LOG_DIR/expo.log" 2>/dev/null; then
      break
    fi
    sleep 2
  done
fi

# Give the app another moment to attach.
sleep 5

# ── Run flows ────────────────────────────────────────────────────────────
PASS=0
FAIL=0
RESULTS=()

if [ "${1:-}" != "" ]; then
  FILTER="$1"
  FLOWS="$(ls .maestro/*.yaml | grep -v "^\\.maestro/_" | grep "$FILTER" || true)"
else
  FLOWS="$(ls .maestro/*.yaml | grep -v "^\\.maestro/_")"
fi

if [ -z "$FLOWS" ]; then
  echo "✘ No matching flows."
  exit 1
fi

for flow in $FLOWS; do
  name="$(basename "$flow" .yaml)"
  echo
  echo "──────────────────────────────────────────────────────────"
  echo "▸ FLOW: $name"
  echo "──────────────────────────────────────────────────────────"
  log="$LOG_DIR/$name.log"
  if maestro --device "$DEVICE_UDID" test "$flow" >"$log" 2>&1; then
    PASS=$((PASS + 1))
    RESULTS+=("✓ $name")
    echo "✓ PASS"
  else
    FAIL=$((FAIL + 1))
    RESULTS+=("✘ $name (see $log)")
    echo "✘ FAIL — last 20 lines:"
    tail -20 "$log" | sed 's/^/    /'
  fi
done

# ── Report ───────────────────────────────────────────────────────────────
{
  echo "# Maestro results — $TS"
  echo
  echo "**Pass:** $PASS  **Fail:** $FAIL"
  echo
  echo "## Per-flow"
  for r in "${RESULTS[@]}"; do echo "- $r"; done
  echo
  echo "## Logs"
  echo "Per-flow logs in \`$LOG_DIR\`."
} >"$REPORT"

echo
echo "──────────────────────────────────────────────────────────"
echo "▸ Report: $REPORT"
echo "▸ $PASS pass, $FAIL fail"
echo "──────────────────────────────────────────────────────────"

exit $FAIL
