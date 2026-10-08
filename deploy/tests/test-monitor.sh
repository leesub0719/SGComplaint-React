#!/usr/bin/env bash
set -euo pipefail
here=$(cd "$(dirname "$0")" && pwd)
project=$(cd "$here/../.." && pwd)
mkdir -p "$project/build"
temp=$(mktemp -d "$project/build/test-monitor-XXXXXX")
mkdir -p "$temp/bin"
for name in systemctl curl df flock; do
  cp "$here/monitor-command-fake.sh" "$temp/bin/$name"
  chmod +x "$temp/bin/$name"
done
export PATH="$temp/bin:$PATH"
export MONITOR_STATE_DIR="$temp/state"
export MONITOR_MAINTENANCE_FILE="$temp/maintenance"
export SCENARIO=healthy
script="$project/deploy/sgcomplaint-monitor.sh"
bash "$script"
[[ "$( < "$temp/state/status")" == HEALTHY ]]
export SCENARIO=httpfail
for count in 1 2 3; do
  if bash "$script" > "$temp/output"; then echo "Expected unhealthy exit" >&2; exit 1; fi
done
grep -q ALERT "$temp/output"
[[ "$( < "$temp/state/failures")" == 3 ]]
export SCENARIO=healthy
bash "$script" > "$temp/output"
grep -q RECOVERED "$temp/output"
[[ "$( < "$temp/state/failures")" == 0 ]]
for scenario in inactive diskfull invalidbody; do
  export SCENARIO="$scenario"
  if bash "$script" > "$temp/output"; then echo "Expected failure: $scenario" >&2; exit 1; fi
done
touch "$MONITOR_MAINTENANCE_FILE"
bash "$script"
echo "MONITOR_TEST_OK: healthy, HTTP failure, 3-failure alert, recovery, MySQL inactive, disk full, DOWN body, maintenance"
echo "Isolated test files: $temp (no real systemctl/curl/df commands executed)"

