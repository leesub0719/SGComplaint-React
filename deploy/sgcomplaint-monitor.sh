#!/usr/bin/env bash
set -euo pipefail
umask 077
state="${MONITOR_STATE_DIR:-/var/lib/sgcomplaint-monitor}"
maintenance="${MONITOR_MAINTENANCE_FILE:-/run/sgcomplaint-maintenance}"
port="${MONITOR_PORT:-9081}"
[[ "$port" =~ ^[0-9]+$ ]] && (( port >= 1 && port <= 65535 )) || exit 2
[[ ! -e "$maintenance" ]] || exit 0
mkdir -p "$state"
exec 9>"$state/lock"
flock -n 9 || exit 0
failures=0
if [[ -f "$state/failures" ]]; then
  read -r failures < "$state/failures" || failures=0
  [[ "$failures" =~ ^[0-9]{1,6}$ ]] || failures=0
fi
reasons=()
for service in sgcomplaint mysql nginx; do
  if ! systemctl is-active --quiet "$service"; then reasons+=("$service inactive"); fi
done
if ! body=$(curl --silent --show-error --fail --connect-timeout 3 --max-time 10 \
    --max-filesize 16384 "http://127.0.0.1:$port/actuator/health" 2>/dev/null); then
  reasons+=("health HTTP failed")
elif ! printf '%s' "$body" | grep -Eq '"status"[[:space:]]*:[[:space:]]*"UP"'; then
  reasons+=("health not UP")
fi
used=$(df -P /opt/sgcomplaint 2>/dev/null | awk 'NR==2 {gsub(/%/,"",$5); print $5}') || used=""
if [[ ! "$used" =~ ^[0-9]{1,3}$ ]]; then
  reasons+=("disk check failed")
elif (( used >= 85 )); then
  reasons+=("disk usage ${used}% >= 85%")
fi
if (( ${#reasons[@]} > 0 )); then
  failures=$(( failures < 999999 ? failures + 1 : 999999 ))
  if (( failures == 1 )); then printf 'WARN: %s\n' "${reasons[*]}"; fi
  if (( failures == 3 || failures % 15 == 0 )); then
    printf 'ALERT: consecutive_failures=%s; %s\n' "$failures" "${reasons[*]}"
  fi
  printf '%s\n' "$failures" > "$state/failures"
  printf 'UNHEALTHY %s\n' "${reasons[*]}" > "$state/status"
  exit 1
fi
if (( failures > 0 )); then printf 'RECOVERED: checks healthy after %s failed checks\n' "$failures"; fi
printf '0\n' > "$state/failures"
printf 'HEALTHY\n' > "$state/status"

