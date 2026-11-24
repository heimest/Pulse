#!/usr/bin/env bash
# Forward the Istio ingress gateway to localhost:31380 (course-compatible port).
set -euo pipefail

LOCAL_PORT="${LOCAL_PORT:-31380}"
GATEWAY_NS="${GATEWAY_NS:-istio-system}"

if ! command -v kubectl >/dev/null 2>&1; then
  echo "kubectl is required" >&2
  exit 1
fi

echo "Port-forwarding ${GATEWAY_NS}/deployment/istio-ingressgateway → 127.0.0.1:${LOCAL_PORT}"
echo "Leave this process running. Example:"
echo "  curl -fsS http://127.0.0.1:${LOCAL_PORT}/monitor-service/health"
echo

exec kubectl -n "${GATEWAY_NS}" port-forward deployment/istio-ingressgateway "${LOCAL_PORT}:8080"
