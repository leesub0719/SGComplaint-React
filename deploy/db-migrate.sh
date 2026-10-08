#!/usr/bin/env bash
set -euo pipefail

# No source/eval: systemd reads the same EnvironmentFile as the application service.
command="${1:-info}"
case "$command" in
  check|baseline|info|migrate|validate) ;;
  *) echo "Usage: sudo bash db-migrate.sh {check|baseline|info|migrate|validate}" >&2; exit 2 ;;
esac
if [[ "$EUID" -ne 0 ]]; then
  echo "Run this script with sudo." >&2
  exit 2
fi

jar="/opt/sgcomplaint/app/sgcomplaint.jar"
env_file="/etc/sgcomplaint/sgcomplaint.env"
[[ -f "$jar" ]] || { echo "JAR not found: $jar" >&2; exit 2; }
[[ -f "$env_file" ]] || { echo "Environment file not found: $env_file" >&2; exit 2; }

exec systemd-run --quiet --wait --pipe --collect \
  --property=User=sgcomplaint --property=Group=sgcomplaint \
  --property="EnvironmentFile=$env_file" \
  --property=WorkingDirectory=/opt/sgcomplaint \
  /usr/bin/java -Xms64m -Xmx256m -Dfile.encoding=UTF-8 \
  -Dloader.main=com.transit.SGComplaint.migration.DatabaseMigrationTool \
  -cp "$jar" org.springframework.boot.loader.launch.PropertiesLauncher "$command"
