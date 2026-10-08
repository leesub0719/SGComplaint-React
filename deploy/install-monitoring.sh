#!/usr/bin/env bash
set -euo pipefail
[[ "$EUID" -eq 0 ]] || { echo "Run with sudo." >&2; exit 2; }
here=$(cd "$(dirname "$0")" && pwd)
for command in systemctl curl flock install; do
  command -v "$command" >/dev/null || { echo "Missing command: $command" >&2; exit 2; }
done
for service in sgcomplaint mysql nginx; do
  systemctl cat "$service" >/dev/null || { echo "Missing unit: $service" >&2; exit 2; }
done
for file in sgcomplaint-monitor.sh sgcomplaint-diagnose.sh sgcomplaint-monitor.service sgcomplaint-monitor.timer sgcomplaint-recovery.conf; do
  [[ -f "$here/$file" ]] || { echo "Missing file: $here/$file" >&2; exit 2; }
done
install -d -m 0755 /usr/local/lib/sgcomplaint /etc/systemd/system/sgcomplaint.service.d
install -m 0755 "$here/sgcomplaint-monitor.sh" /usr/local/lib/sgcomplaint/sgcomplaint-monitor.sh
install -m 0755 "$here/sgcomplaint-diagnose.sh" /usr/local/lib/sgcomplaint/sgcomplaint-diagnose.sh
install -m 0644 "$here/sgcomplaint-monitor.service" /etc/systemd/system/sgcomplaint-monitor.service
install -m 0644 "$here/sgcomplaint-monitor.timer" /etc/systemd/system/sgcomplaint-monitor.timer
install -m 0644 "$here/sgcomplaint-recovery.conf" /etc/systemd/system/sgcomplaint.service.d/90-monitoring-recovery.conf
systemctl daemon-reload
systemctl enable --now sgcomplaint-monitor.timer
echo "Monitoring timer installed. Application was NOT restarted."
echo "Health URL must be http://127.0.0.1:9081/actuator/health."

