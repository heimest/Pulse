#!/usr/bin/env bash
# Remove Pulse mesh resources (keeps Istio and the Minikube cluster).
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
K8S_DIR="${ROOT_DIR}/infra/k8s"

if ! command -v kubectl >/dev/null 2>&1; then
  echo "kubectl is required" >&2
  exit 1
fi

echo "Deleting optional policies and workloads..."
kubectl delete -f "${K8S_DIR}/circuit-breaker.yaml" --ignore-not-found
kubectl delete -f "${K8S_DIR}/enforce-mtls.yaml" --ignore-not-found
kubectl delete -f "${K8S_DIR}/microservices.yaml" --ignore-not-found
kubectl delete -f "${K8S_DIR}/infrastructure.yaml" --ignore-not-found
kubectl delete -f "${K8S_DIR}/secret.yaml" --ignore-not-found
kubectl delete -f "${K8S_DIR}/configmap.yaml" --ignore-not-found

echo "Teardown complete. Stop the cluster with: minikube stop"
