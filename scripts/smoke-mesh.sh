#!/usr/bin/env bash
# Smoke-test Pulse through the Istio gateway (requires ingress-forward.sh).
set -euo pipefail

BASE_URL="${BASE_URL:-http://127.0.0.1:31380}"
MONITOR_BASE="${BASE_URL}/monitor-service"
CHECKER_BASE="${BASE_URL}/checker-service"

echo "Checking monitor health via gateway..."
monitor_health="$(curl -fsS "${MONITOR_BASE}/health")"
echo "${monitor_health}"
echo "${monitor_health}" | grep -q '"status":"ok"'

monitor_ready="$(curl -fsS "${MONITOR_BASE}/health/ready")"
echo "${monitor_ready}"
echo "${monitor_ready}" | grep -q '"status":"ok"'

echo "Checking checker health via gateway..."
checker_health="$(curl -fsS "${CHECKER_BASE}/health")"
echo "${checker_health}"
echo "${checker_health}" | grep -q '"status":"ok"'

echo "Creating a monitor..."
CREATE="$(
  curl -fsS -X POST "${MONITOR_BASE}/monitors" \
    -H 'content-type: application/json' \
    -d '{"name":"Example","url":"https://example.com","intervalSeconds":30}'
)"
echo "${CREATE}"
MONITOR_ID="$(CREATE="${CREATE}" python3 -c 'import json,os; print(json.loads(os.environ["CREATE"])["id"])')"

echo "Triggering one checker cycle..."
curl -fsS -X POST "${CHECKER_BASE}/checks/run"
echo

echo "Reading check history..."
HISTORY="$(curl -fsS "${MONITOR_BASE}/monitors/${MONITOR_ID}/checks")"
echo "${HISTORY}"
HISTORY="${HISTORY}" MONITOR_ID="${MONITOR_ID}" python3 -c '
import json, os
history = json.loads(os.environ["HISTORY"])
assert len(history) >= 1, "expected at least one check result"
assert history[0]["monitorId"] == os.environ["MONITOR_ID"]
print("history ok")
'

echo "Deleting monitor..."
code="$(curl -fsS -o /dev/null -w '%{http_code}' -X DELETE "${MONITOR_BASE}/monitors/${MONITOR_ID}")"
test "${code}" = "204"

echo "Smoke mesh checks passed."
