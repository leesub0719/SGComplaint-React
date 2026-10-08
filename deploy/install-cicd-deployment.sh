#!/usr/bin/env bash
set -euo pipefail

[[ "$EUID" -eq 0 ]] || { echo "Run with sudo." >&2; exit 2; }
here=$(cd "$(dirname "$0")" && pwd)

for command in install visudo getent systemctl; do
  command -v "$command" >/dev/null || { echo "Missing command: $command" >&2; exit 2; }
done
getent passwd sgadmin >/dev/null || { echo "Missing user: sgadmin" >&2; exit 2; }
getent group sgcomplaint >/dev/null || { echo "Missing group: sgcomplaint" >&2; exit 2; }
systemctl cat sgcomplaint >/dev/null || { echo "Missing unit: sgcomplaint" >&2; exit 2; }

for file in sgcomplaint-deploy sgcomplaint-deploy.sudoers db-migrate.sh; do
  [[ -f "$here/$file" ]] || { echo "Missing file: $here/$file" >&2; exit 2; }
done

install -d -o root -g sgcomplaint -m 0750 \
  /opt/sgcomplaint/app /opt/sgcomplaint/backup
install -d -o sgadmin -g sgcomplaint -m 0750 \
  /opt/sgcomplaint/incoming
install -o root -g root -m 0755 \
  "$here/sgcomplaint-deploy" /usr/local/sbin/sgcomplaint-deploy
install -o root -g sgcomplaint -m 0750 \
  "$here/db-migrate.sh" /opt/sgcomplaint/app/db-migrate.sh
install -o root -g root -m 0440 \
  "$here/sgcomplaint-deploy.sudoers" /etc/sudoers.d/sgcomplaint-deploy
visudo -cf /etc/sudoers.d/sgcomplaint-deploy

echo "CI/CD deployment helper installed. The application was NOT restarted."
echo "Next: register the GitHub Actions runner as sgadmin with label sgcomplaint-prod."
