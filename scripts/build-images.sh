#!/usr/bin/env bash
# Build Pulse images into the Minikube Docker daemon (no external registry required).
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MONITOR_IMAGE="${MONITOR_IMAGE:-pulse/monitor-service:local}"
CHECKER_IMAGE="${CHECKER_IMAGE:-pulse/checker-service:local}"

if ! command -v minikube >/dev/null 2>&1; then
  echo "minikube is required" >&2
  exit 1
fi

if ! minikube status >/dev/null 2>&1; then
  echo "Minikube is not running. Start it with scripts/setup-cluster.sh" >&2
  exit 1
fi

echo "Pointing Docker CLI at the Minikube daemon..."
eval "$(minikube docker-env)"

echo "Building ${MONITOR_IMAGE}..."
docker build -f "${ROOT_DIR}/apps/monitor-service/Dockerfile" -t "${MONITOR_IMAGE}" "${ROOT_DIR}"

echo "Building ${CHECKER_IMAGE}..."
docker build -f "${ROOT_DIR}/apps/checker-service/Dockerfile" -t "${CHECKER_IMAGE}" "${ROOT_DIR}"

echo "Images available in Minikube:"
docker images --format 'table {{.Repository}}:{{.Tag}}\t{{.ID}}\t{{.Size}}' \
  | awk 'NR==1 || /pulse\/(monitor|checker)-service/'
