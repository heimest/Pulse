#!/usr/bin/env bash
# Apply Pulse ConfigMap/Secret, infrastructure, microservices, then mTLS.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
K8S_DIR="${ROOT_DIR}/infra/k8s"
APPLY_MTLS="${APPLY_MTLS:-true}"

if ! command -v kubectl >/dev/null 2>&1; then
  echo "kubectl is required" >&2
  exit 1
fi

echo "Applying ConfigMap and Secret..."
kubectl apply -f "${K8S_DIR}/configmap.yaml"
kubectl apply -f "${K8S_DIR}/secret.yaml"

echo "Applying infrastructure (Postgres + Gateway)..."
kubectl apply -f "${K8S_DIR}/infrastructure.yaml"

echo "Waiting for Postgres to become ready..."
kubectl wait --for=condition=available --timeout=180s deployment/postgres

echo "Applying microservices (Deployments, Services, VirtualServices)..."
kubectl apply -f "${K8S_DIR}/microservices.yaml"

if [[ "${APPLY_MTLS}" == "true" ]]; then
  echo "Applying strict mTLS policies..."
  kubectl apply -f "${K8S_DIR}/enforce-mtls.yaml"
fi

echo "Waiting for application Deployments..."
kubectl wait --for=condition=available --timeout=180s deployment/monitor-service
kubectl wait --for=condition=available --timeout=180s deployment/checker-service

echo "Mesh deploy complete."
kubectl get pods,svc,gateway,virtualservice,destinationrule,peerauthentication -l app.kubernetes.io/part-of=pulse
echo
echo "Next: ./scripts/ingress-forward.sh"
echo "Then:  ./scripts/smoke-mesh.sh"
