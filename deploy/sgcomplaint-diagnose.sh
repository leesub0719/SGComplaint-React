#!/usr/bin/env bash
set -euo pipefail
umask 077
[[ "$EUID" -eq 0 ]] || { echo "Run with sudo." >&2; exit 2; }
root="/var/lib/sgcomplaint-monitor/diagnostics"
install -d -m 0700 "$root"
report=$(mktemp -d "$root/report-$(date -u +%Y%m%dT%H%M%SZ)-XXXXXX")
{
  date -u
  for service in sgcomplaint mysql nginx; do
    systemctl show "$service" -p ActiveState -p SubState -p Result -p NRestarts || true
  done
  df -h /opt/sgcomplaint
  free -m
  ss -ltn
  curl --silent --show-error --fail --connect-timeout 3 --max-time 10 \
    --max-filesize 16384 http://127.0.0.1:9081/actuator/health || true
} > "$report/status.txt" 2>&1
for service in sgcomplaint mysql nginx sgcomplaint-monitor; do
  journalctl -u "$service" --since "30 minutes ago" -n 300 --no-pager -o short-iso \
    > "$report/$service.log" 2>&1 || true
done
echo "Saved root-only diagnostics: $report"
echo "Logs may contain personal data. Redact before sharing. No env file or DB rows were copied."

