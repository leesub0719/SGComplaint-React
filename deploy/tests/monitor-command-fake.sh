#!/usr/bin/env bash
set -euo pipefail
case "$(basename "$0")" in
  flock) exit 0 ;;
  systemctl)
    [[ "${SCENARIO:-healthy}" != inactive || "${*: -1}" != mysql ]]
    ;;
  curl)
    case "${SCENARIO:-healthy}" in
      httpfail) exit 22 ;;
      invalidbody) printf '{"status":"DOWN"}\n' ;;
      *) printf '{"status":"UP"}\n' ;;
    esac
    ;;
  df)
    printf 'Filesystem 1024-blocks Used Available Capacity Mounted\n'
    if [[ "${SCENARIO:-healthy}" == diskfull ]]; then
      printf '/dev/test 100 90 10 90%% /opt/sgcomplaint\n'
    else
      printf '/dev/test 100 20 80 20%% /opt/sgcomplaint\n'
    fi
    ;;
  *) exit 2 ;;
esac

